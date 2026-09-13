import 'server-only';
import { getServerSupabase } from '../supabase/server';
import { isSupabaseConfigured } from '../supabase/config';
import type { SiteSettings, StoryEvent } from '../types';
import { demoEvents, demoSettings } from './demo';
import { EVENT_SELECT, eventFromRow, settingsFromRow } from './shape';

export interface StoryPayload {
  events: StoryEvent[];
  settings: SiteSettings;
  /** True when we are showing the bundled sample story rather than the owner's data. */
  isDemo: boolean;
  /** Set when Supabase is configured but the read failed — surfaced in the admin panel only. */
  error: string | null;
}

/**
 * Reads the whole story. Falls back to the bundled demo content when Supabase
 * is not configured, so the site is never blank.
 *
 * @param includeUnpublished admin views pass true; the public site never does.
 */
export async function getStory(includeUnpublished = false): Promise<StoryPayload> {
  if (!isSupabaseConfigured) {
    const events = demoEvents();
    return {
      events: includeUnpublished ? events : events.filter((e) => e.is_published),
      settings: demoSettings(),
      isDemo: true,
      error: null,
    };
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    return { events: demoEvents(), settings: demoSettings(), isDemo: true, error: null };
  }

  let query = supabase.from('events').select(EVENT_SELECT).order('sort_order', { ascending: true });
  if (!includeUnpublished) query = query.eq('is_published', true);

  const [eventsResult, settingsResult] = await Promise.all([
    query,
    supabase.from('site_settings').select('*').limit(1).maybeSingle(),
  ]);

  if (eventsResult.error) {
    // Keep the site up rather than throwing a 500 at a visitor.
    return {
      events: [],
      settings: settingsResult.data ? settingsFromRow(settingsResult.data) : demoSettings(),
      isDemo: false,
      error: eventsResult.error.message,
    };
  }

  return {
    events: (eventsResult.data ?? []).map(eventFromRow),
    settings: settingsResult.data ? settingsFromRow(settingsResult.data) : demoSettings(),
    isDemo: false,
    error: settingsResult.error?.message ?? null,
  };
}

export async function getEventById(id: string): Promise<StoryEvent | null> {
  if (!isSupabaseConfigured) {
    return demoEvents().find((e) => e.id === id) ?? null;
  }
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return eventFromRow(data);
}
