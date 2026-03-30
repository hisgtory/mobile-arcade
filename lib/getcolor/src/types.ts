// Re-export shared tube-puzzle types from watersort
export { TUBE_CAPACITY } from '@arcade/lib-watersort';
export type { Tube, BoardState, PourMove } from '@arcade/lib-watersort';

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

// ─── Time Challenge Config ───────────────────────────────
/** Each stage has a time limit in seconds. Completing faster gives bonus. */
export interface TimerConfig {
  timeLimitSec: number;
  bonusPerSecLeft: number; // score bonus per second remaining
}

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  numColors: number;
  emptyTubes: number;
  timer: TimerConfig;
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1,  numColors: 3,  emptyTubes: 2, timer: { timeLimitSec: 60,  bonusPerSecLeft: 5  } },
    { stage: 2,  numColors: 4,  emptyTubes: 2, timer: { timeLimitSec: 90,  bonusPerSecLeft: 5  } },
    { stage: 3,  numColors: 5,  emptyTubes: 2, timer: { timeLimitSec: 120, bonusPerSecLeft: 8  } },
    { stage: 4,  numColors: 6,  emptyTubes: 2, timer: { timeLimitSec: 150, bonusPerSecLeft: 8  } },
    { stage: 5,  numColors: 7,  emptyTubes: 2, timer: { timeLimitSec: 180, bonusPerSecLeft: 10 } },
    { stage: 6,  numColors: 8,  emptyTubes: 2, timer: { timeLimitSec: 210, bonusPerSecLeft: 10 } },
    { stage: 7,  numColors: 8,  emptyTubes: 3, timer: { timeLimitSec: 180, bonusPerSecLeft: 12 } },
    { stage: 8,  numColors: 9,  emptyTubes: 3, timer: { timeLimitSec: 210, bonusPerSecLeft: 12 } },
    { stage: 9,  numColors: 10, emptyTubes: 3, timer: { timeLimitSec: 240, bonusPerSecLeft: 15 } },
    { stage: 10, numColors: 10, emptyTubes: 2, timer: { timeLimitSec: 240, bonusPerSecLeft: 15 } },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 10: scale up colors, cap at 12
  const numColors = Math.min(10 + Math.floor((stage - 10) / 2), 12);
  const emptyTubes = stage % 3 === 0 ? 3 : 2;
  const timeLimitSec = Math.min(240 + (stage - 10) * 15, 360);
  return { stage, numColors, emptyTubes, timer: { timeLimitSec, bonusPerSecLeft: 15 } };
}

// ─── Game Types ──────────────────────────────────────────
export interface GameConfig {
  stage?: number;
}
