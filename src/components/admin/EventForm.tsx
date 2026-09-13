'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import type { MoodKey, SongConfig, StoryEvent } from '@/lib/types';
import type { EventInput, MediaDraft } from '@/lib/admin/schema';
import { saveEvent } from '@/lib/admin/actions';
import { MediaManager } from './MediaManager';
import { EmojiPicker } from './EmojiPicker';
import { MoodPicker } from './MoodPicker';
import { SongFields } from './SongFields';
import { MemoryPreview } from './MemoryPreview';

interface EventFormProps {
  event: StoryEvent | null;
  initials: string;
  /** Chapter names already in use, offered as suggestions. */
  chapters: string[];
}

interface FormState {
  title: string;
  subtitle: string;
  event_date: string;
  date_label: string;
  chapter: string;
  description: string;
  mood: MoodKey | null;
  reaction_k: string | null;
  reaction_r: string | null;
  is_published: boolean;
  is_milestone: boolean;
  song: SongConfig | null;
  media: MediaDraft[];
}

function toFormState(event: StoryEvent | null): FormState {
  return {
    title: event?.title ?? '',
    subtitle: event?.subtitle ?? '',
    event_date: event?.event_date ?? '',
    date_label: event?.date_label ?? '',
    chapter: event?.chapter ?? '',
    description: event?.description ?? '',
    mood: event?.mood ?? null,
    reaction_k: event?.reaction_k ?? null,
    reaction_r: event?.reaction_r ?? null,
    is_published: event?.is_published ?? false,
    is_milestone: event?.is_milestone ?? false,
    song: event?.song ?? null,
    media:
      event?.media.map((item) => ({
        kind: item.kind,
        url: item.url,
        storage_path: item.storage_path,
        caption: item.caption,
        poster_url: item.poster_url,
        width: item.width,
        height: item.height,
      })) ?? [],
  };
}

function initialsOf(initials: string): [string, string] {
  const letters = initials.replace(/[^\p{L}]/gu, '').split('');
  return [letters[0] ?? 'K', letters[1] ?? 'R'];
}

