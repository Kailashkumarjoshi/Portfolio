import type { MediaItem, SiteSettings, SongConfig, StoryEvent } from '../types';

type Row = Record<string, unknown>;

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v : null;
const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const bool = (v: unknown, fallback = false): boolean =>
  typeof v === 'boolean' ? v : fallback;

export function songFromRow(row: Row, prefix = 'song_'): SongConfig | null {
  const url = str(row[`${prefix}url`]);
  if (!url) return null;
  const end = row[`${prefix}end_seconds`];
  return {
    url,
    title: str(row[`${prefix}title`]),
    artist: str(row[`${prefix}artist`]),
    start_seconds: Math.max(0, num(row[`${prefix}start_seconds`], 0)),
    end_seconds: typeof end === 'number' && Number.isFinite(end) ? end : null,
  };
}

export function songToRow(song: SongConfig | null, prefix = 'song_'): Row {
  return {
    [`${prefix}url`]: song?.url ?? null,
    [`${prefix}title`]: song?.title ?? null,
    [`${prefix}artist`]: song?.artist ?? null,
    [`${prefix}start_seconds`]: song?.start_seconds ?? 0,
    [`${prefix}end_seconds`]: song?.end_seconds ?? null,
  };
}

export function mediaFromRow(row: Row): MediaItem {
  const kind = row.kind;
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    kind: kind === 'video' || kind === 'embed' ? kind : 'photo',
    url: str(row.url) ?? '',
    storage_path: str(row.storage_path),
    caption: str(row.caption),
    poster_url: str(row.poster_url),
    width: typeof row.width === 'number' ? row.width : null,
    height: typeof row.height === 'number' ? row.height : null,
    sort_order: num(row.sort_order, 0),
  };
}

export function eventFromRow(row: Row): StoryEvent {
  const media = Array.isArray(row.media)
    ? (row.media as Row[]).map(mediaFromRow).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const mood = row.mood;
  return {
    id: String(row.id),
    slug: str(row.slug) ?? String(row.id),
    title: str(row.title) ?? 'Untitled memory',
    subtitle: str(row.subtitle),
    event_date: str(row.event_date),
    date_label: str(row.date_label),
    chapter: str(row.chapter),
    description: str(row.description),
    sort_order: num(row.sort_order, 0),
    is_published: bool(row.is_published, true),
    is_milestone: bool(row.is_milestone),
    mood: (typeof mood === 'string' ? mood : null) as StoryEvent['mood'],
    reaction_k: str(row.reaction_k),
    reaction_r: str(row.reaction_r),
    song: songFromRow(row),
    media,
    created_at: str(row.created_at) ?? new Date(0).toISOString(),
    updated_at: str(row.updated_at) ?? new Date(0).toISOString(),
  };
}

export function settingsFromRow(row: Row): SiteSettings {
  const sort = row.default_sort;
  return {
    id: String(row.id),
    initials: str(row.initials) ?? 'K & R',
    hero_kicker: str(row.hero_kicker),
    hero_title: str(row.hero_title) ?? 'Our Story',
    hero_subtitle: str(row.hero_subtitle),
    enter_label: str(row.enter_label) ?? 'Begin Our Journey',
    footer_note: str(row.footer_note),
    entry_screen_enabled: bool(row.entry_screen_enabled, true),
    default_sort:
      sort === 'story_desc' || sort === 'oldest' || sort === 'newest' ? sort : 'story',
    global_song: songFromRow(row, 'global_song_'),
    updated_at: str(row.updated_at) ?? new Date(0).toISOString(),
  };
}

export const EVENT_SELECT = `
  id, slug, title, subtitle, event_date, date_label, chapter, description,
  sort_order, is_published, is_milestone, mood, reaction_k, reaction_r,
  song_url, song_title, song_artist, song_start_seconds, song_end_seconds,
  created_at, updated_at,
  media:event_media ( id, event_id, kind, url, storage_path, caption, poster_url, width, height, sort_order )
`;
