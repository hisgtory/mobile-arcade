// ─── Constants ───────────────────────────────────────────
export const GRID_COLS = 6;
export const GRID_ROWS = 6;
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Direction ───────────────────────────────────────────
export type Direction = 'H' | 'V'; // Horizontal | Vertical

// ─── Car definition ──────────────────────────────────────
export interface CarDef {
  id: number;
  row: number;    // top-left grid row (0-based)
  col: number;    // top-left grid col (0-based)
  length: number; // 2 or 3
  dir: Direction;  // 'H' = horizontal, 'V' = vertical
  isPlayer: boolean;
}

// ─── Exit position ───────────────────────────────────────
export interface ExitDef {
  row: number;
  col: number;
  side: 'right' | 'bottom'; // which wall the exit is on
}

// ─── Board State ─────────────────────────────────────────
export interface BoardState {
  cars: CarDef[];
  exit: ExitDef;
  cols: number;
  rows: number;
}

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  cars: CarDef[];
  exit: ExitDef;
}

// ─── Game Config ─────────────────────────────────────────
export interface GameConfig {
  stage?: number;
}

// ─── Car Colors ──────────────────────────────────────────
export const CAR_COLORS: readonly string[] = [
  '#EF4444', // Red (player car)
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#92400E', // Brown
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#F43F5E', // Rose
  '#14B8A6', // Teal
  '#8B5CF6', // Violet
  '#D946EF', // Fuchsia
] as const;

