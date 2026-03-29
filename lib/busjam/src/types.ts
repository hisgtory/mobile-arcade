// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 600;
export const BUS_CAPACITY = 3;           // passengers per bus
export const BOARDING_AREA_LIMIT = 7;    // max passengers in boarding area

// ─── Colors ──────────────────────────────────────────────
export const PASSENGER_COLORS: readonly string[] = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
] as const;

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  numColors: number;   // how many distinct colors
  numBuses: number;    // total buses to dispatch
  queueRows: number;   // rows of passengers in queue grid
  queueCols: number;   // columns of passengers in queue grid
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, numColors: 3, numBuses: 3, queueRows: 3, queueCols: 3 },
    { stage: 2, numColors: 3, numBuses: 4, queueRows: 4, queueCols: 3 },
    { stage: 3, numColors: 4, numBuses: 4, queueRows: 4, queueCols: 3 },
    { stage: 4, numColors: 4, numBuses: 5, queueRows: 5, queueCols: 3 },
    { stage: 5, numColors: 5, numBuses: 5, queueRows: 5, queueCols: 3 },
    { stage: 6, numColors: 5, numBuses: 6, queueRows: 6, queueCols: 3 },
    { stage: 7, numColors: 6, numBuses: 6, queueRows: 6, queueCols: 3 },
    { stage: 8, numColors: 6, numBuses: 7, queueRows: 7, queueCols: 3 },
    { stage: 9, numColors: 7, numBuses: 7, queueRows: 7, queueCols: 3 },
    { stage: 10, numColors: 7, numBuses: 8, queueRows: 8, queueCols: 3 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 10: scale up
  const numColors = Math.min(5 + Math.floor((stage - 5) / 2), 8);
  const numBuses = Math.min(5 + (stage - 5), 12);
  const queueRows = Math.min(numBuses, 10);
  return { stage, numColors, numBuses, queueRows, queueCols: 3 };
}

// ─── Game Types ──────────────────────────────────────────
export interface Passenger {
  id: number;
  colorIdx: number;
}

export interface Bus {
  colorIdx: number;
  passengers: Passenger[];
  departed: boolean;
}

export interface BoardState {
  /** Grid of passengers: rows x cols. null = empty slot */
  queue: (Passenger | null)[][];
  /** Boarding area: passengers waiting to board */
  boardingArea: Passenger[];
  /** Buses at stops */
  buses: Bus[];
  /** Bus queue waiting to arrive */
  busQueue: Bus[];
  /** Number of bus stops (buses visible at a time) */
  numStops: number;
  numColors: number;
}

export interface GameConfig {
  stage?: number;
}
