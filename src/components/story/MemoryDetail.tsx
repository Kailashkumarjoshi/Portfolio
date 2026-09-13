'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { StoryEvent } from '@/lib/types';
import { moodTheme } from '@/lib/moods';
import { cn, formatEventDate } from '@/lib/utils';
import { MediaFrame } from './MediaFrame';
import { MoodBadge } from './MoodBadge';
import { ReactionPair } from './ReactionPair';
import { useMusic } from './MusicProvider';

interface MemoryDetailProps {
  event: StoryEvent | null;
  initials: string;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** The full memory: everything that didn't fit on the card, given room to breathe. */
export function MemoryDetail({
  event,
  initials,
  onClose,
  onNavigate,
  hasPrevious,
  hasNext,
}: MemoryDetailProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<Element | null>(null);
  const { setSong, restoreGlobal } = useMusic();

  const isOpen = Boolean(event);

  // A memory with its own song takes over the room while it is open, and the
  // site's own song comes back when it closes. Both calls no-op if the right
  // track is already playing, so navigating between memories does not restart it.
  useEffect(() => {
    if (event?.song?.url) setSong(event.song);
    else restoreGlobal();
  }, [event, setSong, restoreGlobal]);

  // Locking the page is keyed on open/closed alone. Tying it to the memory
  // would re-capture the already-locked overflow on every move to the next
  // one, and leave the page stuck when the last one closed.
  useEffect(() => {
    if (!isOpen) return;

    returnFocusTo.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      (returnFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen]);

  // Move focus to the close button each time a different memory is shown.
  const openId = event?.id;
  useEffect(() => {
    if (openId) closeRef.current?.focus();
  }, [openId]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft' && hasPrevious) onNavigate(-1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(1);
      if (e.key !== 'Tab') return;

      // Keep tabbing inside the memory while it is open.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, iframe, video, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, onNavigate, hasPrevious, hasNext]);

  const theme = moodTheme(event?.mood ?? null);
  const cover = event?.media[0];
  const rest = event?.media.slice(1) ?? [];

  // The title is laid over the cover only when that cover is a still photo.
  // Over a video it would sit exactly where the playback controls are.
  const overlayTitle = cover?.kind === 'photo';

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key="detail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-midnight-900/85 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 44, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.99 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative mx-auto my-4 w-[min(58rem,calc(100%-1.5rem))] sm:my-10"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-16 -z-10 rounded-[4rem] blur-[80px]"
              style={{ background: theme.wash }}
            />

            <div className="frost overflow-hidden rounded-[1.75rem]">
              <header className="relative">
                {cover && (
                  <div className="relative min-h-[16rem] w-full">
                    <div className="relative aspect-[4/3] w-full sm:aspect-[16/8]">
                      <MediaFrame
                        item={cover}
                        priority
                        interactive
                        sizes="(max-width: 1024px) 100vw, 928px"
                        className="absolute inset-0 h-full w-full"
                        rounded="rounded-none"
                      />
                    </div>

                    {overlayTitle && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-midnight-900 via-midnight-900/85 to-transparent px-5 pb-6 pt-20 sm:px-10 sm:pb-8 sm:pt-28">
                        <TitleBlock event={event} theme={theme} />
                      </div>
                    )}
                  </div>
                )}

                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close this memory"
                  className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-champagne/25 bg-midnight-900/70 text-cream backdrop-blur-md transition-colors hover:bg-midnight-700"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" strokeWidth="1.7">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>

                {!overlayTitle && (
                  <div className="px-5 pt-8 sm:px-10 sm:pt-10">
                    <TitleBlock event={event} theme={theme} />
                  </div>
                )}
              </header>

              <div className="px-5 pb-10 pt-6 sm:px-10 sm:pb-14">
                {event.description && (
                  <div className="prose-memory max-w-[64ch] font-serif text-[1.02rem] text-cream/85 sm:text-[1.08rem]">
                    {event.description.split(/\n{2,}/).map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                )}

                {rest.length > 0 && (
                  <section className="mt-9" aria-label="More from this memory">
                    <hr className="hairline mb-7" />
                    {/* Swipeable on phones, a settled grid on larger screens. */}
                    <div className={cn(
                        'swipe-row no-scrollbar -mx-5 px-5 sm:mx-0 sm:grid sm:gap-4 sm:overflow-visible sm:px-0',
                        rest.length > 1 ? 'sm:grid-cols-2' : 'sm:grid-cols-1',
                      )}>
                      {rest.map((item) => (
                        <figure
                          key={item.id}
                          className="w-[78vw] max-w-sm sm:w-auto sm:max-w-none"
                        >
                          <div className="relative aspect-[4/3] w-full">
                            <MediaFrame
                              item={item}
                              interactive
                              sizes="(max-width: 640px) 78vw, 440px"
                              className="absolute inset-0 h-full w-full"
                            />
                          </div>
                          {item.caption && (
                            <figcaption className="mt-2 font-serif text-[0.85rem] italic text-mauve-300">
                              {item.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  </section>
                )}

                {(event.reaction_k || event.reaction_r) && (
                  <section className="mt-10">
                    <hr className="hairline mb-7" />
                    <ReactionPair
                      initials={initials}
                      reactionK={event.reaction_k}
                      reactionR={event.reaction_r}
                      variant="full"
                    />
                  </section>
                )}

                {event.song?.url && (
                  <section className="mt-9">
                    <h3 className="kicker mb-3 text-champagne/70">What was playing</h3>
                    <p className="font-serif text-base italic text-cream/85">
                      {event.song.title ?? 'Our song'}
                      {event.song.artist && (
                        <span className="not-italic text-mauve-300"> · {event.song.artist}</span>
                      )}
                    </p>
                  </section>
                )}
              </div>

              <footer className="flex items-center justify-between gap-3 border-t border-champagne/12 px-5 py-4 sm:px-10">
                <button
                  type="button"
                  className="btn-ghost disabled:pointer-events-none disabled:opacity-35"
                  onClick={() => onNavigate(-1)}
                  disabled={!hasPrevious}
                >
                  ← Before this
                </button>
                <button
                  type="button"
                  className="btn-ghost disabled:pointer-events-none disabled:opacity-35"
                  onClick={() => onNavigate(1)}
                  disabled={!hasNext}
                >
                  What came next →
                </button>
              </footer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


/** Date, chapter, mood, title and subtitle — the same set wherever it sits. */
function TitleBlock({
  event,
  theme,
}: {
  event: StoryEvent;
  theme: ReturnType<typeof moodTheme>;
}) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {(event.event_date || event.date_label) && (
          <span className="font-sans text-[0.68rem] uppercase tracking-[0.22em] text-champagne/85">
            {formatEventDate(event.event_date, event.date_label)}
          </span>
        )}
        {event.chapter && (
          <span className="font-sans text-[0.68rem] uppercase tracking-[0.22em] text-mauve-200">
            · {event.chapter}
          </span>
        )}
        <MoodBadge mood={event.mood} tone="dark" />
        {event.is_milestone && (
          <span
            className="font-sans text-[0.6rem] uppercase tracking-[0.2em]"
            style={{ color: theme.accent }}
          >
            ✦ Milestone
          </span>
        )}
      </div>

      <h2 id="memory-detail-title" className="display-lg text-balance text-cream">
        {event.title}
      </h2>

      {event.subtitle && (
        <p className="mt-2 font-serif text-lg italic text-mauve-200 sm:text-xl">
          {event.subtitle}
        </p>
      )}
    </>
  );
}
