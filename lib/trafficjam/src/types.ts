// ─── Constants ───────────────────────────────────────────
export const GRID_COLS = 6;
export const GRID_ROWS = 7;
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Colors ──────────────────────────────────────────────
export const VEHICLE_COLORS: readonly string[] = [
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
  '#6366F1', // Indigo
  '#F43F5E', // Rose
] as const;

export const VEHICLE_EMOJIS: readonly string[] = [
  '🚗', '🚙', '🚕', '🚌', '🚎', '🏎️', '🚐', '🚑', '🚒', '🛻',
  '🚜', '🚛',
] as const;

// ─── Types ───────────────────────────────────────────────
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Vehicle {
  id: string;
  row: number;
  col: number;
  length: number; // 2 or 3
  direction: Direction; // the direction it drives to exit
  color: string;
}

export interface StageConfig {
  stage: number;
  vehicles: Vehicle[];
}

export interface BoardState {
  gridCols: number;
  gridRows: number;
  vehicles: Vehicle[];
}

export interface GameConfig {
  stage?: number;
}

// ─── Stage Definitions ───────────────────────────────────

const STAGES: StageConfig[] = [
  // Stage 1: 3 vehicles, simple — all can exit immediately or with one removal
  {
    stage: 1,
    vehicles: [
      { id: 'v1', row: 2, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 0, col: 3, length: 2, direction: 'down', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 5, col: 4, length: 2, direction: 'left', color: VEHICLE_COLORS[2] },
    ],
  },
  // Stage 2: 4 vehicles, one blocking
  {
    stage: 2,
    vehicles: [
      { id: 'v1', row: 1, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 1, col: 4, length: 2, direction: 'up', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 3, col: 2, length: 3, direction: 'right', color: VEHICLE_COLORS[2] },
      { id: 'v4', row: 5, col: 1, length: 2, direction: 'down', color: VEHICLE_COLORS[3] },
    ],
  },
  // Stage 3: 5 vehicles, need to clear in right order
  {
    stage: 3,
    vehicles: [
      { id: 'v1', row: 0, col: 1, length: 2, direction: 'right', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 0, col: 4, length: 3, direction: 'down', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 2, col: 0, length: 2, direction: 'down', color: VEHICLE_COLORS[2] },
      { id: 'v4', row: 4, col: 2, length: 2, direction: 'left', color: VEHICLE_COLORS[3] },
      { id: 'v5', row: 6, col: 3, length: 3, direction: 'left', color: VEHICLE_COLORS[4] },
    ],
  },
  // Stage 4: 5 vehicles, more blocking
  {
    stage: 4,
    vehicles: [
      { id: 'v1', row: 0, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 0, col: 3, length: 2, direction: 'down', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 2, col: 3, length: 3, direction: 'down', color: VEHICLE_COLORS[2] },
      { id: 'v4', row: 3, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[3] },
      { id: 'v5', row: 5, col: 1, length: 3, direction: 'right', color: VEHICLE_COLORS[4] },
    ],
  },
  // Stage 5: 6 vehicles
  {
    stage: 5,
    vehicles: [
      { id: 'v1', row: 0, col: 2, length: 2, direction: 'right', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 1, col: 0, length: 3, direction: 'down', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 2, col: 2, length: 2, direction: 'left', color: VEHICLE_COLORS[2] },
      { id: 'v4', row: 2, col: 5, length: 2, direction: 'up', color: VEHICLE_COLORS[3] },
      { id: 'v5', row: 4, col: 3, length: 2, direction: 'down', color: VEHICLE_COLORS[4] },
      { id: 'v6', row: 6, col: 1, length: 2, direction: 'left', color: VEHICLE_COLORS[5] },
    ],
  },
  // Stage 6: 7 vehicles
  {
    stage: 6,
    vehicles: [
      { id: 'v1', row: 0, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 0, col: 3, length: 3, direction: 'down', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 1, col: 5, length: 2, direction: 'up', color: VEHICLE_COLORS[2] },
      { id: 'v4', row: 3, col: 1, length: 2, direction: 'right', color: VEHICLE_COLORS[3] },
      { id: 'v5', row: 3, col: 4, length: 2, direction: 'down', color: VEHICLE_COLORS[4] },
      { id: 'v6', row: 5, col: 0, length: 3, direction: 'right', color: VEHICLE_COLORS[5] },
      { id: 'v7', row: 6, col: 4, length: 2, direction: 'left', color: VEHICLE_COLORS[6] },
    ],
  },
  // Stage 7: 7 vehicles with trickier layout
  {
    stage: 7,
    vehicles: [
      { id: 'v1', row: 0, col: 0, length: 3, direction: 'down', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 0, col: 2, length: 2, direction: 'right', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 1, col: 4, length: 3, direction: 'down', color: VEHICLE_COLORS[2] },
      { id: 'v4', row: 3, col: 1, length: 2, direction: 'left', color: VEHICLE_COLORS[3] },
      { id: 'v5', row: 4, col: 3, length: 2, direction: 'right', color: VEHICLE_COLORS[4] },
      { id: 'v6', row: 5, col: 0, length: 2, direction: 'down', color: VEHICLE_COLORS[5] },
      { id: 'v7', row: 6, col: 2, length: 3, direction: 'right', color: VEHICLE_COLORS[6] },
    ],
  },
  // Stage 8: 8 vehicles
  {
    stage: 8,
    vehicles: [
      { id: 'v1', row: 0, col: 1, length: 2, direction: 'right', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 0, col: 4, length: 2, direction: 'down', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 1, col: 0, length: 2, direction: 'down', color: VEHICLE_COLORS[2] },
      { id: 'v4', row: 2, col: 2, length: 3, direction: 'right', color: VEHICLE_COLORS[3] },
      { id: 'v5', row: 3, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[4] },
      { id: 'v6', row: 4, col: 3, length: 2, direction: 'down', color: VEHICLE_COLORS[5] },
      { id: 'v7', row: 5, col: 1, length: 2, direction: 'left', color: VEHICLE_COLORS[6] },
      { id: 'v8', row: 6, col: 3, length: 3, direction: 'left', color: VEHICLE_COLORS[7] },
    ],
  },
  // Stage 9: 8 vehicles with complex blocking
  // Solution order: v8→v6→v3→v7→v5→v2→v4→v1
  {
    stage: 9,
    vehicles: [
      { id: 'v1', row: 0, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 0, col: 4, length: 2, direction: 'down', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 2, col: 0, length: 3, direction: 'down', color: VEHICLE_COLORS[2] },
      { id: 'v4', row: 1, col: 2, length: 2, direction: 'right', color: VEHICLE_COLORS[3] },
      { id: 'v5', row: 3, col: 2, length: 2, direction: 'left', color: VEHICLE_COLORS[4] },
      { id: 'v6', row: 4, col: 4, length: 2, direction: 'down', color: VEHICLE_COLORS[5] },
      { id: 'v7', row: 5, col: 1, length: 3, direction: 'right', color: VEHICLE_COLORS[6] },
      { id: 'v8', row: 6, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[7] },
    ],
  },
  // Stage 10: 9 vehicles, most complex
  {
    stage: 10,
    vehicles: [
      { id: 'v1', row: 0, col: 0, length: 2, direction: 'down', color: VEHICLE_COLORS[0] },
      { id: 'v2', row: 0, col: 2, length: 2, direction: 'right', color: VEHICLE_COLORS[1] },
      { id: 'v3', row: 0, col: 5, length: 3, direction: 'down', color: VEHICLE_COLORS[2] },
      { id: 'v4', row: 1, col: 3, length: 2, direction: 'down', color: VEHICLE_COLORS[3] },
      { id: 'v5', row: 2, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[4] },
      { id: 'v6', row: 3, col: 2, length: 3, direction: 'down', color: VEHICLE_COLORS[5] },
      { id: 'v7', row: 4, col: 0, length: 2, direction: 'right', color: VEHICLE_COLORS[6] },
      { id: 'v8', row: 5, col: 4, length: 2, direction: 'up', color: VEHICLE_COLORS[7] },
      { id: 'v9', row: 6, col: 1, length: 3, direction: 'right', color: VEHICLE_COLORS[8] },
    ],
  },
];

export function getStageConfig(stage: number): StageConfig {
  if (stage >= 1 && stage <= STAGES.length) {
    return STAGES[stage - 1];
  }
  // Beyond defined stages: return last stage
  return STAGES[STAGES.length - 1];
}
