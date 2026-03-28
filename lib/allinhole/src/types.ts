// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Object Types ────────────────────────────────────────
export type ObjShape = 'circle' | 'rect' | 'triangle';

export interface ObjDef {
  shape: ObjShape;
  size: number; // radius or half-width
  color: number;
  x: number;
  y: number;
}

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  objectCount: number;
  holeRadius: number;
  timeLimitSec: number;
  /** How many sizes of objects to include (small / medium / large) */
  sizeVariety: number;
  /** Whether stage has obstacles */
  hasObstacles: boolean;
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, objectCount: 8, holeRadius: 30, timeLimitSec: 30, sizeVariety: 1, hasObstacles: false },
    { stage: 2, objectCount: 12, holeRadius: 28, timeLimitSec: 35, sizeVariety: 2, hasObstacles: false },
    { stage: 3, objectCount: 16, holeRadius: 26, timeLimitSec: 40, sizeVariety: 2, hasObstacles: false },
    { stage: 4, objectCount: 20, holeRadius: 24, timeLimitSec: 45, sizeVariety: 3, hasObstacles: true },
    { stage: 5, objectCount: 25, holeRadius: 22, timeLimitSec: 50, sizeVariety: 3, hasObstacles: true },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 5: scale up difficulty
  const objectCount = Math.min(25 + (stage - 5) * 3, 40);
  const holeRadius = Math.max(22 - (stage - 5), 16);
  const timeLimitSec = Math.min(50 + (stage - 5) * 5, 90);
  return { stage, objectCount, holeRadius, timeLimitSec, sizeVariety: 3, hasObstacles: true };
}

// ─── Game Types ──────────────────────────────────────────
export interface GameConfig {
  stage?: number;
}

// ─── Colors ──────────────────────────────────────────────
export const OBJECT_COLORS: readonly number[] = [
  0xef4444, // Red
  0x3b82f6, // Blue
  0x22c55e, // Green
  0xeab308, // Yellow
  0xa855f7, // Purple
  0xf97316, // Orange
  0xec4899, // Pink
  0x06b6d4, // Cyan
  0x84cc16, // Lime
  0xf43f5e, // Rose
] as const;
