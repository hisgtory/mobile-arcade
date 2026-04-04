// ─── Constants ───────────────────────────────────────────
export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Difficulty ──────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface DifficultyConfig {
  difficulty: Difficulty;
  /** Number of cells to remove from the completed grid */
  removals: number;
  label: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy:   { difficulty: 'easy',   removals: 35, label: 'Easy' },
  medium: { difficulty: 'medium', removals: 45, label: 'Medium' },
  hard:   { difficulty: 'hard',   removals: 52, label: 'Hard' },
  expert: { difficulty: 'expert', removals: 58, label: 'Expert' },
};

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  difficulty: Difficulty;
}

const STAGE_DIFFICULTIES: Difficulty[] = [
  'easy', 'easy', 'medium', 'medium', 'hard',
];

export function getStageConfig(stage: number): StageConfig {
  if (stage <= STAGE_DIFFICULTIES.length) {
    return { stage, difficulty: STAGE_DIFFICULTIES[stage - 1] };
  }
  // Beyond stage 5: alternate hard/expert
  return { stage, difficulty: (stage % 2 === 0) ? 'expert' : 'hard' };
}

// ─── Cell / Board Types ──────────────────────────────────

/** 0 means empty */
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Cell {
  value: CellValue;
  given: boolean;       // initial clue — cannot be changed
  notes: Set<number>;   // pencil marks (1-9)
  error: boolean;       // currently conflicting
}

/** 9×9 grid of cells */
export type Grid = Cell[][];

export interface BoardState {
  grid: Grid;
  solution: number[][];  // the full solved grid
  difficulty: Difficulty;
  mistakes: number;
  maxMistakes: number;
}

export interface GameConfig {
  stage?: number;
  difficulty?: Difficulty;
}

// ─── Colors ──────────────────────────────────────────────
export const COLORS = {
  gridLine: '#374151',
  gridLineMinor: '#D1D5DB',
  cellBg: '#FFFFFF',
  cellGiven: '#F3F4F6',
  cellSelected: '#DBEAFE',
  cellSameNumber: '#E0E7FF',
  cellSameRowCol: '#EFF6FF',
  cellError: '#FEE2E2',
  textGiven: '#111827',
  textPlayer: '#2563EB',
  textError: '#DC2626',
  textNote: '#6B7280',
  highlight: '#2563EB',
} as const;
