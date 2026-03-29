import {
  SHAPES,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  OBJECT_SIZE_BASE,
  type StageConfig,
  type BoardState,
  type GameObject,
  type ObjectShape,
} from '../types';

// ─── Board Creation ──────────────────────────────────────

const MAX_PLACEMENT_ATTEMPTS = 100;

export function createBoard(config: StageConfig, dpr: number): BoardState {
  const { objectCount, shapeTypes, holeRadius } = config;
  const w = DEFAULT_WIDTH * dpr;
  const h = DEFAULT_HEIGHT * dpr;
  const holeX = w / 2;
  const holeY = h / 2;
  const holeR = holeRadius * dpr;
  const objSize = OBJECT_SIZE_BASE * dpr;
  const margin = objSize;
  const safeRadius = holeR + objSize + 10 * dpr;

  const availableShapes = SHAPES.slice(0, shapeTypes);
  const objects: GameObject[] = [];

  for (let i = 0; i < objectCount; i++) {
    const shape: ObjectShape = availableShapes[i % availableShapes.length];

    // Place object randomly, avoiding hole center and edges
    let x: number, y: number;
    let attempts = 0;
    do {
      x = margin + Math.random() * (w - margin * 2);
      y = margin + Math.random() * (h - margin * 2);
      attempts++;
    } while (
      Math.hypot(x - holeX, y - holeY) < safeRadius &&
      attempts < MAX_PLACEMENT_ATTEMPTS
    );

    objects.push({ id: i, shape, x, y, absorbed: false });
  }

  return { objects, holeX, holeY, holeRadius: holeR };
}

// ─── Absorption Check ────────────────────────────────────

export function isInHole(
  obj: GameObject,
  holeX: number,
  holeY: number,
  holeRadius: number,
  dpr: number,
): boolean {
  const objRadius = OBJECT_SIZE_BASE * dpr * 0.4;
  const dist = Math.hypot(obj.x - holeX, obj.y - holeY);
  return dist + objRadius < holeRadius;
}

// ─── Win Check ───────────────────────────────────────────

export function isWon(objects: GameObject[]): boolean {
  return objects.every((o) => o.absorbed);
}

// ─── Remaining Count ─────────────────────────────────────

export function remainingCount(objects: GameObject[]): number {
  return objects.filter((o) => !o.absorbed).length;
}
