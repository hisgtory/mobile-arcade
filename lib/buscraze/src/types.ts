// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// Grid cell size (logical, before DPR scaling)
export const CELL_SIZE = 48;
export const GRID_GAP = 2;

// ─── Vehicle Types ───────────────────────────────────────
export type Direction = 'horizontal' | 'vertical';

export interface Vehicle {
  id: number;
  row: number;        // grid row (0-based)
  col: number;        // grid col (0-based)
  length: number;     // 2 or 3 cells
  direction: Direction;
  color: string;
  isTarget: boolean;  // the player's bus that must exit
}

export interface BoardState {
  gridRows: number;
  gridCols: number;
  vehicles: Vehicle[];
  exitRow: number;     // row where the target exits (right side)
  exitCol: number;     // col index for exit (always gridCols for horizontal exit)
}

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  gridRows: number;
  gridCols: number;
  numBlockers: number;  // non-target vehicles
  exitRow: number;
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, gridRows: 5, gridCols: 5, numBlockers: 4, exitRow: 2 },
    { stage: 2, gridRows: 5, gridCols: 5, numBlockers: 6, exitRow: 2 },
    { stage: 3, gridRows: 6, gridCols: 6, numBlockers: 7, exitRow: 2 },
    { stage: 4, gridRows: 6, gridCols: 6, numBlockers: 9, exitRow: 2 },
    { stage: 5, gridRows: 6, gridCols: 6, numBlockers: 11, exitRow: 2 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  const numBlockers = Math.min(11 + (stage - 5), 16);
  return { stage, gridRows: 6, gridCols: 6, numBlockers, exitRow: 2 };
}

// ─── Colors ──────────────────────────────────────────────
export const VEHICLE_COLORS: readonly string[] = [
  '#EF4444', // Red (target bus)
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
  '#F59E0B', // Amber
  '#10B981', // Emerald
] as const;

// ─── Game Types ──────────────────────────────────────────
export interface GameConfig {
  stage?: number;
}

export interface MoveRecord {
  vehicleId: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}
