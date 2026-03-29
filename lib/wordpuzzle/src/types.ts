// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 680;

// ─── Cell Colors ─────────────────────────────────────────
export const CELL_BG = '#FFFFFF';
export const CELL_EMPTY = '#E5E7EB';
export const CELL_SELECTED = '#DBEAFE';
export const CELL_FOUND = '#D1FAE5';
export const CELL_TEXT = '#1F2937';
export const CELL_FOUND_TEXT = '#059669';

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  puzzleId: number;
}

export function getStageConfig(stage: number): StageConfig {
  // Stages 1-30 map to puzzleId 1-30; beyond 30 cycle back
  const puzzleId = ((stage - 1) % 30) + 1;
  return { stage, puzzleId };
}

// ─── Game Types ──────────────────────────────────────────
export interface WordEntry {
  word: string;
  direction: 'h' | 'v';
  row: number;
  col: number;
}

export interface PuzzleData {
  id: number;
  gridRows: number;
  gridCols: number;
  words: WordEntry[];
  letters: string[];
}

export interface BoardState {
  puzzle: PuzzleData;
  grid: (string | null)[][];
  foundWords: string[];
}

export interface GameConfig {
  stage?: number;
}

export interface CellPos {
  row: number;
  col: number;
}
