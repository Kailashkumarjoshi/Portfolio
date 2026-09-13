'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Monogram } from './Monogram';
import { useMusic } from './MusicProvider';
import { useReducedMotion } from '@/lib/hooks/useDeviceTier';

const SEEN_KEY = 'kr-entered';

/**
 * The door into the story. It exists for one practical reason as well as the
 * romantic one: the visitor's tap on "Begin" is the gesture browsers require
 * before any music is allowed to start.
 */
export function EntryScreen({
  initials,
  kicker,
  label,
  enabled,
}: {
  initials: string;
  kicker: string | null;
  label: string;
  enabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toggle, available } = useMusic();
  const reduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    if (!enabled) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      // Private browsing — show the door, it costs one tap.
    }
    if (!seen) {
      setOpen(true);
      document.body.style.overflow = 'hidden';
    }
  }, [enabled]);

  const enter = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* not essential */
    }
    document.body.style.overflow = '';
    setOpen(false);
    if (available) toggle();
    requestAnimationFrame(() => {
      document.getElementById('story-top')?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="entry"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-midnight-900 px-6 text-center"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 45% at 50% 42%, rgba(124,39,67,.4), transparent 70%), radial-gradient(40% 30% at 50% 40%, rgba(227,201,160,.13), transparent 72%)',
            }}
          />

          {/* A single strand, waiting to be picked up. */}
          <motion.svg
            aria-hidden="true"
            width="3"
            height="120"
            viewBox="0 0 3 120"
            className="absolute left-1/2 top-0 -translate-x-1/2 overflow-visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            <path
              d="M1.5 0 C 1.5 30, -2 50, 1.5 74 C 4 92, 0 104, 1.5 120"
              fill="none"
              stroke="rgba(196,129,143,0.55)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </motion.svg>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            {kicker && <p className="kicker mb-7 text-mauve-300">{kicker}</p>}
            <Monogram initials={initials} size="lg" />
            <p className="mt-8 max-w-sm font-serif text-base italic leading-relaxed text-mauve-200">
              Everything that happened, kept in one place.
            </p>
            <button type="button" onClick={enter} className="btn-primary mt-10">
              {label}
            </button>
            {available && (
              <p className="mt-5 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-mauve-300/70">
                ♪ best with sound
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
