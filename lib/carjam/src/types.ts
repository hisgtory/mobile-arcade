// ─── Constants ───────────────────────────────────────────
export const GRID_COLS = 5;
export const GRID_ROWS = 6;
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;
export const CELL_SIZE = 56;

// ─── Direction ───────────────────────────────────────────
export type Direction = 'up' | 'down' | 'left' | 'right';

// ─── Car Colors ──────────────────────────────────────────
export const CAR_COLORS: readonly string[] = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#92400E', // Brown
  '#84CC16', // Lime
] as const;

// ─── Types ───────────────────────────────────────────────
export interface Car {
  id: number;
  row: number;
  col: number;
  length: number;           // 1, 2, or 3 cells
  direction: Direction;     // which way the car faces / drives out
  colorIndex: number;
  exited: boolean;
}

export interface BoardState {
  cars: Car[];
  cols: number;
  rows: number;
}

export interface GameConfig {
  stage?: number;
}

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  cars: Omit<Car, 'exited'>[];
  cols: number;
  rows: number;
}

export function getStageConfig(stage: number): StageConfig {
  if (stage >= 1 && stage <= STAGES.length) {
    return STAGES[stage - 1];
  }
  // Beyond defined stages, cycle
  return STAGES[(stage - 1) % STAGES.length];
}

