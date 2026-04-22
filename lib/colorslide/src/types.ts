// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Colors ──────────────────────────────────────────────
export const TILE_COLORS: readonly string[] = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
] as const;

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  gridSize: number;    // NxN grid
  numColors: number;   // number of distinct colors
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1,  gridSize: 3, numColors: 2 },
    { stage: 2,  gridSize: 3, numColors: 3 },
    { stage: 3,  gridSize: 4, numColors: 3 },
    { stage: 4,  gridSize: 4, numColors: 4 },
    { stage: 5,  gridSize: 4, numColors: 5 },
    { stage: 6,  gridSize: 5, numColors: 4 },
    { stage: 7,  gridSize: 5, numColors: 5 },
    { stage: 8,  gridSize: 5, numColors: 6 },
    { stage: 9,  gridSize: 5, numColors: 7 },
    { stage: 10, gridSize: 5, numColors: 8 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 10: 5x5 grid, always max 8 colors (hardest difficulty)
  return { stage, gridSize: 5, numColors: 8 };
}

// ─── Game Types ──────────────────────────────────────────
/** -1 = empty cell, 0+ = color index */
export type CellValue = number;

export type Board = CellValue[][];

export interface BoardState {
  board: Board;
  emptyRow: number;
  emptyCol: number;
  numColors: number;
  gridSize: number;
}

export interface GameConfig {
  stage?: number;
}

export interface SlideMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}
