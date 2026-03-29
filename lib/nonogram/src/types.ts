// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Cell State ──────────────────────────────────────────
export enum CellState {
  EMPTY = 0,
  FILLED = 1,
  MARKED = 2, // X mark (user believes cell is empty)
}

// ─── Puzzle Definition ───────────────────────────────────
export interface PuzzleDef {
  rows: number;
  cols: number;
  /** Solution grid: 1 = filled, 0 = empty. Row-major [row][col]. */
  solution: number[][];
  /** Display name for the puzzle */
  name: string;
}

// ─── Clues (computed from solution) ──────────────────────
export interface Clues {
  rowClues: number[][];
  colClues: number[][];
}

// ─── Board State ─────────────────────────────────────────
export interface BoardState {
  grid: CellState[][];
  puzzle: PuzzleDef;
  clues: Clues;
}

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  puzzle: PuzzleDef;
}

// ─── Game Config ─────────────────────────────────────────
export interface GameConfig {
  stage?: number;
  onClear?: () => void;
  onGameOver?: () => void;
}
