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
  let count = 0;
  for (let i = 0; i < ropes.length; i++) {
    for (let j = i + 1; j < ropes.length; j++) {
      const r1 = ropes[i];
      const r2 = ropes[j];
      // Skip ropes that share a pin (they naturally connect)
      if (r1.pinA === r2.pinA || r1.pinA === r2.pinB ||
          r1.pinB === r2.pinA || r1.pinB === r2.pinB) continue;

      const p1 = pins.find(p => p.id === r1.pinA)!;
      const p2 = pins.find(p => p.id === r1.pinB)!;
      const p3 = pins.find(p => p.id === r2.pinA)!;
      const p4 = pins.find(p => p.id === r2.pinB)!;

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
  const cx = w / 2;
  const cy = h / 2;
  const pad = PADDING * dpr;
  const radius = Math.min(w, h) / 2 - pad;

  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Place pins in a circle (this is the "solution" layout)
    const pins: Pin[] = [];
    for (let i = 0; i < pinCount; i++) {
      const angle = (2 * Math.PI * i) / pinCount - Math.PI / 2;
      pins.push({
        id: i,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        colorIndex: i % 10,
      });
    }

    // Create ropes - connect neighbors + some cross-connections
    const ropes: Rope[] = [];
    const usedPairs = new Set<string>();

    const addRope = (a: number, b: number, colorIdx: number): boolean => {
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (usedPairs.has(key)) return false;
      usedPairs.add(key);
      ropes.push({ id: ropes.length, pinA: a, pinB: b, colorIndex: colorIdx });
      return true;
    };

    // Connect adjacent pins
    for (let i = 0; i < pinCount; i++) {
      addRope(i, (i + 1) % pinCount, i % 10);
    }

    // Add extra ropes for more complexity
    let extraAttempts = 0;
    while (ropes.length < ropeCount && extraAttempts < 200) {
      extraAttempts++;
      const a = Math.floor(Math.random() * pinCount);
      let b = Math.floor(Math.random() * pinCount);
      if (a === b) continue;
      // Prefer non-adjacent for more interesting tangles
      if (Math.abs(a - b) === 1 || Math.abs(a - b) === pinCount - 1) {
        if (Math.random() < 0.5) continue;
      }
      addRope(a, b, ropes.length % 10);
    }

    // Now scramble pin positions to create tangles
    const scrambled = scramblePins(pins, w, h, pad);

    // Check that we have intersections (tangled)
    const intersections = countIntersections(scrambled, ropes);
    if (intersections > 0) {
      return { pins: scrambled, ropes };
    }
  }

  // Fallback: just return a scrambled board even if it's already solved
  // (shouldn't happen with enough pins/ropes)
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
  for (let i = 0; i < Math.min(ropeCount, pinCount); i++) {
    ropes.push({ id: i, pinA: i, pinB: (i + 1) % pinCount, colorIndex: i % 10 });
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
