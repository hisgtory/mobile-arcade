// ─── Constants ───────────────────────────────────────────
export const TUBE_CAPACITY = 4;
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Colors ──────────────────────────────────────────────
export const WATER_COLORS: readonly string[] = [
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

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  numColors: number;
  emptyTubes: number;
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, numColors: 3, emptyTubes: 2 },
    { stage: 2, numColors: 4, emptyTubes: 2 },
    { stage: 3, numColors: 5, emptyTubes: 2 },
    { stage: 4, numColors: 6, emptyTubes: 2 },
    { stage: 5, numColors: 7, emptyTubes: 2 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 5: scale up colors, cap at 12
  const numColors = Math.min(7 + (stage - 5), 12);
  return { stage, numColors, emptyTubes: 2 };
}

// ─── Game Types ──────────────────────────────────────────
/** A tube is an array of color indices (0-based). Index 0 = bottom. */
export type Tube = number[];

export interface BoardState {
  tubes: Tube[];
  numColors: number;
}

export interface GameConfig {
  stage?: number;
}

export interface PourMove {
  from: number;
  to: number;
  count: number; // how many segments poured
}
