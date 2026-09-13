'use client';

import { useEffect, useId, useRef } from 'react';
import { useYarn } from './YarnContext';
import { cn, shade } from '@/lib/utils';

interface YarnKnotProps {
  index: number;
  /** Which way the thread leaves this memory. */
  direction: 'left' | 'right';
  /** Accent colour of the memory's mood — the knot is tied in that wool. */
  accent: string;
  className?: string;
}

/**
 * The physical tie point: an eyelet punched through the card, the wool threaded
 * through it and knotted off on the front. Every length of yarn in the story
 * begins and ends on one of these, so the thread is never floating near a card —
 * it is fastened to it.
 */
export function YarnKnot({ index, direction, accent, className }: YarnKnotProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { registerKnot, releaseKnot } = useYarn();
  const uid = useId().replace(/:/g, '');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The thread leaves outward and a little downward, as a hanging thread would.
    const ex = direction === 'left' ? -0.96 : 0.96;
    registerKnot({ index, el, ex, ey: 0.28 });
    return () => releaseKnot(index);
  }, [index, direction, registerKnot, releaseKnot]);

  const rim = shade(accent, -0.55);
  const lit = shade(accent, 0.4);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute block h-6 w-6 lg:h-8 lg:w-8', className)}
    >
      <svg viewBox="0 0 32 32" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id={`knot-bulb-${uid}`} cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor={lit} />
            <stop offset="55%" stopColor={accent} />
            <stop offset="100%" stopColor={rim} />
          </radialGradient>
        </defs>

        {/* Eyelet punched through the paper. */}
        <ellipse cx="16" cy="16" rx="6.4" ry="6.4" fill="rgba(30,16,24,0.45)" />
        <ellipse cx="16" cy="17.4" rx="6" ry="4.6" fill="rgba(20,10,18,0.4)" />
        <circle
          cx="16"
          cy="16"
          r="6.4"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.9"
        />

        {/* Wool passing through the eyelet: rim, dye, then a lit edge. */}
        <g strokeLinecap="round" fill="none">
          <path d="M7.6 10.4 C 11 6.6, 20.6 6.4, 24.2 11" stroke={rim} strokeWidth="6.4" />
          <path d="M7.6 10.4 C 11 6.6, 20.6 6.4, 24.2 11" stroke={accent} strokeWidth="5" />
          <path
            d="M7.6 10.4 C 11 6.6, 20.6 6.4, 24.2 11"
            stroke={lit}
            strokeWidth="1.7"
            transform="translate(-0.5,-1)"
            opacity="0.8"
          />

          <path d="M8.4 21.8 C 11.6 25.6, 20.4 25.6, 23.6 21.4" stroke={rim} strokeWidth="5.8" />
          <path d="M8.4 21.8 C 11.6 25.6, 20.4 25.6, 23.6 21.4" stroke={accent} strokeWidth="4.4" />
        </g>

        {/* The knot itself, sitting proud of the card. */}
        <ellipse cx="16" cy="16" rx="5" ry="4.4" fill={rim} />
        <ellipse cx="16" cy="15.6" rx="4.2" ry="3.7" fill={`url(#knot-bulb-${uid})`} />
        <ellipse cx="14.4" cy="14.2" rx="1.3" ry="1" fill="rgba(255,250,244,0.6)" />
      </svg>
    </span>
  );
}
