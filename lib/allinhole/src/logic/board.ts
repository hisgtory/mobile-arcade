import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  OBJECT_COLORS,
  type ObjDef,
  type ObjShape,
  type StageConfig,
} from '../types';

const MARGIN = 40;
const MIN_DIST = 20;

// ─── Generate Objects ────────────────────────────────────

export function generateObjects(config: StageConfig): ObjDef[] {
  const objects: ObjDef[] = [];
  const shapes: ObjShape[] = ['circle', 'rect', 'triangle'];

  const sizes = getSizes(config.sizeVariety);

  for (let i = 0; i < config.objectCount; i++) {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const color = OBJECT_COLORS[Math.floor(Math.random() * OBJECT_COLORS.length)];
    const pos = findFreePosition(objects, size, config);

    objects.push({
      shape,
      size,
      color,
      x: pos.x,
      y: pos.y,
    });
  }

  return objects;
}

function getSizes(variety: number): number[] {
  if (variety <= 1) return [10, 12, 14];
  if (variety <= 2) return [8, 10, 14, 18];
  return [6, 8, 10, 14, 18, 22];
}

function findFreePosition(
  existing: ObjDef[],
  size: number,
  _config: StageConfig,
): { x: number; y: number } {
  const areaW = DEFAULT_WIDTH - MARGIN * 2;
  const areaH = DEFAULT_HEIGHT - MARGIN * 2 - 60; // leave top for HUD

  for (let attempt = 0; attempt < 100; attempt++) {
    const x = MARGIN + size + Math.random() * (areaW - size * 2);
    const y = MARGIN + 60 + size + Math.random() * (areaH - size * 2);

    // Check distance from existing objects
    let tooClose = false;
    for (const obj of existing) {
      const dist = Math.sqrt((x - obj.x) ** 2 + (y - obj.y) ** 2);
      if (dist < obj.size + size + MIN_DIST) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) return { x, y };
  }

  // Fallback: random position
  return {
    x: MARGIN + size + Math.random() * (areaW - size * 2),
    y: MARGIN + 60 + size + Math.random() * (areaH - size * 2),
  };
}

// ─── Obstacle Generation ─────────────────────────────────

export interface ObstacleDef {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function generateObstacles(config: StageConfig): ObstacleDef[] {
  if (!config.hasObstacles) return [];

  const count = Math.min(Math.floor(config.stage / 2), 4);
  const obstacles: ObstacleDef[] = [];

  for (let i = 0; i < count; i++) {
    const w = 60 + Math.random() * 40;
    const h = 8 + Math.random() * 4;
    const x = MARGIN + 30 + Math.random() * (DEFAULT_WIDTH - MARGIN * 2 - w);
    const y = MARGIN + 80 + Math.random() * (DEFAULT_HEIGHT - MARGIN * 2 - 120);
    obstacles.push({ x, y, width: w, height: h });
  }

  return obstacles;
}

// ─── Score Calculation ───────────────────────────────────

export function calculateScore(
  objectsSwallowed: number,
  totalObjects: number,
  timeRemainingSec: number,
): number {
  const baseScore = objectsSwallowed * 100;
  const timeBonus = Math.floor(timeRemainingSec * 10);
  const perfectBonus = objectsSwallowed === totalObjects ? 500 : 0;
  return baseScore + timeBonus + perfectBonus;
}
