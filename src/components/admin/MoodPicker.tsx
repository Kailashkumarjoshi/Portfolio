'use client';

import { MOOD_LIST } from '@/lib/moods';
import type { MoodKey } from '@/lib/types';

/** The feeling of a memory, which becomes the light around it on the site. */
export function MoodPicker({
  value,
  onChange,
}: {
  value: MoodKey | null;
  onChange: (value: MoodKey | null) => void;
}) {
  return (
    <fieldset>
      <legend className="label">Memory mood</legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="chip"
          data-active={value === null}
          aria-pressed={value === null}
          onClick={() => onChange(null)}
        >
          None
        </button>
        {MOOD_LIST.map((mood) => (
          <button
            key={mood.key}
            type="button"
            className="chip"
            data-active={value === mood.key}
            aria-pressed={value === mood.key}
            onClick={() => onChange(mood.key)}
            title={mood.hint}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ background: mood.accent, boxShadow: `0 0 8px ${mood.accent}` }}
            />
            {mood.label}
          </button>
        ))}
      </div>
      <p className="help">
        {value
          ? MOOD_LIST.find((m) => m.key === value)?.hint
          : 'Adds a soft glow and a few motes of light around this memory. It never repaints the rest of the site.'}
      </p>
    </fieldset>
  );
}
