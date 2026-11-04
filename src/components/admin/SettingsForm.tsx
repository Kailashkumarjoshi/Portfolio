'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { SiteSettings, SongConfig, SortKey } from '@/lib/types';
import { saveSettings } from '@/lib/admin/actions';
import { SORT_OPTIONS } from '@/lib/utils';
import { SongFields } from './SongFields';
import { Monogram } from '@/components/story/Monogram';

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    initials: settings.initials,
    hero_kicker: settings.hero_kicker ?? '',
    hero_title: settings.hero_title,
    hero_subtitle: settings.hero_subtitle ?? '',
    enter_label: settings.enter_label,
    footer_note: settings.footer_note ?? '',
    entry_screen_enabled: settings.entry_screen_enabled,
    default_sort: settings.default_sort as SortKey,
    global_song: settings.global_song as SongConfig | null,
  });
  const [saving, startSaving] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startSaving(async () => {
      const result = await saveSettings(form);
      if (result.ok) {
        setMessage('Saved.');
        router.refresh();
      } else {
        setError(result.message ?? 'That could not be saved.');
      }
    });
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-7">
      <section className="space-y-4">
        <div>
          <label className="label" htmlFor="initials">
            Your two initials
          </label>
          <input
            id="initials"
            required
            className="field"
            value={form.initials}
            onChange={(e) => set('initials', e.target.value)}
          />
          <p className="help">
            Shown as the monogram at the top of the site, and used to name each of you beside
            your reactions.
          </p>
          <div className="mt-4 flex justify-center rounded-xl bg-midnight-800/50 py-6">
            <Monogram initials={form.initials || 'K & R'} size="md" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="hero_title">
            The big title
          </label>
          <input
            id="hero_title"
            required
            className="field !text-lg"
            value={form.hero_title}
            onChange={(e) => set('hero_title', e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="hero_kicker">
            The small line above it
          </label>
          <input
            id="hero_kicker"
            className="field"
            placeholder="a keepsake for two"
            value={form.hero_kicker}
            onChange={(e) => set('hero_kicker', e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="hero_subtitle">
            The line underneath
          </label>
          <textarea
            id="hero_subtitle"
            className="field !min-h-[5.5rem]"
            value={form.hero_subtitle}
            onChange={(e) => set('hero_subtitle', e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="enter_label">
            The button that starts the story
          </label>
          <input
            id="enter_label"
            required
            className="field"
            value={form.enter_label}
            onChange={(e) => set('enter_label', e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="footer_note">
            A closing line at the very bottom
          </label>
          <input
            id="footer_note"
            className="field"
            placeholder="Made slowly, and only for us."
            value={form.footer_note}
            onChange={(e) => set('footer_note', e.target.value)}
          />
        </div>
      </section>

      <hr className="hairline" />

      <section className="space-y-4">
        <div>
          <label className="label" htmlFor="default_sort">
            Which order memories are shown in
          </label>
          <select
            id="default_sort"
            className="field"
            value={form.default_sort}
            onChange={(e) => set('default_sort', e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="help">
            &ldquo;Our order&rdquo; is the order you dragged them into on the memories page.
            Visitors can still change this for themselves.
          </p>
        </div>

        <div className="frost flex items-start gap-3 rounded-xl p-4">
          <input
            id="entry_screen_enabled"
            type="checkbox"
            checked={form.entry_screen_enabled}
            onChange={(e) => set('entry_screen_enabled', e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-champagne"
          />
          <label htmlFor="entry_screen_enabled" className="cursor-pointer">
            <span className="block font-sans text-sm text-cream">
              Open with the monogram screen
            </span>
            <span className="help !mt-1 block">
              A short welcome before the story. It is also what lets the music start — browsers
              will not play sound until a visitor taps something.
            </span>
          </label>
        </div>
      </section>

      <hr className="hairline" />

      <SongFields
        label="The song for the whole site"
        help="Plays quietly from the moment someone begins the journey. A memory with its own song takes over while it is open, then this comes back."
        value={form.global_song}
        onChange={(song) => set('global_song', song)}
      />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/30 bg-rose-900/20 p-4 font-sans text-sm text-rose-200"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <span aria-live="polite" className="font-sans text-sm text-champagne/80">
          {message}
        </span>
      </div>
    </form>
  );
}
