// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;
export const MAX_ITEM_LEVEL = 5;

// ─── Item Colors (per level) ────────────────────────────
export const ITEM_COLORS: readonly string[] = [
  '#8B5CF6', // Lv1 – purple (magnifier shard)
  '#3B82F6', // Lv2 – blue (clip)
  '#10B981', // Lv3 – green (memo)
  '#F59E0B', // Lv4 – yellow (file)
  '#EF4444', // Lv5 – red (key / clue)
] as const;

export const ITEM_LABELS: readonly string[] = [
  '🔍',  // Lv1
  '📎',  // Lv2
  '📝',  // Lv3
  '📋',  // Lv4
  '🗝️', // Lv5
] as const;

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  cols: number;
  rows: number;
  targetClues: number;  // Lv5 items needed to clear
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, cols: 5, rows: 5, targetClues: 1 },
    { stage: 2, cols: 5, rows: 5, targetClues: 2 },
    { stage: 3, cols: 6, rows: 6, targetClues: 3 },
    { stage: 4, cols: 6, rows: 6, targetClues: 4 },
    { stage: 5, cols: 6, rows: 6, targetClues: 5 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 5: scale clues, keep 6×6
  return { stage, cols: 6, rows: 6, targetClues: 5 + (stage - 5) };
}

// ─── Board Types ─────────────────────────────────────────
/** null = empty cell, number = item level (1-5) */
export type Cell = number | null;

export interface BoardState {
  cells: Cell[];
  cols: number;
  rows: number;
  cluesCollected: number;
  targetClues: number;
}

export interface GameConfig {
  stage?: number;
}

export interface MergeMove {
  fromIdx: number;
  toIdx: number;
  newLevel: number;
}
