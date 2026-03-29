// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Directions ──────────────────────────────────────────
export enum Dir {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

export const DIR_DELTA: Record<Dir, { dr: number; dc: number }> = {
  [Dir.UP]: { dr: -1, dc: 0 },
  [Dir.RIGHT]: { dr: 0, dc: 1 },
  [Dir.DOWN]: { dr: 1, dc: 0 },
  [Dir.LEFT]: { dr: 0, dc: -1 },
};

export const DIR_LABELS: Record<Dir, string> = {
  [Dir.UP]: '↑',
  [Dir.RIGHT]: '→',
  [Dir.DOWN]: '↓',
  [Dir.LEFT]: '←',
};

// ─── Cell ────────────────────────────────────────────────
export interface Cell {
  dir: Dir;
  fixed: boolean;
  visited: boolean;
}

// ─── Board State ─────────────────────────────────────────
export interface BoardState {
  rows: number;
  cols: number;
  cells: Cell[][];
  startRow: number;
  startCol: number;
}

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  rows: number;
  cols: number;
  fixedRatio: number; // 0.0 ~ 1.0 — fraction of arrows that are fixed
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, rows: 3, cols: 3, fixedRatio: 0.6 },
    { stage: 2, rows: 3, cols: 3, fixedRatio: 0.5 },
    { stage: 3, rows: 3, cols: 3, fixedRatio: 0.4 },
    { stage: 4, rows: 3, cols: 4, fixedRatio: 0.5 },
    { stage: 5, rows: 3, cols: 4, fixedRatio: 0.4 },
    { stage: 6, rows: 4, cols: 4, fixedRatio: 0.5 },
    { stage: 7, rows: 4, cols: 4, fixedRatio: 0.4 },
    { stage: 8, rows: 4, cols: 4, fixedRatio: 0.3 },
    { stage: 9, rows: 4, cols: 5, fixedRatio: 0.4 },
    { stage: 10, rows: 4, cols: 5, fixedRatio: 0.3 },
  ];

  if (stage <= configs.length) return configs[stage - 1];

  // Beyond stage 10: scale up grid, lower fixed ratio
  const rows = Math.min(4 + Math.floor((stage - 10) / 5), 6);
  const cols = Math.min(5 + Math.floor((stage - 10) / 3), 7);
  const fixedRatio = Math.max(0.2, 0.4 - (stage - 10) * 0.01);
  return { stage, rows, cols, fixedRatio };
}

// ─── Game Config ─────────────────────────────────────────
export interface GameConfig {
  stage?: number;
}

// ─── Arrow Colors ────────────────────────────────────────
export const ARROW_COLORS = {
  normal: 0x3b82f6,      // Blue
  fixed: 0x6366f1,       // Indigo
  visited: 0x22c55e,     // Green
  current: 0xf59e0b,     // Amber
  start: 0xef4444,       // Red
  path: 0x22c55e,        // Green path
  error: 0xef4444,       // Red error
} as const;
