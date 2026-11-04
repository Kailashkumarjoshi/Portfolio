'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';
import { shade } from '@/lib/utils';

export interface YarnStrandProps {
  id: string;
  /** Centreline of the cord. */
  d: string;
  /** Front ply of the twist. */
  plyA: string;
  /** Back ply, half a turn out of phase. */
  plyB: string;
  /** Colour where the thread leaves the previous memory. */
  from: string;
  /** Colour where it arrives at the next one. */
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  tier: DeviceTier;
  drawn: boolean;
  instant: boolean;
  duration?: number;
  delay?: number;
  onDrawn?: () => void;
}

/**
 * One length of wool between two memories.
 *
 * A single stroke always reads as a UI line, so the thread is built the way an
 * illustrator would paint one:
 *
 *   roundness — four concentric strokes of decreasing width, each a step
 *     lighter, offset slightly toward the light. Stacking them produces the
 *     across-the-strand gradient SVG cannot express directly, and it is what
 *     makes the yarn look cylindrical rather than flat.
 *   twist — two dashed plies riding either side of the centre at opposite
 *     phase, so the eye reads them as spiralling around each other.
 *   fibre — a fractal displacement over the whole stack, which roughens every
 *     edge by a pixel or two. Nothing spun is ever perfectly smooth.
 *   air — a blurred halo for loose fibres, and a soft shadow dropped on the
 *     page so the thread sits above it.
 *
 * The stack is revealed through an animated mask, so the wool grows out of one
 * knot and travels to the next instead of fading in.
 */
export const YarnStrand = memo(function YarnStrand({
  id,
  d,
  plyA,
  plyB,
  from,
  to,
  x1,
  y1,
  x2,
  y2,
  width,
  tier,
  drawn,
  instant,
  duration = 1.5,
  delay = 0,
  onDrawn,
}: YarnStrandProps) {
  const rich = tier === 'rich';
  const maskId = `yarn-mask-${id}`;
  const coreId = `yarn-core-${id}`;
  const liftId = `yarn-lift-${id}`;
  const deepId = `yarn-deep-${id}`;


  return (
    <g>
      <defs>
        <linearGradient id={coreId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>

        <linearGradient id={liftId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor={shade(from, 0.28)} />
          <stop offset="100%" stopColor={shade(to, 0.28)} />
        </linearGradient>

        <linearGradient id={deepId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor={shade(from, -0.3)} />
          <stop offset="100%" stopColor={shade(to, -0.3)} />
        </linearGradient>

        <mask id={maskId} maskUnits="userSpaceOnUse">
          <motion.path
            d={d}
            fill="none"
            stroke="#fff"
            strokeWidth={width * 3.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: drawn ? 1 : 0 }}
            transition={instant ? { duration: 0 } : { duration, delay, ease: [0.33, 0.02, 0.18, 1] }}
            onAnimationComplete={() => {
              if (drawn) onDrawn?.();
            }}
          />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        {/* Shadow cast onto the page. Outside the fibre filter — it should stay soft. */}
        <path
          d={d}
          fill="none"
          stroke="rgba(12,5,10,0.5)"
          strokeWidth={width * 1.1}
          strokeLinecap="round"
          transform={`translate(${(width * 0.28).toFixed(2)}, ${(width * 0.5).toFixed(2)})`}
          filter={rich ? 'url(#yarn-soft)' : undefined}
          opacity={rich ? 1 : 0.4}
        />

        <g filter={rich ? 'url(#yarn-fibres)' : undefined}>
          {/* Loose fibres catching the light around the strand. */}
          {rich && (
            <path
              d={d}
              fill="none"
              stroke={`url(#${coreId})`}
              strokeWidth={width * 2.05}
              strokeLinecap="round"
              opacity="0.2"
              filter="url(#yarn-fuzz)"
            />
          )}

          {/* Roundness: concentric strokes, dark rim to lit centre. */}
          <path
            d={d}
            fill="none"
            stroke={shade(from, -0.62)}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={d}
            fill="none"
            stroke={`url(#${coreId})`}
            strokeWidth={width * 0.82}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(-${(width * 0.05).toFixed(2)}, -${(width * 0.05).toFixed(2)})`}
          />
          <path
            d={d}
            fill="none"
            stroke={`url(#${liftId})`}
            strokeWidth={width * 0.3}
            strokeLinecap="round"
            opacity="0.75"
            transform={`translate(-${(width * 0.17).toFixed(2)}, -${(width * 0.17).toFixed(2)})`}
          />

          {/* The twist: two plies of the same wool spiralling around each other,
              half a turn apart and wide enough to fill the cord. The back one
              is laid down first, so the front one crosses over it. */}
          <path
            d={plyB}
            fill="none"
            stroke={`url(#${deepId})`}
            strokeWidth={width * 0.56}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          <path
            d={plyA}
            fill="none"
            stroke={`url(#${coreId})`}
            strokeWidth={width * 0.54}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.92"
          />
          {/* Candlelight catching the crest of the front ply. */}
          <path
            d={plyA}
            fill="none"
            stroke="rgba(255,248,242,0.3)"
            strokeWidth={width * 0.13}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(-${(width * 0.11).toFixed(2)}, -${(width * 0.11).toFixed(2)})`}
          />

        </g>
      </g>
    </g>
  );
});
