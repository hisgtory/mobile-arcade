// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Flow Colors ─────────────────────────────────────────
export const FLOW_COLORS: readonly string[] = [
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
  '#14B8A6', // Teal
  '#F59E0B', // Amber
] as const;

// ─── Types ───────────────────────────────────────────────

export interface Coord {
  row: number;
  col: number;
}

/** A flow connects two endpoints via a path */
export interface Flow {
  colorIndex: number;
  endpoints: [Coord, Coord];
}

/** Each cell can be empty, an endpoint, or part of a path */
export interface Cell {
  /** -1 = empty, otherwise the flow color index */
  colorIndex: number;
  /** Whether this cell is an endpoint dot */
  isEndpoint: boolean;
}

export interface BoardState {
  rows: number;
  cols: number;
  flows: Flow[];
  grid: Cell[][];
  /** Player-drawn paths: map from colorIndex -> array of coords */
  paths: Map<number, Coord[]>;
}

export interface StageConfig {
  stage: number;
  rows: number;
  cols: number;
  numFlows: number;
}

export interface GameConfig {
  stage?: number;
}

// ─── Stage Configs ───────────────────────────────────────

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, rows: 5, cols: 5, numFlows: 4 },
    { stage: 2, rows: 5, cols: 5, numFlows: 5 },
    { stage: 3, rows: 6, cols: 6, numFlows: 5 },
    { stage: 4, rows: 6, cols: 6, numFlows: 6 },
    { stage: 5, rows: 7, cols: 7, numFlows: 6 },
    { stage: 6, rows: 7, cols: 7, numFlows: 7 },
    { stage: 7, rows: 8, cols: 8, numFlows: 7 },
    { stage: 8, rows: 8, cols: 8, numFlows: 8 },
    { stage: 9, rows: 9, cols: 9, numFlows: 8 },
    { stage: 10, rows: 9, cols: 9, numFlows: 9 },
  ];

  if (stage <= configs.length) return configs[stage - 1];

  // Beyond stage 10: scale up, cap at 14×14
  const size = Math.min(9 + Math.floor((stage - 10) / 2), 14);
  const numFlows = Math.min(Math.floor(size * size * 0.14) + 3, FLOW_COLORS.length);
  return { stage, rows: size, cols: size, numFlows };
}
