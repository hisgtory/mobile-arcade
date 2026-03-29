// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

export const GRID_SIZE = 4;

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
  puzzleCount: number;
  gridSize: number;
  timeLimit: number; // seconds
  puzzleTypes: PuzzleType[];
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, puzzleCount: 5, gridSize: 3, timeLimit: 60, puzzleTypes: ['odd_one_out'] },
    { stage: 2, puzzleCount: 5, gridSize: 3, timeLimit: 55, puzzleTypes: ['odd_one_out', 'count'] },
    { stage: 3, puzzleCount: 6, gridSize: 4, timeLimit: 60, puzzleTypes: ['odd_one_out', 'count', 'pattern'] },
    { stage: 4, puzzleCount: 6, gridSize: 4, timeLimit: 55, puzzleTypes: ['odd_one_out', 'count', 'pattern', 'sequence'] },
    { stage: 5, puzzleCount: 8, gridSize: 4, timeLimit: 60, puzzleTypes: ['odd_one_out', 'count', 'pattern', 'sequence', 'mirror'] },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  const puzzleCount = Math.min(8 + Math.floor((stage - 5) / 2), 15);
  const timeLimit = Math.max(40, 60 - (stage - 5) * 2);
  return {
    stage,
    puzzleCount,
    gridSize: 4,
    timeLimit,
    puzzleTypes: ['odd_one_out', 'count', 'pattern', 'sequence', 'mirror'],
  };
}

// ─── Game Types ──────────────────────────────────────────
export interface GameConfig {
  stage?: number;
}