// ─── Stage Definitions ───────────────────────────────────
export function getStageConfig(stage: number): StageConfig {
  const stages: StageConfig[] = [
    // Stage 1: Simple — 2 blockers
    {
      stage: 1,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 0, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 2, length: 3, dir: 'V', isPlayer: false },
        { id: 2, row: 0, col: 4, length: 2, dir: 'V', isPlayer: false },
      ],
    },
    // Stage 2: Medium — 4 blockers
    {
      stage: 2,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 1, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 0, length: 2, dir: 'V', isPlayer: false },
        { id: 2, row: 0, col: 3, length: 3, dir: 'V', isPlayer: false },
        { id: 3, row: 4, col: 0, length: 3, dir: 'H', isPlayer: false },
        { id: 4, row: 1, col: 5, length: 2, dir: 'V', isPlayer: false },
      ],
    },
    // Stage 3: Medium — 5 blockers with trucks
    {
      stage: 3,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 0, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 2, length: 2, dir: 'V', isPlayer: false },
        { id: 2, row: 0, col: 4, length: 2, dir: 'H', isPlayer: false },
        { id: 3, row: 3, col: 2, length: 3, dir: 'V', isPlayer: false },
        { id: 4, row: 4, col: 4, length: 2, dir: 'V', isPlayer: false },
        { id: 5, row: 5, col: 0, length: 2, dir: 'H', isPlayer: false },
      ],
    },
    // Stage 4: Harder — 6 blockers
    {
      stage: 4,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 0, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 0, length: 2, dir: 'V', isPlayer: false },
        { id: 2, row: 0, col: 2, length: 3, dir: 'H', isPlayer: false },
        { id: 3, row: 1, col: 4, length: 3, dir: 'V', isPlayer: false },
        { id: 4, row: 3, col: 1, length: 2, dir: 'V', isPlayer: false },
        { id: 5, row: 3, col: 3, length: 2, dir: 'H', isPlayer: false },
        { id: 6, row: 5, col: 0, length: 3, dir: 'H', isPlayer: false },
      ],
    },
    // Stage 5: Hard — 8 blockers
    {
      stage: 5,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 1, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 0, length: 2, dir: 'H', isPlayer: false },
        { id: 2, row: 0, col: 3, length: 3, dir: 'V', isPlayer: false },
        { id: 3, row: 1, col: 0, length: 2, dir: 'V', isPlayer: false },
        { id: 4, row: 1, col: 1, length: 2, dir: 'V', isPlayer: false },
        { id: 5, row: 3, col: 0, length: 3, dir: 'H', isPlayer: false },
        { id: 6, row: 3, col: 4, length: 3, dir: 'V', isPlayer: false },
        { id: 7, row: 4, col: 1, length: 2, dir: 'H', isPlayer: false },
        { id: 8, row: 5, col: 3, length: 2, dir: 'H', isPlayer: false },
      ],
    },
    // Stage 6: Very Hard — 9 blockers
    {
      stage: 6,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 0, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 0, length: 3, dir: 'H', isPlayer: false },
        { id: 2, row: 0, col: 4, length: 3, dir: 'V', isPlayer: false },
        { id: 3, row: 1, col: 1, length: 2, dir: 'V', isPlayer: false },
        { id: 4, row: 1, col: 3, length: 2, dir: 'V', isPlayer: false },
        { id: 5, row: 3, col: 0, length: 2, dir: 'V', isPlayer: false },
        { id: 6, row: 3, col: 2, length: 2, dir: 'H', isPlayer: false },
        { id: 7, row: 4, col: 3, length: 3, dir: 'H', isPlayer: false },
        { id: 8, row: 5, col: 0, length: 2, dir: 'H', isPlayer: false },
        { id: 9, row: 5, col: 4, length: 2, dir: 'H', isPlayer: false },
      ],
    },
    // Stage 7
    {
      stage: 7,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 2, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 0, length: 2, dir: 'V', isPlayer: false },
        { id: 2, row: 0, col: 1, length: 2, dir: 'H', isPlayer: false },
        { id: 3, row: 0, col: 4, length: 2, dir: 'V', isPlayer: false },
        { id: 4, row: 1, col: 2, length: 2, dir: 'V', isPlayer: false },
        { id: 5, row: 2, col: 5, length: 3, dir: 'V', isPlayer: false },
        { id: 6, row: 3, col: 0, length: 2, dir: 'H', isPlayer: false },
        { id: 7, row: 3, col: 3, length: 2, dir: 'V', isPlayer: false },
        { id: 8, row: 4, col: 1, length: 2, dir: 'V', isPlayer: false },
        { id: 9, row: 5, col: 2, length: 3, dir: 'H', isPlayer: false },
      ],
    },
    // Stage 8
    {
      stage: 8,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 0, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 0, length: 2, dir: 'H', isPlayer: false },
        { id: 2, row: 0, col: 3, length: 2, dir: 'V', isPlayer: false },
        { id: 3, row: 0, col: 5, length: 3, dir: 'V', isPlayer: false },
        { id: 4, row: 1, col: 0, length: 2, dir: 'V', isPlayer: false },
        { id: 5, row: 1, col: 1, length: 2, dir: 'H', isPlayer: false },
        { id: 6, row: 2, col: 4, length: 2, dir: 'V', isPlayer: false },
        { id: 7, row: 3, col: 1, length: 3, dir: 'H', isPlayer: false },
        { id: 8, row: 4, col: 0, length: 2, dir: 'V', isPlayer: false },
        { id: 9, row: 4, col: 2, length: 2, dir: 'V', isPlayer: false },
        { id: 10, row: 5, col: 3, length: 3, dir: 'H', isPlayer: false },
      ],
    },
    // Stage 9
    {
      stage: 9,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 1, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 0, length: 3, dir: 'V', isPlayer: false },
        { id: 2, row: 0, col: 1, length: 2, dir: 'H', isPlayer: false },
        { id: 3, row: 0, col: 3, length: 2, dir: 'V', isPlayer: false },
        { id: 4, row: 1, col: 4, length: 2, dir: 'H', isPlayer: false },
        { id: 5, row: 2, col: 4, length: 3, dir: 'V', isPlayer: false },
        { id: 6, row: 3, col: 0, length: 2, dir: 'H', isPlayer: false },
        { id: 7, row: 3, col: 2, length: 2, dir: 'V', isPlayer: false },
        { id: 8, row: 4, col: 3, length: 2, dir: 'V', isPlayer: false },
        { id: 9, row: 5, col: 0, length: 3, dir: 'H', isPlayer: false },
        { id: 10, row: 5, col: 4, length: 2, dir: 'H', isPlayer: false },
      ],
    },
    // Stage 10
    {
      stage: 10,
      exit: { row: 2, col: 5, side: 'right' },
      cars: [
        { id: 0, row: 2, col: 0, length: 2, dir: 'H', isPlayer: true },
        { id: 1, row: 0, col: 0, length: 2, dir: 'V', isPlayer: false },
        { id: 2, row: 0, col: 1, length: 3, dir: 'H', isPlayer: false },
        { id: 3, row: 0, col: 5, length: 2, dir: 'V', isPlayer: false },
        { id: 4, row: 1, col: 1, length: 2, dir: 'V', isPlayer: false },
        { id: 5, row: 1, col: 4, length: 2, dir: 'V', isPlayer: false },
        { id: 6, row: 2, col: 3, length: 3, dir: 'V', isPlayer: false },
        { id: 7, row: 3, col: 0, length: 2, dir: 'V', isPlayer: false },
        { id: 8, row: 3, col: 4, length: 2, dir: 'H', isPlayer: false },
        { id: 9, row: 4, col: 1, length: 2, dir: 'H', isPlayer: false },
        { id: 10, row: 5, col: 0, length: 3, dir: 'H', isPlayer: false },
        { id: 11, row: 5, col: 3, length: 2, dir: 'V', isPlayer: false },
      ],
    },
  ];

  if (stage <= stages.length) return stages[stage - 1];
  // Beyond stage 10: cycle through with shuffled IDs
  const base = stages[(stage - 1) % stages.length];
  return { ...base, stage };
}
