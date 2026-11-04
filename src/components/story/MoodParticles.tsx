'use client';

import { useMemo } from 'react';
import { moodTheme } from '@/lib/moods';
import type { MoodKey } from '@/lib/types';
import { seededRandom } from '@/lib/utils';
import { useDeviceTier, useReducedMotion } from '@/lib/hooks/useDeviceTier';

/**
 * A few motes of warm light around a memory, chosen by its mood.
 * Never more than a handful, never on lean devices, never under reduced motion.
 */
export function MoodParticles({
  mood,
  active,
  seed,
}: {
  mood: MoodKey | null;
  active: boolean;
  seed: number;
}) {
  const tier = useDeviceTier();
  const reduced = useReducedMotion();
  const theme = moodTheme(mood);

  const motes = useMemo(() => {
    if (!theme.particle || theme.particleCount === 0) return [];
    return Array.from({ length: theme.particleCount }, (_, i) => {
      const r = (n: number) => seededRandom(seed * 31 + i * 7 + n);
      return {
        left: `${6 + r(1) * 88}%`,
        top: `${8 + r(2) * 84}%`,
        size: 0.45 + r(3) * 0.6,
        delay: r(4) * 6,
        duration: 7 + r(5) * 7,
        opacity: 0.3 + r(6) * 0.45,
      };
    });
  }, [theme.particle, theme.particleCount, seed]);

  if (!active || reduced || tier === 'lean' || motes.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-6 -z-[5] overflow-hidden">
      {motes.map((mote, i) => (
        <span
          key={i}
          className="absolute animate-drift select-none leading-none"
          style={{
            left: mote.left,
            top: mote.top,
            fontSize: `${mote.size}rem`,
            color: theme.accent,
            opacity: mote.opacity,
            animationDelay: `${mote.delay}s`,
            animationDuration: `${mote.duration}s`,
            textShadow: `0 0 12px ${theme.accent}`,
          }}
        >
          {theme.particle}
        </span>
      ))}
    </div>
  );
}
