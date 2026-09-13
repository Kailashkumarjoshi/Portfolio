import type { SortKey, StoryEvent, StoryFilters } from './types';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'memory';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Formats without `Date` parsing so the string never shifts across timezones. */
export function formatEventDate(iso: string | null, label?: string | null): string {
  if (label) return label;
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y) return '';
  if (!m) return String(y);
  const month = MONTHS[m - 1] ?? '';
  return d ? `${month} ${d}, ${y}` : `${month} ${y}`;
}

export function eventYear(event: StoryEvent): string | null {
  return event.event_date ? event.event_date.slice(0, 4) : null;
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "1:23" | "83" | "1:23.5" -> seconds. Returns null for empty/invalid input. */
export function parseClock(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) return Number(raw);
  const parts = raw.split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n) || n < 0)) return null;
  return nums.reduce((acc, n) => acc * 60 + n, 0);
}

export function hasKind(event: StoryEvent, kinds: StoryEvent['media'][number]['kind'][]): boolean {
  return event.media.some((m) => kinds.includes(m.kind));
}

export function applyFilters(events: StoryEvent[], filters: StoryFilters): StoryEvent[] {
  return events.filter((event) => {
    if (filters.media === 'photos' && !hasKind(event, ['photo'])) return false;
    if (filters.media === 'videos' && !hasKind(event, ['video', 'embed'])) return false;
    if (filters.year !== 'all' && eventYear(event) !== filters.year) return false;
    if (filters.chapter !== 'all' && (event.chapter ?? '') !== filters.chapter) return false;
    if (filters.mood !== 'all' && event.mood !== filters.mood) return false;
    if (filters.milestonesOnly && !event.is_milestone) return false;
    return true;
  });
}

export function applySort(events: StoryEvent[], sort: SortKey): StoryEvent[] {
  const list = [...events];
  switch (sort) {
    case 'story':
      return list.sort((a, b) => a.sort_order - b.sort_order);
    case 'story_desc':
      return list.sort((a, b) => b.sort_order - a.sort_order);
    case 'oldest':
      return list.sort(byDate(1));
    case 'newest':
      return list.sort(byDate(-1));
    default:
      return list;
  }
}

function byDate(direction: 1 | -1) {
  return (a: StoryEvent, b: StoryEvent) => {
    // Undated memories keep their curated position at the end of the run.
    if (!a.event_date && !b.event_date) return a.sort_order - b.sort_order;
    if (!a.event_date) return 1;
    if (!b.event_date) return -1;
    if (a.event_date === b.event_date) return a.sort_order - b.sort_order;
    return a.event_date < b.event_date ? -direction : direction;
  };
}

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'story', label: 'Our order · first to last' },
  { key: 'story_desc', label: 'Our order · last to first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'newest', label: 'Newest first' },
];

/** Deterministic 0..1 pseudo-random from an integer seed — keeps yarn curves stable across renders. */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Parses #rgb / #rrggbb into [r,g,b]. Falls back to a dusty rose. */
function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return [196, 129, 143];
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/**
 * Moves a colour toward black (negative) or white (positive) by `amount` (0..1).
 * Used to build the cylindrical shading of the yarn from a single dye colour.
 */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const mix = (channel: number) =>
    Math.round(amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
