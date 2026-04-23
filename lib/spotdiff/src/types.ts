export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 700;

export type ShapeType = 'circle' | 'rect' | 'triangle' | 'star';

export const SHAPE_TYPES: readonly ShapeType[] = ['circle', 'rect', 'triangle', 'star'];

export const SHAPE_COLORS: readonly number[] = [
  0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7,
  0xf97316, 0xec4899, 0x06b6d4, 0x84cc16, 0x6366f1,
];

export const MAX_LIVES = 3;
export const PANEL_GAP = 10;

export interface ShapeItem {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  color: number;
  rotation: number;
}

export type DiffType = 'color' | 'shape' | 'missing' | 'position' | 'size';

export interface Difference {
  id: number;
  shapeId: number;
  type: DiffType;
  origValue: unknown;
  diffValue: unknown;
  found: boolean;
  x: number;
  y: number;
}

export interface StageConfig {
  stage: number;
  shapeCount: number;
  diffCount: number;
  timeLimit: number;
  diffTypes: DiffType[];
}

export interface GameConfig {
  stage?: number;
}

export interface BoardState {
  shapes: ShapeItem[];
  differences: Difference[];
  foundCount: number;
  lives: number;
  maxLives: number;
}

export function getStageConfig(stage: number): StageConfig {
  switch (stage) {
    case 1:
      return { stage: 1, shapeCount: 8, diffCount: 3, timeLimit: 60, diffTypes: ['color', 'missing'] };
    case 2:
      return { stage: 2, shapeCount: 12, diffCount: 4, timeLimit: 60, diffTypes: ['color', 'missing', 'shape'] };
    case 3:
      return { stage: 3, shapeCount: 16, diffCount: 5, timeLimit: 50, diffTypes: ['color', 'missing', 'shape', 'position'] };
    case 4:
      return { stage: 4, shapeCount: 20, diffCount: 5, timeLimit: 45, diffTypes: ['color', 'missing', 'shape', 'position', 'size'] };
    case 5:
      return { stage: 5, shapeCount: 25, diffCount: 6, timeLimit: 40, diffTypes: ['color', 'missing', 'shape', 'position', 'size'] };
    default: {
      const shapeCount = Math.min(25 + (stage - 5) * 3, 40);
      const diffCount = Math.min(6 + (stage - 5), 10);
      return {
        stage,
        shapeCount,
        diffCount,
        timeLimit: 40,
        diffTypes: ['color', 'missing', 'shape', 'position', 'size'],
      };
    }
  }
}
