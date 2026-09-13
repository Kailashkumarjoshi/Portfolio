'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from './auth';
import {
  eventInputSchema,
  settingsInputSchema,
  type EventInput,
  type SettingsInput,
} from './schema';
import { songToRow } from '@/lib/data/shape';
import { MEDIA_BUCKET } from '@/lib/supabase/config';
import { slugify } from '@/lib/utils';

export interface ActionResult<T = undefined> {
  ok: boolean;
  message?: string;
  data?: T;
}

function fail(error: unknown): ActionResult<never> {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return { ok: false, message };
}

function refresh() {
  revalidatePath('/');
  revalidatePath('/admin');
}

/** Creates or updates one memory, along with all of its photos and videos. */
export async function saveEvent(input: EventInput): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = eventInputSchema.parse(input);
    const { supabase } = await requireAdmin();

    const slug = await uniqueSlug(supabase, parsed.title, parsed.id);

    const row = {
      slug,
      title: parsed.title,
      subtitle: parsed.subtitle,
      event_date: parsed.event_date,
      date_label: parsed.date_label,
      chapter: parsed.chapter,
      description: parsed.description,
      is_published: parsed.is_published,
      is_milestone: parsed.is_milestone,
      mood: parsed.mood,
      reaction_k: parsed.reaction_k,
      reaction_r: parsed.reaction_r,
      ...songToRow(
        parsed.song?.url
          ? {
              url: parsed.song.url,
              title: parsed.song.title,
              artist: parsed.song.artist,
              start_seconds: parsed.song.start_seconds,
              end_seconds: parsed.song.end_seconds,
            }
          : null,
      ),
    };

    let eventId = parsed.id;

    if (eventId) {
      const { error } = await supabase.from('events').update(row).eq('id', eventId);
      if (error) throw new Error(error.message);
    } else {
      // New memories go to the end of the story.
      const { data: last } = await supabase
        .from('events')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data, error } = await supabase
        .from('events')
        .insert({ ...row, sort_order: (last?.sort_order ?? 0) + 1 })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      eventId = data.id as string;
    }

    await replaceMedia(supabase, eventId, parsed.media);

    refresh();
    return { ok: true, data: { id: eventId } };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Media rows are replaced wholesale rather than diffed: the admin panel hands
 * us the finished, ordered list, and any uploaded file that is no longer in it
 * is removed from storage so deleted photos do not linger in the bucket.
 */
async function replaceMedia(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  eventId: string,
  media: ReturnType<typeof eventInputSchema.parse>['media'],
) {
  const { data: existing } = await supabase
    .from('event_media')
    .select('id, storage_path')
    .eq('event_id', eventId);

  const keptPaths = new Set(
    media.map((m) => m.storage_path).filter((path): path is string => Boolean(path)),
  );
  const orphaned = (existing ?? [])
    .map((row) => row.storage_path as string | null)
    .filter((path): path is string => Boolean(path) && !keptPaths.has(path as string));

  const { error: clearError } = await supabase
    .from('event_media')
    .delete()
    .eq('event_id', eventId);
  if (clearError) throw new Error(clearError.message);

  if (media.length > 0) {
    const rows = media.map((item, index) => ({
      event_id: eventId,
      kind: item.kind,
      url: item.url,
      storage_path: item.storage_path,
      caption: item.caption,
      poster_url: item.poster_url,
      width: item.width,
      height: item.height,
      sort_order: index,
    }));
    const { error } = await supabase.from('event_media').insert(rows);
    if (error) throw new Error(error.message);
  }

  if (orphaned.length > 0) {
    // A failure here costs disk, not correctness — never fail the save for it.
    await supabase.storage.from(MEDIA_BUCKET).remove(orphaned);
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    const { data: media } = await supabase
      .from('event_media')
      .select('storage_path')
      .eq('event_id', id);

    const paths = (media ?? [])
      .map((row) => row.storage_path as string | null)
      .filter((path): path is string => Boolean(path));

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw new Error(error.message);

    if (paths.length > 0) await supabase.storage.from(MEDIA_BUCKET).remove(paths);

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function setPublished(id: string, published: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from('events')
      .update({ is_published: published })
      .eq('id', id);
    if (error) throw new Error(error.message);
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Persists the order the keeper dragged the memories into. */
export async function reorderEvents(orderedIds: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const updates = orderedIds.map((id, index) =>
      supabase.from('events').update({ sort_order: index + 1 }).eq('id', id),
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  try {
    const parsed = settingsInputSchema.parse(input);
    const { supabase } = await requireAdmin();

    const row = {
      initials: parsed.initials,
      hero_kicker: parsed.hero_kicker,
      hero_title: parsed.hero_title,
      hero_subtitle: parsed.hero_subtitle,
      enter_label: parsed.enter_label,
      footer_note: parsed.footer_note,
      entry_screen_enabled: parsed.entry_screen_enabled,
      default_sort: parsed.default_sort,
      ...songToRow(
        parsed.global_song?.url
          ? {
              url: parsed.global_song.url,
              title: parsed.global_song.title,
              artist: parsed.global_song.artist,
              start_seconds: parsed.global_song.start_seconds,
              end_seconds: parsed.global_song.end_seconds,
            }
          : null,
        'global_song_',
      ),
    };

    const { data: existing } = await supabase.from('site_settings').select('id').maybeSingle();

    const { error } = existing
      ? await supabase.from('site_settings').update(row).eq('id', existing.id)
      : await supabase.from('site_settings').insert(row);
    if (error) throw new Error(error.message);

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Keeps slugs readable and unique without ever asking the owner about them. */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  title: string,
  currentId?: string,
): Promise<string> {
  const base = slugify(title);
  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    let query = supabase.from('events').select('id').eq('slug', candidate).limit(1);
    if (currentId) query = query.neq('id', currentId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