const STAGES: StageConfig[] = [
    // Stage 1: Simple intro — 3 cars, straight exits
    {
      stage: 1,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 2, col: 2, length: 2, direction: 'right', colorIndex: 0 },
        { id: 2, row: 0, col: 1, length: 2, direction: 'down', colorIndex: 1 },
        { id: 3, row: 4, col: 3, length: 1, direction: 'up', colorIndex: 2 },
      ],
    },
    // Stage 2: 4 cars
    {
      stage: 2,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 1, col: 0, length: 2, direction: 'right', colorIndex: 0 },
        { id: 2, row: 3, col: 2, length: 2, direction: 'left', colorIndex: 1 },
        { id: 3, row: 0, col: 4, length: 2, direction: 'down', colorIndex: 2 },
        { id: 4, row: 5, col: 1, length: 1, direction: 'up', colorIndex: 3 },
      ],
    },
    // Stage 3: 5 cars, more blocking
    {
      stage: 3,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 0, col: 0, length: 2, direction: 'right', colorIndex: 0 },
        { id: 2, row: 0, col: 3, length: 1, direction: 'down', colorIndex: 1 },
        { id: 3, row: 2, col: 1, length: 2, direction: 'right', colorIndex: 2 },
        { id: 4, row: 4, col: 0, length: 1, direction: 'right', colorIndex: 3 },
        { id: 5, row: 3, col: 4, length: 2, direction: 'up', colorIndex: 4 },
      ],
    },
    // Stage 4: 6 cars
    {
      stage: 4,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 1, col: 1, length: 2, direction: 'right', colorIndex: 0 },
        { id: 2, row: 3, col: 0, length: 1, direction: 'right', colorIndex: 1 },
        { id: 3, row: 0, col: 2, length: 2, direction: 'down', colorIndex: 2 },
        { id: 4, row: 5, col: 3, length: 1, direction: 'up', colorIndex: 3 },
        { id: 5, row: 2, col: 4, length: 2, direction: 'left', colorIndex: 4 },
        { id: 6, row: 4, col: 1, length: 2, direction: 'down', colorIndex: 5 },
      ],
    },
    // Stage 5: 7 cars
    {
      stage: 5,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 0, col: 0, length: 2, direction: 'down', colorIndex: 0 },
        { id: 2, row: 0, col: 3, length: 2, direction: 'down', colorIndex: 1 },
        { id: 3, row: 2, col: 1, length: 2, direction: 'right', colorIndex: 2 },
        { id: 4, row: 3, col: 0, length: 1, direction: 'right', colorIndex: 3 },
        { id: 5, row: 4, col: 2, length: 2, direction: 'left', colorIndex: 4 },
        { id: 6, row: 5, col: 4, length: 1, direction: 'up', colorIndex: 5 },
        { id: 7, row: 1, col: 2, length: 1, direction: 'up', colorIndex: 6 },
      ],
    },
    // Stage 6: 8 cars, tighter
    {
      stage: 6,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 0, col: 1, length: 2, direction: 'right', colorIndex: 0 },
        { id: 2, row: 1, col: 0, length: 1, direction: 'down', colorIndex: 1 },
        { id: 3, row: 2, col: 2, length: 2, direction: 'left', colorIndex: 2 },
        { id: 4, row: 3, col: 4, length: 2, direction: 'up', colorIndex: 3 },
        { id: 5, row: 4, col: 0, length: 2, direction: 'right', colorIndex: 4 },
        { id: 6, row: 5, col: 2, length: 1, direction: 'up', colorIndex: 5 },
        { id: 7, row: 1, col: 3, length: 2, direction: 'down', colorIndex: 6 },
        { id: 8, row: 0, col: 4, length: 1, direction: 'down', colorIndex: 7 },
      ],
    },
    // Stage 7: 7 cars with 3-length car
    {
      stage: 7,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 1, col: 0, length: 3, direction: 'right', colorIndex: 0 },
        { id: 2, row: 0, col: 4, length: 2, direction: 'down', colorIndex: 1 },
        { id: 3, row: 3, col: 1, length: 2, direction: 'right', colorIndex: 2 },
        { id: 4, row: 4, col: 0, length: 1, direction: 'down', colorIndex: 3 },
        { id: 5, row: 2, col: 3, length: 2, direction: 'up', colorIndex: 4 },
        { id: 6, row: 5, col: 2, length: 2, direction: 'left', colorIndex: 5 },
        { id: 7, row: 0, col: 1, length: 1, direction: 'right', colorIndex: 6 },
      ],
    },
    // Stage 8: 9 cars
    {
      stage: 8,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 0, col: 0, length: 2, direction: 'right', colorIndex: 0 },
        { id: 2, row: 0, col: 3, length: 1, direction: 'down', colorIndex: 1 },
        { id: 3, row: 1, col: 1, length: 2, direction: 'down', colorIndex: 2 },
        { id: 4, row: 2, col: 3, length: 2, direction: 'left', colorIndex: 3 },
        { id: 5, row: 3, col: 0, length: 1, direction: 'right', colorIndex: 4 },
        { id: 6, row: 4, col: 2, length: 2, direction: 'up', colorIndex: 5 },
        { id: 7, row: 5, col: 0, length: 1, direction: 'right', colorIndex: 6 },
        { id: 8, row: 5, col: 4, length: 1, direction: 'up', colorIndex: 7 },
        { id: 9, row: 3, col: 4, length: 2, direction: 'left', colorIndex: 8 },
      ],
    },
    // Stage 9: 8 cars, complex paths
    {
      stage: 9,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 0, col: 2, length: 2, direction: 'right', colorIndex: 0 },
        { id: 2, row: 1, col: 0, length: 2, direction: 'down', colorIndex: 1 },
        { id: 3, row: 2, col: 2, length: 1, direction: 'left', colorIndex: 2 },
        { id: 4, row: 3, col: 3, length: 2, direction: 'up', colorIndex: 3 },
        { id: 5, row: 4, col: 1, length: 2, direction: 'right', colorIndex: 4 },
        { id: 6, row: 5, col: 0, length: 1, direction: 'up', colorIndex: 5 },
        { id: 7, row: 1, col: 4, length: 2, direction: 'down', colorIndex: 6 },
        { id: 8, row: 0, col: 0, length: 1, direction: 'down', colorIndex: 7 },
      ],
    },
    // Stage 10: 10 cars, final challenge
    {
      stage: 10,
      cols: 5, rows: 6,
      cars: [
        { id: 1, row: 0, col: 1, length: 2, direction: 'right', colorIndex: 0 },
        { id: 2, row: 0, col: 4, length: 2, direction: 'down', colorIndex: 1 },
        { id: 3, row: 1, col: 0, length: 1, direction: 'down', colorIndex: 2 },
        { id: 4, row: 2, col: 2, length: 2, direction: 'left', colorIndex: 3 },
        { id: 5, row: 3, col: 0, length: 2, direction: 'right', colorIndex: 4 },
        { id: 6, row: 3, col: 3, length: 1, direction: 'up', colorIndex: 5 },
        { id: 7, row: 4, col: 1, length: 2, direction: 'down', colorIndex: 6 },
        { id: 8, row: 5, col: 3, length: 2, direction: 'left', colorIndex: 7 },
        { id: 9, row: 5, col: 0, length: 1, direction: 'up', colorIndex: 8 },
                { id: 10, row: 2, col: 4, length: 1, direction: 'up', colorIndex: 9 },
      ],
    },
  ];
