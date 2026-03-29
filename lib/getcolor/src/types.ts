// ─── Constants ───────────────────────────────────────────
export const TUBE_CAPACITY = 4;
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Colors (pastel palette for Get Color theme) ─────────
export const WATER_COLORS: readonly string[] = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#FED766', // Sunny Yellow
  '#A06CD5', // Lavender Purple
  '#FF9A76', // Peach Orange
  '#6BCB77', // Fresh Green
  '#FF6392', // Hot Pink
  '#4D96FF', // Royal Blue
  '#9AE6B4', // Mint
  '#C084FC', // Orchid
  '#FB923C', // Tangerine
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
    { stage: 6, numColors: 8, emptyTubes: 2 },
    { stage: 7, numColors: 8, emptyTubes: 3 },
    { stage: 8, numColors: 9, emptyTubes: 3 },
    { stage: 9, numColors: 10, emptyTubes: 3 },
    { stage: 10, numColors: 10, emptyTubes: 2 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 10: scale up colors, cap at 12
  const numColors = Math.min(10 + Math.floor((stage - 10) / 2), 12);
  const emptyTubes = stage % 3 === 0 ? 3 : 2;
  return { stage, numColors, emptyTubes };
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
