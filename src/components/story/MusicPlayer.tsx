'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMusic } from './MusicProvider';
import { formatClock } from '@/lib/utils';

/**
 * A quiet player that stays out of the story's way: a frosted pill in the
 * corner, a ring that fills across the chosen excerpt, and nothing else.
 */
export function MusicPlayer() {
  const { available, current, playing, toggle, muted, setMuted, position, span, needsGesture } =
    useMusic();

  if (!available || !current) return null;

  const progress = span && span > 0 ? Math.min(1, position / span) : 0;
  const label = current.title ?? 'Our song';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 sm:bottom-6 sm:left-6 sm:translate-x-0"
      >
        <div className="frost flex max-w-[min(21rem,calc(100vw-2rem))] items-center gap-3 rounded-full py-2 pl-2 pr-4">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Pause ${label}` : `Play ${label}`}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-champagne/12 transition-colors hover:bg-champagne/22"
          >
            <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="20"
                fill="none"
                stroke="rgba(227,201,160,0.18)"
                strokeWidth="1.6"
              />
              <circle
                cx="22"
                cy="22"
                r="20"
                fill="none"
                stroke="rgba(227,201,160,0.85)"
                strokeWidth="1.6"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - progress}
                style={{ transition: 'stroke-dashoffset .4s linear' }}
              />
            </svg>
            {playing ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-champagne-light">
                <rect x="7" y="5" width="3.6" height="14" rx="1.2" />
                <rect x="13.4" y="5" width="3.6" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-champagne-light">
                <path d="M8 5.2v13.6L19 12z" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[0.86rem] italic text-cream">{label}</p>
            <p className="truncate font-sans text-[0.62rem] uppercase tracking-[0.16em] text-mauve-300">
              {needsGesture && !playing
                ? 'Tap to play'
                : current.artist ?? (span ? `${formatClock(position)} / ${formatClock(span)}` : '♪')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? 'Unmute the music' : 'Mute the music'}
            aria-pressed={muted}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mauve-200 transition-colors hover:text-cream"
          >
            {muted ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M4 9h3.5L12 5v14l-4.5-4H4zM16 9.5l1.4-1.4 2.1 2.1 2.1-2.1L23 9.5 20.9 11.6 23 13.7l-1.4 1.4-2.1-2.1-2.1 2.1L16 13.7l2.1-2.1z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M4 9h3.5L12 5v14l-4.5-4H4zM15.5 8.6a4.6 4.6 0 0 1 0 6.8l1.3 1.3a6.4 6.4 0 0 0 0-9.4zM17.9 6.2a8 8 0 0 1 0 11.6l1.3 1.3a9.8 9.8 0 0 0 0-14.2z" />
              </svg>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
