'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MoodKey, SortKey, StoryEvent, StoryFilters } from '@/lib/types';
import { MOOD_LIST } from '@/lib/moods';
import { SORT_OPTIONS, cn, eventYear } from '@/lib/utils';

interface StoryControlsProps {
  events: StoryEvent[];
  filters: StoryFilters;
  sort: SortKey;
  onFiltersChange: (filters: StoryFilters) => void;
  onSortChange: (sort: SortKey) => void;
  resultCount: number;
}

/**
 * Filters and order. Collapsed to a single line by default — the story should
 * be the first thing you see, not a toolbar.
 */
export function StoryControls({
  events,
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  resultCount,
}: StoryControlsProps) {
  const [open, setOpen] = useState(false);

  const years = Array.from(
    new Set(events.map(eventYear).filter((y): y is string => Boolean(y))),
  ).sort();
  const chapters = Array.from(
    new Set(events.map((e) => e.chapter).filter((c): c is string => Boolean(c))),
  );
  const moodsPresent = new Set(events.map((e) => e.mood).filter(Boolean));

  const activeCount =
    (filters.media !== 'all' ? 1 : 0) +
    (filters.year !== 'all' ? 1 : 0) +
    (filters.chapter !== 'all' ? 1 : 0) +
    (filters.mood !== 'all' ? 1 : 0) +
    (filters.milestonesOnly ? 1 : 0);

  const update = (patch: Partial<StoryFilters>) => onFiltersChange({ ...filters, ...patch });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <div className="frost rounded-[1.25rem] p-2.5 sm:p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="story-filters"
            className="chip"
            data-active={activeCount > 0}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current" strokeWidth="1.6" fill="none">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
          </button>

          <label className="sr-only" htmlFor="story-sort">
            Order the memories
          </label>
          <select
            id="story-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="chip cursor-pointer appearance-none bg-plum-900/60 pr-7"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4.5 6 8.5 10 4.5' fill='none' stroke='%23d2b6c5' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right .6rem center',
              backgroundSize: '.7rem',
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="chip"
            data-active={filters.milestonesOnly}
            aria-pressed={filters.milestonesOnly}
            onClick={() => update({ milestonesOnly: !filters.milestonesOnly })}
          >
            ✦ Milestones
          </button>

          <span
            className="ml-auto pr-1 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-mauve-300"
            aria-live="polite"
          >
            {resultCount} {resultCount === 1 ? 'memory' : 'memories'}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="story-filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-4">
                <FilterRow label="Show">
                  {(['all', 'photos', 'videos'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="chip"
                      data-active={filters.media === value}
                      aria-pressed={filters.media === value}
                      onClick={() => update({ media: value })}
                    >
                      {value === 'all' ? 'All memories' : value === 'photos' ? 'Photos only' : 'Videos only'}
                    </button>
                  ))}
                </FilterRow>

                {years.length > 1 && (
                  <FilterRow label="Year">
                    <ChipOption
                      active={filters.year === 'all'}
                      onClick={() => update({ year: 'all' })}
                      label="Every year"
                    />
                    {years.map((year) => (
                      <ChipOption
                        key={year}
                        active={filters.year === year}
                        onClick={() => update({ year })}
                        label={year}
                      />
                    ))}
                  </FilterRow>
                )}

                {chapters.length > 0 && (
                  <FilterRow label="Chapter">
                    <ChipOption
                      active={filters.chapter === 'all'}
                      onClick={() => update({ chapter: 'all' })}
                      label="All chapters"
                    />
                    {chapters.map((chapter) => (
                      <ChipOption
                        key={chapter}
                        active={filters.chapter === chapter}
                        onClick={() => update({ chapter })}
                        label={chapter}
                      />
                    ))}
                  </FilterRow>
                )}

                {moodsPresent.size > 0 && (
                  <FilterRow label="Mood">
                    <ChipOption
                      active={filters.mood === 'all'}
                      onClick={() => update({ mood: 'all' })}
                      label="Any mood"
                    />
                    {MOOD_LIST.filter((mood) => moodsPresent.has(mood.key)).map((mood) => (
                      <button
                        key={mood.key}
                        type="button"
                        className="chip"
                        data-active={filters.mood === mood.key}
                        aria-pressed={filters.mood === mood.key}
                        onClick={() => update({ mood: mood.key as MoodKey })}
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: mood.accent }}
                        />
                        {mood.label}
                      </button>
                    ))}
                  </FilterRow>
                )}

                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onFiltersChange({
                        media: 'all',
                        year: 'all',
                        chapter: 'all',
                        mood: 'all',
                        milestonesOnly: false,
                      })
                    }
                    className="font-sans text-[0.7rem] uppercase tracking-[0.16em] text-champagne/70 underline underline-offset-4 transition-colors hover:text-champagne"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-24 shrink-0 font-sans text-[0.64rem] uppercase tracking-[0.2em] text-mauve-300">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ChipOption({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={cn('chip')}
      data-active={active}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
