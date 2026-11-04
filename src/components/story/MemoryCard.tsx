'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { StoryEvent } from '@/lib/types';
import { moodTheme } from '@/lib/moods';
import { cn, formatEventDate, seededRandom } from '@/lib/utils';
import { useYarn } from '@/components/yarn/YarnContext';
import { YarnKnot } from '@/components/yarn/YarnKnot';
import { MediaFrame } from './MediaFrame';
import { MoodBadge } from './MoodBadge';
import { ReactionPair } from './ReactionPair';
import { MoodParticles } from './MoodParticles';

interface MemoryCardProps {
  event: StoryEvent;
  index: number;
  /** Which column the card sits in. Mobile always uses `right`. */
  side: 'left' | 'right';
  initials: string;
  onOpen: (event: StoryEvent) => void;
  /** Story position shown on the card, independent of the applied sort. */
  ordinal: number;
  instant: boolean;
}

/**
 * One memory, as a keepsake rather than a blog card: a mounted print on warm
 * paper, tilted a hair off square, with the wool tied through its edge.
 */
export function MemoryCard({
  event,
  index,
  side,
  initials,
  onOpen,
  ordinal,
  instant,
}: MemoryCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const { stitchedTo, requestReveal } = useYarn();

  const revealed = instant || index <= stitchedTo;
  const theme = moodTheme(event.mood);
  const cover = event.media[0];

  // Each card sits a fraction off square, always the same fraction.
  const tilt = (seededRandom(index * 3 + 11) - 0.5) * 1.5;

  // The thread normally arrives before the card scrolls in. If the visitor is
  // moving faster than the story, let the card show itself rather than stall.
  useEffect(() => {
    if (!inView || revealed) return;
    const timer = window.setTimeout(() => requestReveal(index), 700);
    return () => window.clearTimeout(timer);
  }, [inView, revealed, requestReveal, index]);

  // Knot on the inner edge, so the thread runs through the middle of the page.
  const knotDirection = side === 'left' ? 'right' : 'left';

  return (
    <motion.div
      ref={ref}
      initial={instant ? false : { opacity: 0, y: 34, scale: 0.975 }}
      animate={
        revealed
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 34, scale: 0.975 }
      }
      transition={instant ? { duration: 0 } : { duration: 0.85, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative"
      style={{ ['--mood-accent' as string]: theme.accent }}
    >
      {/* Mood ambience — a wash of light behind the card, never on the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] blur-3xl transition-opacity duration-1000"
        style={{ background: theme.wash, opacity: revealed ? 1 : 0 }}
      />
      <MoodParticles mood={event.mood} active={revealed} seed={index} />

      <article
        className={cn(
          'paper group relative rounded-card p-3.5 sm:p-4',
          'transition-[transform,box-shadow] duration-700 ease-silk',
          'hover:shadow-keepsake-lift',
        )}
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        {/* The tie point. Sits on the paper edge, half over the boundary. */}
        <YarnKnot
          index={index}
          direction={knotDirection}
          accent={theme.accent}
          className={cn(
            'top-1/2 -translate-y-1/2',
            knotDirection === 'right' ? '-right-3 lg:-right-4' : '-left-3 lg:-left-4',
          )}
        />

        <button
          type="button"
          onClick={() => onOpen(event)}
          className="block w-full text-left"
          aria-label={`Open the memory "${event.title}"`}
        >
          {cover && (
            <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-md">
              <MediaFrame
                item={cover}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 460px"
                className="absolute inset-0 h-full w-full transition-transform duration-[1.4s] ease-silk group-hover:scale-[1.04]"
                rounded="rounded-md"
              />
              {event.media.length > 1 && (
                <span className="absolute bottom-2 right-2 z-[2] rounded-full bg-midnight-900/65 px-2.5 py-1 font-sans text-[0.62rem] tracking-[0.12em] text-cream backdrop-blur-sm">
                  +{event.media.length - 1}
                </span>
              )}
            </div>
          )}

          <div className={cn('px-1.5', cover ? 'pb-1' : 'py-3')}>
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="font-display text-[0.7rem] tracking-[0.24em] text-ink/35">
                {String(ordinal).padStart(2, '0')}
              </span>
              <span className="h-px flex-1 bg-ink/12" aria-hidden="true" />
              {event.is_milestone && (
                <span
                  className="font-sans text-[0.58rem] uppercase tracking-[0.2em] text-champagne-deep"
                  title="A milestone"
                >
                  ✦ Milestone
                </span>
              )}
            </div>

            {(event.event_date || event.date_label) && (
              <p className="mb-1.5 font-sans text-[0.68rem] uppercase tracking-[0.2em] text-ink/45">
                {formatEventDate(event.event_date, event.date_label)}
              </p>
            )}

            <h3 className="font-display text-[1.6rem] font-light leading-tight text-ink sm:text-[1.85rem]">
              {event.title}
            </h3>

            {event.subtitle && (
              <p className="mt-1.5 font-serif text-[0.95rem] italic leading-snug text-ink/60">
                {event.subtitle}
              </p>
            )}

            {event.description && (
              <p className="mt-3 line-clamp-3 font-serif text-[0.94rem] leading-relaxed text-ink/72">
                {event.description}
              </p>
            )}
          </div>
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-1.5 pt-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <MoodBadge mood={event.mood} />
            <ReactionPair
              initials={initials}
              reactionK={event.reaction_k}
              reactionR={event.reaction_r}
            />
          </div>
          <button
            type="button"
            onClick={() => onOpen(event)}
            className="font-sans text-[0.66rem] uppercase tracking-[0.2em] text-ink/45 transition-colors hover:text-ink"
          >
            Open ↗
          </button>
        </div>
      </article>
    </motion.div>
  );
}
