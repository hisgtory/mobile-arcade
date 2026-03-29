/**
 * BlockCrush type definitions
 */

export enum GamePhase {
  PLAYING = 'playing',
  ANIMATING = 'animating',
  GAME_OVER = 'game_over',
}

export interface GameConfig {
  onGameOver?: () => void;
}

export const COLS = 10;
export const ROWS = 14;
export const NUM_COLORS = 5;

/** Grid cell: 0 = empty, otherwise a hex color value */
export type Cell = number;

// Block colors — vibrant, distinct, 5 colors for SameGame balance
export const BLOCK_COLORS: number[] = [
  0xfa6c41, // orange
  0x2563eb, // blue
  0x8b5cf6, // purple
  0x059669, // green
  0xf43f5e, // rose
];
