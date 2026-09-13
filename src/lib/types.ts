export type MoodKey =
  | 'romantic'
  | 'funny'
  | 'emotional'
  | 'adventure'
  | 'special'
  | 'peaceful'
  | 'celebration';

export type MediaKind = 'photo' | 'video' | 'embed';

export interface MediaItem {
  id: string;
  event_id: string;
  kind: MediaKind;
  /** Public URL (storage public URL, or an external link for `embed`). */
  url: string;
  /** Storage object path, when the file lives in our bucket. Null for external links. */
  storage_path: string | null;
  caption: string | null;
  /** Poster frame for videos. */
  poster_url: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
}

export interface SongConfig {
  /** Audio file URL (uploaded) or an external audio/stream URL. */
  url: string | null;
  title: string | null;
  artist: string | null;
  /** Seconds into the track where playback should begin. */
  start_seconds: number;
  /** Seconds into the track where playback should stop/loop. Null = play to the end. */
  end_seconds: number | null;
}

export interface StoryEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  /** ISO date (YYYY-MM-DD). Null when a memory is undated ("sometime that summer"). */
  event_date: string | null;
  /** Optional soft label shown instead of / alongside the date. */
  date_label: string | null;
  chapter: string | null;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  is_milestone: boolean;
  mood: MoodKey | null;
  reaction_k: string | null;
  reaction_r: string | null;
  song: SongConfig | null;
  media: MediaItem[];
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  initials: string;
  hero_kicker: string | null;
  hero_title: string;
  hero_subtitle: string | null;
  enter_label: string;
  footer_note: string | null;
  entry_screen_enabled: boolean;
  default_sort: SortKey;
  global_song: SongConfig | null;
  updated_at: string;
}

export type SortKey =
  | 'story'        // curated order, first → last
  | 'story_desc'   // curated order, reversed
  | 'oldest'       // by date ascending
  | 'newest';      // by date descending

export interface StoryFilters {
  media: 'all' | 'photos' | 'videos';
  year: string | 'all';
  chapter: string | 'all';
  mood: MoodKey | 'all';
  milestonesOnly: boolean;
}

export const DEFAULT_FILTERS: StoryFilters = {
  media: 'all',
  year: 'all',
  chapter: 'all',
  mood: 'all',
  milestonesOnly: false,
};
