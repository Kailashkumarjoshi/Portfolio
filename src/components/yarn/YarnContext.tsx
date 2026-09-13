'use client';

import { createContext, useContext } from 'react';
import type { YarnAnchor } from '@/lib/yarn';

export interface KnotRegistration {
  index: number;
  el: HTMLElement;
  /** Direction the thread leaves this knot, as a unit vector. */
  ex: number;
  ey: number;
}

export interface YarnApi {
  /** Called by each memory's knot so the field knows where to tie the thread. */
  registerKnot: (reg: KnotRegistration) => void;
  releaseKnot: (index: number) => void;
  /** Index of the furthest memory the thread has reached. */
  stitchedTo: number;
  /** Fast scrollers shouldn't wait for the animation — lets a card reveal itself. */
  requestReveal: (index: number) => void;
  /** True when anchors have been measured at least once. */
  ready: boolean;
}

const noop = () => {};

export const YarnContext = createContext<YarnApi>({
  registerKnot: noop,
  releaseKnot: noop,
  stitchedTo: Number.MAX_SAFE_INTEGER,
  requestReveal: noop,
  ready: true,
});

export function useYarn(): YarnApi {
  return useContext(YarnContext);
}

export interface MeasuredAnchor extends YarnAnchor {
  index: number;
}
