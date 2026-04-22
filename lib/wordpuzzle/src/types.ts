// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Colors ──────────────────────────────────────────────
export const CELL_COLORS = {
  normal: '#FFFFFF',
  selected: '#DBEAFE',
  found: '#BBF7D0',
  hint: '#FEF3C7',
} as const;

export const FOUND_COLORS: readonly string[] = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#F97316', // Orange
] as const;

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  gridSize: number;
  words: string[];
}

export interface WordPlacement {
  word: string;
  cells: { row: number; col: number }[];
  found: boolean;
}

export interface BoardState {
  grid: string[][];
  gridSize: number;
  placements: WordPlacement[];
  numWords: number;
}

export interface GameConfig {
  stage?: number;
}
