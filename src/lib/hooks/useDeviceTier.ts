'use client';

import { useEffect, useState } from 'react';

export type DeviceTier = 'rich' | 'lean';

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

/**
 * Decides how much visual richness this device should be asked to render.
 *
 * `lean` drops the expensive SVG filter work (turbulence displacement, blurred
 * fuzz and shadow layers) while keeping every structural part of the yarn, so
 * the story reads identically — it just costs a fraction of the paint time.
 * Server render always starts `lean`; we only upgrade once we can measure.
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>('lean');

  useEffect(() => {
    const nav = navigator as NavigatorWithHints;

    const evaluate = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'lean' as const;
      if (nav.connection?.saveData) return 'lean' as const;
      if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return 'lean' as const;
      if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) {
        return 'lean' as const;
      }
      // Small touch screens: keep the paint budget for scrolling.
      if (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 900) {
        return 'lean' as const;
      }
      return 'rich' as const;
    };

    setTier(evaluate());

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setTier(evaluate());
    motionQuery.addEventListener('change', onChange);
    return () => motionQuery.removeEventListener('change', onChange);
  }, []);

  return tier;
}

/** Straightforward reduced-motion flag, tracked live. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** True once the viewport is at or above the given pixel width. */
export function useMinWidth(px: number): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${px}px)`);
    setMatches(query.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [px]);

  return matches;
}
