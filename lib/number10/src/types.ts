export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;
export const COLS = 10;
export const ROWS = 17;
export const TOTAL_CELLS = COLS * ROWS; // 170

export interface GameConfig {
  // reserved for future options
}

export interface Cell {
  value: number; // 1-9, 0 = cleared
  col: number;
  row: number;
}
