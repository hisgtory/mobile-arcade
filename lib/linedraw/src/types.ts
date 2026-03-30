// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Cell Types ──────────────────────────────────────────
export const CELL_EMPTY = 0;
export const CELL_WALL = 1;
export const CELL_START = 2;

export type CellType = typeof CELL_EMPTY | typeof CELL_WALL | typeof CELL_START;

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  cols: number;
  rows: number;
  walls: number[];     // flat indices of wall cells
  start: number;       // flat index of start cell
}

export interface GameConfig {
  stage?: number;
}

// ─── Board State ─────────────────────────────────────────
export interface BoardState {
  cols: number;
  rows: number;
  grid: CellType[];    // flat array: rows * cols
  start: number;       // flat index of start cell
  path: number[];      // ordered flat indices of visited cells
  totalOpen: number;   // total non-wall cells to visit
}

// ─── Stage Definitions ───────────────────────────────────

const STAGE_DEFS: StageConfig[] = [
  // Stage 1: 3×3, no walls
  { stage: 1, cols: 3, rows: 3, walls: [], start: 0 },
  // Stage 2: 3×3, 1 wall
  { stage: 2, cols: 3, rows: 3, walls: [4], start: 0 },
  // Stage 3: 4×4, 1 wall
  { stage: 3, cols: 4, rows: 4, walls: [5], start: 0 },
  // Stage 4: 4×4, 2 walls
  { stage: 4, cols: 4, rows: 4, walls: [5, 10], start: 0 },
  // Stage 5: 5×5, 2 walls
  { stage: 5, cols: 5, rows: 5, walls: [6, 18], start: 0 },
  // Stage 6: 5×5, 3 walls
  { stage: 6, cols: 5, rows: 5, walls: [6, 12, 18], start: 0 },
  // Stage 7: 5×5, 4 walls
  { stage: 7, cols: 5, rows: 5, walls: [6, 8, 16, 18], start: 0 },
  // Stage 8: 6×6, 3 walls
  { stage: 8, cols: 6, rows: 6, walls: [7, 14, 28], start: 0 },
  // Stage 9: 6×6, 4 walls
  { stage: 9, cols: 6, rows: 6, walls: [7, 14, 21, 28], start: 0 },
  // Stage 10: 6×6, 5 walls
  { stage: 10, cols: 6, rows: 6, walls: [7, 10, 14, 21, 28], start: 0 },
];

export function getStageConfig(stage: number): StageConfig {
  if (stage <= STAGE_DEFS.length) return STAGE_DEFS[stage - 1];
  // Beyond stage 10: 6×6 with scaling walls
  const wallCount = Math.min(5 + (stage - 10), 10);
  const gridSize = 36; // 6×6
  // Seed-based shuffle of all candidate indices (1..35, avoiding 0=start)
  const candidates: number[] = [];
  for (let i = 1; i < gridSize; i++) candidates.push(i);
  // Deterministic shuffle using stage as seed
  let seed = stage * 2654435761; // Knuth multiplicative hash
  for (let i = candidates.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const walls = candidates.slice(0, wallCount);
  return { stage, cols: 6, rows: 6, walls, start: 0 };
}
