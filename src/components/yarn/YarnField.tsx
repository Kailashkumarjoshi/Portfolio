'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { motion } from 'framer-motion';
import { YarnContext, type KnotRegistration, type MeasuredAnchor } from './YarnContext';
import { YarnDefs } from './YarnDefs';
import { YarnStrand } from './YarnStrand';
import { originStrands, yarnSegment, type YarnGeometry } from '@/lib/yarn';
import { useDeviceTier, useReducedMotion } from '@/lib/hooks/useDeviceTier';
import { cn } from '@/lib/utils';

interface YarnFieldProps {
  children: ReactNode;
  /** One colour per memory, in render order — the thread takes its dye from them. */
  colors: string[];
  /** Draw the two opening strands that twist into one. */
  showOrigin?: boolean;
  className?: string;
  /** Re-measure whenever this changes (filters, sort order, media loading). */
  layoutKey?: string;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Layout position of `el` relative to `container`, ignoring any transforms. */
function offsetWithin(el: HTMLElement, container: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== container) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}

export function YarnField({
  children,
  colors,
  showOrigin = true,
  className,
  layoutKey = '',
}: YarnFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knots = useRef(new Map<number, KnotRegistration>());
  const frame = useRef<number | null>(null);

  const [anchors, setAnchors] = useState<MeasuredAnchor[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [stitchedTo, setStitchedTo] = useState(-1);

  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const next: MeasuredAnchor[] = [];
    for (const [index, reg] of knots.current) {
      if (!reg.el.isConnected) continue;
      const { x, y } = offsetWithin(reg.el, container);
      next.push({ index, x, y, ex: reg.ex, ey: reg.ey });
    }
    next.sort((a, b) => a.index - b.index);

    setAnchors((prev) => (sameAnchors(prev, next) ? prev : next));
    setSize((prev) => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      return prev.w === w && prev.h === h ? prev : { w, h };
    });
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      measure();
    });
  }, [measure]);

  const registerKnot = useCallback(
    (reg: KnotRegistration) => {
      knots.current.set(reg.index, reg);
      scheduleMeasure();
    },
    [scheduleMeasure],
  );

  const releaseKnot = useCallback(
    (index: number) => {
      knots.current.delete(index);
      scheduleMeasure();
    },
    [scheduleMeasure],
  );

  const requestReveal = useCallback((index: number) => {
    setStitchedTo((prev) => (index > prev ? index : prev));
  }, []);

  // Re-measure on anything that can move a knot.
  useIsomorphicLayoutEffect(() => {
    scheduleMeasure();
  }, [scheduleMeasure, layoutKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(container);

    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);
    // Late-loading photos and webfonts both change the layout under us.
    document.fonts?.ready.then(scheduleMeasure).catch(() => {});
    const onLoad = (e: Event) => {
      if ((e.target as HTMLElement)?.tagName === 'IMG') scheduleMeasure();
    };
    container.addEventListener('load', onLoad, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      container.removeEventListener('load', onLoad, true);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [scheduleMeasure]);

  // Reset the sequence when the visible set of memories changes. Visitors who
  // asked for less motion get the finished thread immediately instead.
  useEffect(() => {
    setStitchedTo(reducedMotion ? Number.MAX_SAFE_INTEGER : -1);
  }, [layoutKey, reducedMotion]);

  // Desktop has room for the thread to sweep; phones keep it in a narrow rail.
  const bow = size.w >= 1024 ? 110 : 32;
  const strokeWidth = size.w >= 1024 ? 13 : 9;

  const segments = useMemo(() => {
    const out: (YarnGeometry & {
      key: string;
      from: string;
      to: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      index: number;
    })[] = [];

    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      out.push({
        ...yarnSegment(a, b, { bow, seed: a.index + 1, width: strokeWidth }),
        key: `${a.index}-${b.index}`,
        from: colors[a.index] ?? '#c4818f',
        to: colors[b.index] ?? '#c4818f',
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        index: a.index,
      });
    }
    return out;
  }, [anchors, bow, colors, strokeWidth]);

  const origin = useMemo(() => {
    const first = anchors[0];
    if (!showOrigin || !first || first.y < 60 || size.w === 0) return null;
    return originStrands(first, size.w, first.y, strokeWidth);
  }, [anchors, showOrigin, size.w, strokeWidth]);

  const api = useMemo(
    () => ({ registerKnot, releaseKnot, stitchedTo, requestReveal, ready: anchors.length > 0 }),
    [registerKnot, releaseKnot, stitchedTo, requestReveal, anchors.length],
  );

  const originDrawn = stitchedTo >= 0;

  return (
    <YarnContext.Provider value={api}>
      <div ref={containerRef} className={cn('relative', className)}>
        {size.w > 0 && (
          <svg
            className="pointer-events-none absolute left-0 top-0 z-0"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            aria-hidden="true"
            focusable="false"
          >
            <YarnDefs />

            {origin && (
              <OriginYarn
                origin={origin}
                width={strokeWidth}
                tier={tier}
                drawn={originDrawn}
                instant={reducedMotion}
                color={colors[0] ?? '#c4818f'}
              />
            )}

            {segments.map((segment) => (
              <YarnStrand
                key={segment.key}
                id={segment.key}
                d={segment.d}
                plyA={segment.plyA}
                plyB={segment.plyB}
                from={segment.from}
                to={segment.to}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                width={strokeWidth}
                tier={tier}
                drawn={stitchedTo >= segment.index}
                instant={reducedMotion}
                duration={1.55}
                delay={0.28}
                onDrawn={() => requestReveal(segment.index + 1)}
              />
            ))}
          </svg>
        )}

        <div className="relative z-10">{children}</div>
      </div>
    </YarnContext.Provider>
  );
}