/** Everything about one memory, on one page, with the result shown alongside. */
export function EventForm({ event, initials, chapters }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(event));
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [k, r] = initialsOf(initials);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const preview = useMemo<StoryEvent>(
    () => ({
      id: event?.id ?? 'preview',
      slug: 'preview',
      title: form.title || 'Untitled memory',
      subtitle: form.subtitle || null,
      event_date: form.event_date || null,
      date_label: form.date_label || null,
      chapter: form.chapter || null,
      description: form.description || null,
      sort_order: event?.sort_order ?? 0,
      is_published: form.is_published,
      is_milestone: form.is_milestone,
      mood: form.mood,
      reaction_k: form.reaction_k,
      reaction_r: form.reaction_r,
      song: form.song,
      media: form.media.map((item, index) => ({
        id: `preview-${index}`,
        event_id: 'preview',
        kind: item.kind,
        url: item.url,
        storage_path: item.storage_path ?? null,
        caption: item.caption ?? null,
        poster_url: item.poster_url ?? null,
        width: item.width ?? null,
        height: item.height ?? null,
        sort_order: index,
      })),
      created_at: event?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    [form, event],
  );

  const submit = (publish?: boolean) => {
    setError(null);
    const payload: EventInput = {
      id: event?.id,
      title: form.title,
      subtitle: form.subtitle,
      event_date: form.event_date,
      date_label: form.date_label,
      chapter: form.chapter,
      description: form.description,
      mood: form.mood,
      reaction_k: form.reaction_k,
      reaction_r: form.reaction_r,
      is_published: publish ?? form.is_published,
      is_milestone: form.is_milestone,
      song: form.song,
      media: form.media,
    };

    startSaving(async () => {
      const result = await saveEvent(payload);
      if (!result.ok) {
        setError(result.message ?? 'That could not be saved.');
        return;
      }
      router.push('/admin');
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
    >
      <div className="space-y-7">
        <section className="space-y-4">
          <div>
            <label className="label" htmlFor="title">
              What happened
            </label>
            <input
              id="title"
              required
              className="field !text-lg"
              placeholder="The First Evening"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="subtitle">
              A line underneath <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="subtitle"
              className="field"
              placeholder="Before either of us knew what this was"
              value={form.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="event_date">
                Date
              </label>
              <input
                id="event_date"
                type="date"
                className="field"
                value={form.event_date}
                onChange={(e) => set('event_date', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="date_label">
                Or say it in words
              </label>
              <input
                id="date_label"
                className="field"
                placeholder="Sometime that summer"
                value={form.date_label}
                onChange={(e) => set('date_label', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="chapter">
                Chapter
              </label>
              <input
                id="chapter"
                className="field"
                placeholder="Beginnings"
                list="chapter-suggestions"
                value={form.chapter}
                onChange={(e) => set('chapter', e.target.value)}
              />
              <datalist id="chapter-suggestions">
                {chapters.map((chapter) => (
                  <option key={chapter} value={chapter} />
                ))}
              </datalist>
            </div>
          </div>
          <p className="help !mt-0">
            If you write it in words, that is what the site shows. Memories with the same
            chapter name are grouped under a heading.
          </p>

          <div>
            <label className="label" htmlFor="description">
              The story
            </label>
            <textarea
              id="description"
              className="field min-h-[14rem]"
              placeholder="Tell it the way you'd tell it out loud. Leave a blank line between paragraphs."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </section>

        <hr className="hairline" />

        <MediaManager items={form.media} onChange={(media) => set('media', media)} />

        <hr className="hairline" />

        <section>
          <h2 className="mb-4 font-display text-xl font-light text-cream">
            How you both felt about it
          </h2>
          <div className="flex flex-wrap gap-6">
            <EmojiPicker
              label={`${k}'s reaction`}
              value={form.reaction_k}
              onChange={(value) => set('reaction_k', value)}
            />
            <EmojiPicker
              label={`${r}'s reaction`}
              value={form.reaction_r}
              onChange={(value) => set('reaction_r', value)}
            />
          </div>
          <div className="mt-6">
            <MoodPicker value={form.mood} onChange={(mood) => set('mood', mood)} />
          </div>
        </section>

        <hr className="hairline" />

        <SongFields
          label="A song for this memory"
          help="Optional. When someone opens this memory, this plays instead of the main song."
          value={form.song}
          onChange={(song) => set('song', song)}
        />

        <hr className="hairline" />

        <section className="space-y-3">
          <Toggle
            id="is_milestone"
            checked={form.is_milestone}
            onChange={(v) => set('is_milestone', v)}
            label="Mark this as a milestone"
            help="Milestones get a small gold mark, and can be filtered to on their own."
          />
          <Toggle
            id="is_published"
            checked={form.is_published}
            onChange={(v) => set('is_published', v)}
            label="Show this on the site"
            help="Leave this off while you are still writing. Nobody can see it until it is on."
          />
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-400/30 bg-rose-900/20 p-4 font-sans text-sm text-rose-200"
          >
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-3 border-t border-champagne/12 bg-midnight-900/90 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {!form.is_published && (
            <button
              type="button"
              disabled={saving}
              onClick={() => submit(true)}
              className="btn-ghost"
            >
              Save and show it
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="btn-ghost lg:hidden"
            aria-expanded={showPreview}
          >
            {showPreview ? 'Hide preview' : 'Preview'}
          </button>
          <button type="button" onClick={() => router.push('/admin')} className="btn-ghost ml-auto">
            Cancel
          </button>
        </div>
      </div>

      <aside className={showPreview ? 'block' : 'hidden lg:block lg:sticky lg:top-24'}>
        <p className="kicker mb-4 text-champagne/60">How it will look</p>
        <MemoryPreview event={preview} initials={initials} />
      </aside>
    </form>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  label,
  help,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  help: string;
}) {
  return (
    <div className="frost flex items-start gap-3 rounded-xl p-4">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-champagne"
      />
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-sans text-sm text-cream">{label}</span>
        <span className="help !mt-1 block">{help}</span>
      </label>
    </div>
  );
}
