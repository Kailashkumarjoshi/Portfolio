'use client';

import { useCallback, useMemo, useState } from 'react';
import type { SiteSettings, SortKey, StoryEvent, StoryFilters } from '@/lib/types';
import { DEFAULT_FILTERS } from '@/lib/types';
import { moodTheme } from '@/lib/moods';
import { applyFilters, applySort } from '@/lib/utils';
import { useMinWidth, useReducedMotion } from '@/lib/hooks/useDeviceTier';
import { YarnField } from '@/components/yarn/YarnField';
import { MemoryCard } from './MemoryCard';
import { MemoryDetail } from './MemoryDetail';
import { StoryControls } from './StoryControls';

interface TimelineProps {
  events: StoryEvent[];
  settings: SiteSettings;
}

/**
 * The story itself: memories in order, each one tied to the next with wool.
 *
 * Desktop alternates the cards either side of the thread so it sweeps across
 * the page; phones keep a single column beside a left-hand rail, which is the
 * same idea at a size you can read one-handed.
 */
export function Timeline({ events, settings }: TimelineProps) {
  const [filters, setFilters] = useState<StoryFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>(settings.default_sort);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const wide = useMinWidth(1024);
  const reducedMotion = useReducedMotion();

  // Story position is the curated order, no matter how the visitor sorts.
  const ordinals = useMemo(() => {
    const map = new Map<string, number>();
    [...events]
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((event, i) => map.set(event.id, i + 1));
    return map;
  }, [events]);

  const visible = useMemo(
    () => applySort(applyFilters(events, filters), sort),
    [events, filters, sort],
  );

  const colors = useMemo(() => visible.map((e) => moodTheme(e.mood).yarn), [visible]);

  const layoutKey = useMemo(
    () =>
      [
        sort,
        filters.media,
        filters.year,
        filters.chapter,
        filters.mood,
        String(filters.milestonesOnly),
        String(wide),
        visible.map((e) => e.id).join(','),
      ].join('|'),
    [sort, filters, wide, visible],
  );

  const open = openIndex !== null ? visible[openIndex] ?? null : null;

  const navigate = useCallback(
    (direction: -1 | 1) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        const next = current + direction;
        return next >= 0 && next < visible.length ? next : current;
      });
    },
    [visible.length],
  );

  const handleOpen = useCallback(
    (event: StoryEvent) => {
      const index = visible.findIndex((e) => e.id === event.id);
      if (index >= 0) setOpenIndex(index);
    },
    [visible],
  );

  return (
    <section id="story" className="relative pb-24 pt-10 sm:pb-32">
      <StoryControls
        events={events}
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        resultCount={visible.length}
      />

      {visible.length === 0 ? (
        <EmptyState onClear={() => setFilters(DEFAULT_FILTERS)} />
      ) : (
        <div className="mx-auto mt-12 w-full max-w-6xl px-4 sm:mt-16 sm:px-6">
          <YarnField
            colors={colors}
            layoutKey={layoutKey}
            /* Room above the first memory for the two strands to find each other. */
            className="pt-36 sm:pt-44 lg:pt-52"
          >
            <ol className="space-y-20 sm:space-y-24 lg:space-y-16">
              {visible.map((event, index) => {
                const side = wide ? (index % 2 === 0 ? 'left' : 'right') : 'right';
                const previous = visible[index - 1];
                const showChapter =
                  Boolean(event.chapter) &&
                  event.chapter !== previous?.chapter &&
                  (sort === 'story' || sort === 'story_desc');

                return (
                  <li key={event.id} className="relative">
                    {showChapter && <ChapterHeading chapter={event.chapter as string} />}

                    <div className="lg:grid lg:grid-cols-2 lg:gap-x-24">
                      {side === 'right' && <div aria-hidden="true" className="hidden lg:block" />}
                      <div className="pl-[var(--rail)] pr-1 sm:pr-2 lg:px-0">
                        <MemoryCard
                          event={event}
                          index={index}
                          side={side}
                          initials={settings.initials}
                          onOpen={handleOpen}
                          ordinal={ordinals.get(event.id) ?? index + 1}
                          instant={reducedMotion}
                        />
                      </div>
                      {side === 'left' && <div aria-hidden="true" className="hidden lg:block" />}
                    </div>
                  </li>
                );
              })}
            </ol>
          </YarnField>

          <TailKnot />
        </div>
      )}

      <MemoryDetail
        event={open}
        initials={settings.initials}
        onClose={() => setOpenIndex(null)}
        onNavigate={navigate}
        hasPrevious={openIndex !== null && openIndex > 0}
        hasNext={openIndex !== null && openIndex < visible.length - 1}
      />
    </section>
  );
}

function ChapterHeading({ chapter }: { chapter: string }) {
  return (
    <div className="mb-12 pl-[var(--rail)] lg:mb-16 lg:pl-0 lg:text-center">
      <span className="kicker text-champagne/55">Chapter</span>
      <h2 className="mt-2 font-display text-3xl font-light text-cream sm:text-4xl">{chapter}</h2>
    </div>
  );
}

/** The thread doesn't end — it just runs off the bottom of the page. */
function TailKnot() {
  return (
    <div className="mt-16 flex flex-col items-center gap-4" aria-hidden="true">
      <svg width="26" height="72" viewBox="0 0 26 72" className="overflow-visible">
        <path
          d="M13 0 C 13 18, 8 26, 13 40 C 17 50, 12 58, 13 66"
          fill="none"
          stroke="rgba(196,129,143,0.5)"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M13 0 C 13 18, 8 26, 13 40 C 17 50, 12 58, 13 66"
          fill="none"
          stroke="rgba(255,246,238,0.22)"
          strokeWidth="1.1"
          strokeLinecap="round"
          transform="translate(-1,0)"
        />
        <circle cx="13" cy="68" r="3.6" fill="rgba(196,129,143,0.55)" />
      </svg>
      <p className="font-serif text-sm italic text-mauve-300/70">…to be continued</p>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mx-auto mt-20 max-w-md px-6 text-center">
      <p className="font-display text-2xl font-light text-cream">
        No memories match that just yet.
      </p>
      <p className="mt-3 font-serif text-mauve-300">
        Loosen the filters and the thread picks up again.
      </p>
      <button type="button" onClick={onClear} className="btn-ghost mt-6">
        Show everything
      </button>
    </div>
  );
}