function sameAnchors(a: MeasuredAnchor[], b: MeasuredAnchor[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].index !== b[i].index ||
      Math.abs(a[i].x - b[i].x) > 0.5 ||
      Math.abs(a[i].y - b[i].y) > 0.5
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Two strands — hers and his, in whichever order you like — falling separately
 * and twisting into the single thread the rest of the story is told on.
 * Stated once, visually, and never explained.
 */
function OriginYarn({
  origin,
  width,
  tier,
  drawn,
  instant,
  color,
}: {
  origin: ReturnType<typeof originStrands>;
  width: number;
  tier: 'rich' | 'lean';
  drawn: boolean;
  instant: boolean;
  color: string;
}) {
  const strands = [
    { key: 'k', geometry: origin.k, tone: '#b9a9cc' },
    { key: 'r', geometry: origin.r, tone: '#cf919c' },
  ];

  return (
    <g>
      {strands.map((strand, i) => (
        <YarnStrand
          key={strand.key}
          id={`origin-${strand.key}`}
          d={strand.geometry.d}
          plyA={strand.geometry.plyA}
          plyB={strand.geometry.plyB}
          from={strand.tone}
          to={color}
          x1={0}
          y1={0}
          x2={0}
          y2={origin.joinPoint.y}
          width={width * 0.72}
          tier={tier}
          drawn={drawn}
          instant={instant}
          duration={1.9}
          delay={i * 0.12}
        />
      ))}

      <YarnStrand
        id="origin-joined"
        d={origin.joined.d}
        plyA={origin.joined.plyA}
        plyB={origin.joined.plyB}
        from={color}
        to={color}
        x1={origin.joinPoint.x}
        y1={origin.joinPoint.y}
        x2={origin.joinPoint.x}
        y2={origin.joinPoint.y + 80}
        width={width}
        tier={tier}
        drawn={drawn}
        instant={instant}
        duration={0.7}
        delay={instant ? 0 : 1.75}
      />

      {/* The bind where the two become one. */}
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: drawn ? 1 : 0, scale: drawn ? 1 : 0.6 }}
        transition={instant ? { duration: 0 } : { duration: 0.5, delay: 1.85 }}
        style={{ transformOrigin: `${origin.joinPoint.x}px ${origin.joinPoint.y}px` }}
      >
        <ellipse
          cx={origin.joinPoint.x}
          cy={origin.joinPoint.y}
          rx={width * 0.78}
          ry={width * 1.05}
          fill={color}
        />
        <ellipse
          cx={origin.joinPoint.x - width * 0.18}
          cy={origin.joinPoint.y - width * 0.3}
          rx={width * 0.22}
          ry={width * 0.3}
          fill="rgba(255,246,238,0.4)"
        />
      </motion.g>
    </g>
  );
}
