/**
 * TrickyTwist game type definitions
 */

export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Tile types ─────────────────────────────────────────

/** Emoji tiles used for puzzles */
export const TILE_EMOJIS: readonly string[] = [
  '🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '🟤',
  '⭐', '💎', '🔥', '❄️', '⚡', '🌙', '☀️', '🍀',
] as const;

export const TILE_COLORS: readonly string[] = [
  '#EF4444', '#3B82F6', '#22C55E', '#EAB308',
  '#A855F7', '#F97316', '#E5E7EB', '#92400E',
  '#FBBF24', '#06B6D4', '#F97316', '#67E8F9',
  '#FDE047', '#6366F1', '#F59E0B', '#4ADE80',
] as const;

// ─── Puzzle types ────────────────────────────────────────

export type PuzzleType = 'odd_one_out' | 'count' | 'pattern' | 'sequence' | 'mirror';

export interface CellPos {
  row: number;
  col: number;
}

/** A single puzzle definition */
export interface Puzzle {
  type: PuzzleType;
  /** Grid of tile indices (into TILE_EMOJIS) or -1 for empty */
  grid: number[][];
  /** The correct answer cell(s) or value */
  answer: number;
  /** Hint/question text */
  question: string;
  /** Number of choices for count/sequence puzzles */
  choices?: number[];
  /** Twist description (what makes it tricky) */
  twist: string;
}

// ─── Stage Config ────────────────────────────────────────

export interface StageConfig {
  stage: number;
  /** Number of puzzles per stage */
  puzzleCount: number;
  /** Grid size for grid-based puzzles */
  gridSize: number;
  /** Time limit in seconds */
  timeLimit: number;
  /** Puzzle types available in this stage */
  puzzleTypes: PuzzleType[];
}

export interface GameConfig {
  stage?: number;
}
