import { clamp, seededRandom } from './utils';

export interface YarnAnchor {
  /** Position of the knot, in the yarn field's coordinate space. */
  x: number;
  y: number;
  /** Unit vector describing the direction the thread leaves the knot. */
  ex: number;
  ey: number;
}

export interface Point {
  x: number;
  y: number;
}

interface Cubic {
  p0: Point;
  c1: Point;
  c2: Point;
  p1: Point;
}

/** A length of wool: the cord itself, plus the two plies spiralling around it. */
export interface YarnGeometry {
  /** The centreline — what the cord strokes follow. */
  d: string;
  /** Front ply. */
  plyA: string;
  /** Back ply, half a turn out of phase. */
  plyB: string;
}

/**
 * Catmull-Rom through the given points, as cubic beziers. Endpoints are
 * duplicated so the curve starts and ends exactly on the knots — the thread
 * must look tied, not merely nearby.
 */
function splineCubics(points: Point[], tension: number): Cubic[] {
  if (points.length < 2) return [];
  const pts = [points[0], ...points, points[points.length - 1]];
  const cubics: Cubic[] = [];

  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];

    cubics.push({
      p0: p1,
      c1: {
        x: p1.x + ((p2.x - p0.x) / 6) * tension * 2,
        y: p1.y + ((p2.y - p0.y) / 6) * tension * 2,
      },
      c2: {
        x: p2.x - ((p3.x - p1.x) / 6) * tension * 2,
        y: p2.y - ((p3.y - p1.y) / 6) * tension * 2,
      },
      p1: p2,
    });
  }
  return cubics;
}

function cubicsToPath(cubics: Cubic[]): string {
  if (cubics.length === 0) return '';
  let d = `M ${r(cubics[0].p0.x)} ${r(cubics[0].p0.y)}`;
  for (const c of cubics) {
    d += ` C ${r(c.c1.x)} ${r(c.c1.y)}, ${r(c.c2.x)} ${r(c.c2.y)}, ${r(c.p1.x)} ${r(c.p1.y)}`;
  }
  return d;
}

