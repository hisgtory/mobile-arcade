// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

export const HOLE_RADIUS_BASE = 40;
export const OBJECT_SIZE_BASE = 30;

// ─── Object Shapes ───────────────────────────────────────
export type ObjectShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'star';

export const SHAPES: ObjectShape[] = ['circle', 'square', 'triangle', 'diamond', 'star'];

export const SHAPE_COLORS: Record<ObjectShape, string> = {
  circle: '#EF4444',
  square: '#3B82F6',
  triangle: '#22C55E',
  diamond: '#EAB308',
  star: '#A855F7',
};

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  objectCount: number;
  shapeTypes: number;
  holeRadius: number;
  timeLimit: number; // seconds, 0 = no limit
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, objectCount: 6, shapeTypes: 2, holeRadius: 45, timeLimit: 30 },
    { stage: 2, objectCount: 10, shapeTypes: 3, holeRadius: 42, timeLimit: 35 },
    { stage: 3, objectCount: 14, shapeTypes: 3, holeRadius: 40, timeLimit: 40 },
    { stage: 4, objectCount: 18, shapeTypes: 4, holeRadius: 38, timeLimit: 45 },
    { stage: 5, objectCount: 22, shapeTypes: 4, holeRadius: 36, timeLimit: 50 },
    { stage: 6, objectCount: 26, shapeTypes: 5, holeRadius: 34, timeLimit: 55 },
    { stage: 7, objectCount: 30, shapeTypes: 5, holeRadius: 32, timeLimit: 60 },
    { stage: 8, objectCount: 34, shapeTypes: 5, holeRadius: 30, timeLimit: 65 },
    { stage: 9, objectCount: 38, shapeTypes: 5, holeRadius: 28, timeLimit: 70 },
    { stage: 10, objectCount: 42, shapeTypes: 5, holeRadius: 26, timeLimit: 75 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 10: scale up
  const objectCount = Math.min(42 + (stage - 10) * 4, 60);
  const holeRadius = Math.max(26 - (stage - 10), 20);
  return { stage, objectCount, shapeTypes: 5, holeRadius, timeLimit: 75 + (stage - 10) * 5 };
}

// ─── Game Types ──────────────────────────────────────────
export interface GameObject {
  id: number;
  shape: ObjectShape;
  x: number;
  y: number;
  absorbed: boolean;
}

export interface BoardState {
  objects: GameObject[];
  holeX: number;
  holeY: number;
  holeRadius: number;
}

export interface GameConfig {
  stage?: number;
}
