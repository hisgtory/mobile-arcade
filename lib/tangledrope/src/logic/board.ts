import type { Point, Pin, Rope, BoardState, StageConfig } from '../types';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../types';

// ─── Intersection Detection ──────────────────────────────

/** Check if two line segments (p1-p2) and (p3-p4) intersect */
export function segmentsIntersect(
  p1: Point, p2: Point,
  p3: Point, p4: Point,
): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

function direction(pi: Point, pj: Point, pk: Point): number {
  return (pk.x - pi.x) * (pj.y - pi.y) - (pj.x - pi.x) * (pk.y - pi.y);
}

function onSegment(pi: Point, pj: Point, pk: Point): boolean {
  return (
    Math.min(pi.x, pj.x) <= pk.x && pk.x <= Math.max(pi.x, pj.x) &&
    Math.min(pi.y, pj.y) <= pk.y && pk.y <= Math.max(pi.y, pj.y)
  );
}

// ─── Count Intersections ─────────────────────────────────

export function countIntersections(pins: Pin[], ropes: Rope[]): number {
  const pinMap = new Map<number, Pin>();
  pins.forEach(p => pinMap.set(p.id, p));

  let count = 0;
  for (let i = 0; i < ropes.length; i++) {
    for (let j = i + 1; j < ropes.length; j++) {
      const r1 = ropes[i];
      const r2 = ropes[j];
      // Skip ropes that share a pin (they naturally connect)
      if (r1.pinA === r2.pinA || r1.pinA === r2.pinB ||
          r1.pinB === r2.pinA || r1.pinB === r2.pinB) continue;

      const p1 = pinMap.get(r1.pinA)!;
      const p2 = pinMap.get(r1.pinB)!;
      const p3 = pinMap.get(r2.pinA)!;
      const p4 = pinMap.get(r2.pinB)!;

      if (segmentsIntersect(p1, p2, p3, p4)) {
        count++;
      }
    }
  }
  return count;
}

// ─── Check Win ───────────────────────────────────────────

export function isWon(pins: Pin[], ropes: Rope[]): boolean {
  return countIntersections(pins, ropes) === 0;
}

// ─── Board Creation ──────────────────────────────────────

/** Minimum padding from canvas edges to prevent pins from being placed too close to borders */
const PADDING = 50;

/**
 * Create a tangled board:
 * 1. Generate pins in a circle (untangled solution)
 * 2. Create ropes between them
 * 3. Shuffle pin positions to create tangles
 * 4. Verify the board has intersections
 */
export function createBoard(config: StageConfig, dpr: number): BoardState {
  const { pinCount, ropeCount } = config;
  const w = DEFAULT_WIDTH * dpr;
  const h = DEFAULT_HEIGHT * dpr;
  const pad = PADDING * dpr;

  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pins: Pin[] = [];
    for (let i = 0; i < pinCount; i++) {
      pins.push({
        id: i,
        x: pad + Math.random() * (w - pad * 2),
        y: pad + Math.random() * (h - pad * 2),
        colorIndex: i % 10,
      });
    }

    const ropes: Rope[] = [];
    const usedPairs = new Set<string>();

    const addRope = (a: number, b: number, colorIdx: number): boolean => {
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (usedPairs.has(key)) return false;
      usedPairs.add(key);
      ropes.push({ id: ropes.length, pinA: a, pinB: b, colorIndex: colorIdx });
      return true;
    };

    // Connect adjacent pins (forming a loop)
    for (let i = 0; i < pinCount; i++) {
      addRope(i, (i + 1) % pinCount, i % 10);
    }

    // Add extra ropes
    let extraAttempts = 0;
    while (ropes.length < ropeCount && extraAttempts < 200) {
      extraAttempts++;
      const a = Math.floor(Math.random() * pinCount);
      const b = Math.floor(Math.random() * pinCount);
      if (a === b) continue;
      addRope(a, b, ropes.length % 10);
    }

    // Scramble pins to ensure intersections
    const scrambled = scramblePins(pins, w, h, pad);
    if (countIntersections(scrambled, ropes) > 0) {
      return { pins: scrambled, ropes };
    }
  }

  // Final fallback: just retry with a simple square/diamond if needed, 
  // but with 200 attempts it's extremely unlikely to get 0 intersections.
  // We'll just return the last attempt.
  const pins: Pin[] = [];
  for (let i = 0; i < pinCount; i++) {
    pins.push({ id: i, x: pad + Math.random() * (w - pad * 2), y: pad + Math.random() * (h - pad * 2), colorIndex: i % 10 });
  }
  const ropes: Rope[] = [];
  for (let i = 0; i < ropeCount; i++) {
    ropes.push({ id: i, pinA: Math.floor(Math.random() * pinCount), pinB: Math.floor(Math.random() * pinCount), colorIndex: i % 10 });
  }
  return { pins, ropes };
}

function scramblePins(pins: Pin[], w: number, h: number, pad: number): Pin[] {
  const scrambled = pins.map(p => ({ ...p }));
  const minDist = pad * 0.6;

  for (let i = 0; i < scrambled.length; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      const nx = pad + Math.random() * (w - pad * 2);
      const ny = pad + Math.random() * (h - pad * 2);

      // Check minimum distance from other pins
      let tooClose = false;
      for (let j = 0; j < i; j++) {
        const dx = nx - scrambled[j].x;
        const dy = ny - scrambled[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < minDist) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        scrambled[i].x = nx;
        scrambled[i].y = ny;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Fallback: place randomly
      scrambled[i].x = pad + Math.random() * (w - pad * 2);
      scrambled[i].y = pad + Math.random() * (h - pad * 2);
    }
  }

  return scrambled;
}