export function splinePath(points: Point[], tension = 0.5): string {
  return cubicsToPath(splineCubics(points, tension));
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

interface Sample extends Point {
  /** Unit tangent. */
  tx: number;
  ty: number;
  /** Arc length from the start of the run. */
  s: number;
}

/** Walks the curve at roughly `spacing` pixel intervals, recording tangents. */
function sampleCubics(cubics: Cubic[], spacing: number): Sample[] {
  const samples: Sample[] = [];
  let arc = 0;
  let previous: Point | null = null;

  for (const c of cubics) {
    // Chord length is a good enough estimate for choosing a subdivision count.
    const rough =
      dist(c.p0, c.c1) + dist(c.c1, c.c2) + dist(c.c2, c.p1);
    const steps = Math.max(6, Math.ceil(rough / spacing));

    for (let i = 0; i <= steps; i++) {
      if (i === 0 && previous) continue; // the previous cubic already ended here
      const t = i / steps;
      const point = cubicAt(c, t);
      const tangent = cubicTangent(c, t);
      const len = Math.hypot(tangent.x, tangent.y) || 1;

      if (previous) arc += dist(previous, point);
      samples.push({ ...point, tx: tangent.x / len, ty: tangent.y / len, s: arc });
      previous = point;
    }
  }
  return samples;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function cubicAt(c: Cubic, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * c.p0.x + b * c.c1.x + d * c.c2.x + e * c.p1.x,
    y: a * c.p0.y + b * c.c1.y + d * c.c2.y + e * c.p1.y,
  };
}

function cubicTangent(c: Cubic, t: number): Point {
  const u = 1 - t;
  const a = 3 * u * u;
  const b = 6 * u * t;
  const d = 3 * t * t;
  return {
    x: a * (c.c1.x - c.p0.x) + b * (c.c2.x - c.c1.x) + d * (c.p1.x - c.c2.x),
    y: a * (c.c1.y - c.p0.y) + b * (c.c2.y - c.c1.y) + d * (c.p1.y - c.c2.y),
  };
}

/**
 * A ply wrapped around the cord.
 *
 * A helix viewed side-on is a sine wave, so offsetting the centreline by
 * `amplitude * sin(arcLength)` traces exactly what one strand of a two-ply
 * yarn looks like. Drawing a second at half a turn's phase gives the two
 * strands crossing over each other — which is what the eye actually reads as
 * "twisted", and what a dash pattern can never be.
 *
 * The ply fades where it passes behind the cord, so the spiral has a front
 * and a back instead of looking painted on.
 */
function plyPath(samples: Sample[], amplitude: number, period: number, phase: number): string {
  if (samples.length < 2) return '';
  let d = '';

  for (const sample of samples) {
    const angle = (sample.s / period) * Math.PI * 2 + phase;
    const offset = Math.sin(angle) * amplitude;
    // Normal to the tangent.
    const x = sample.x - sample.ty * offset;
    const y = sample.y + sample.tx * offset;
    d += `${d ? ' L' : 'M'} ${r(x)} ${r(y)}`;
  }
  return d;
}

export interface YarnSegmentOptions {
  /** How far the thread bows sideways between two knots. Larger on desktop. */
  bow: number;
  /** Stable per-segment seed so the curve never re-rolls between renders. */
  seed: number;
  /** Cord thickness, which sets the scale of the twist. */
  width: number;
}

/**
 * Builds one length of yarn running between two memories.
 *
 * The shape follows three physical ideas rather than any UI convention:
 *  - the thread leaves each knot along that knot's own direction, and arrives
 *    at the next one from outside and above, the way a hanging thread would,
 *  - it bows sideways, most strongly when the run is close to vertical,
 *  - it sags under its own weight.
 * A seeded wobble keeps every length slightly imperfect, the way real wool is.
 */
export function yarnSegment(
  a: YarnAnchor,
  b: YarnAnchor,
  { bow, seed, width }: YarnSegmentOptions,
): YarnGeometry {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const px = -uy;
  const py = ux;

  const verticality = Math.abs(uy);
  const jitter = (n: number) => seededRandom(seed * 13.7 + n) - 0.5;

  const bowSign = seed % 2 === 0 ? 1 : -1;
  const bowAmount = bow * (0.4 + 0.6 * verticality) * bowSign * (0.82 + jitter(1) * 0.36);
  const sag = clamp(len * 0.09, 6, 44) * (0.85 + jitter(2) * 0.3);

  // How far the thread runs before it stops obeying the knot's direction.
  const lead = clamp(len * 0.14, 18, 64);

  const p1: Point = {
    x: a.x + a.ex * lead + jitter(3) * 7,
    y: a.y + a.ey * lead + jitter(4) * 7,
  };
  // The arrival mirrors the departure: outward, but coming down onto the knot.
  const p3: Point = {
    x: b.x + b.ex * lead + jitter(5) * 7,
    y: b.y - b.ey * lead + jitter(6) * 7,
  };

  // The belly of the curve: bowed sideways, pulled down by gravity.
  const p2: Point = {
    x: (a.x + b.x) / 2 + px * bowAmount + jitter(7) * bow * 0.18,
    y: (a.y + b.y) / 2 + py * bowAmount + sag + jitter(8) * 7,
  };

  const cubics = splineCubics([{ x: a.x, y: a.y }, p1, p2, p3, { x: b.x, y: b.y }], 0.62);
  return withPlies(cubics, width);
}

function withPlies(cubics: Cubic[], width: number): YarnGeometry {
  const samples = sampleCubics(cubics, 2.5);
  // A tight twist: roughly one full turn per one and a half cord-widths, with
  // the plies swinging wide enough to fill the cord from edge to edge.
  const period = width * 1.65;
  const amplitude = width * 0.23;

  return {
    d: cubicsToPath(cubics),
    plyA: plyPath(samples, amplitude, period, 0),
    plyB: plyPath(samples, amplitude, period, Math.PI),
  };
}

/**
 * The opening flourish: two separate strands — one for each of them — falling
 * from above and twisting into the single thread that carries the whole story.
 */
export function originStrands(
  target: YarnAnchor,
  width: number,
  height: number,
  cordWidth: number,
): { k: YarnGeometry; r: YarnGeometry; joined: YarnGeometry; joinPoint: Point } {
  // Keep both strands comfortably on screen, however narrow the phone is.
  const spread = Math.max(
    26,
    Math.min(clamp(width * 0.17, 54, 190), target.x - 16, width - target.x - 16),
  );
  const join: Point = { x: target.x, y: target.y - clamp(height * 0.3, 60, 130) };

  const kStart: Point = { x: target.x - spread, y: 0 };
  const rStart: Point = { x: target.x + spread, y: 0 };

  const k = splineCubics(
    [
      kStart,
      { x: kStart.x - spread * 0.16, y: height * 0.3 },
      { x: kStart.x + spread * 0.42, y: height * 0.58 },
      { x: join.x - 4, y: join.y },
    ],
    0.6,
  );

  const rr = splineCubics(
    [
      rStart,
      { x: rStart.x + spread * 0.2, y: height * 0.27 },
      { x: rStart.x - spread * 0.44, y: height * 0.6 },
      { x: join.x + 4, y: join.y },
    ],
    0.6,
  );

  const joined = splineCubics(
    [join, { x: join.x + 5, y: join.y + (target.y - join.y) * 0.5 }, { x: target.x, y: target.y }],
    0.6,
  );

  return {
    k: withPlies(k, cordWidth * 0.72),
    r: withPlies(rr, cordWidth * 0.72),
    joined: withPlies(joined, cordWidth),
    joinPoint: join,
  };
}
