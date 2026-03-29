/**
 * Toon Blast game type definitions
 */

/** -1 = empty, 0-4 = normal colors (5 total), 100 = rocket, 101 = bomb, 102 = disco */
export type TileType = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface StageConfig {
  stage: number;
  rows: number;
  cols: number;
  colorCount: number;
  maxMoves: number;
  targetScore: number;
}

export interface GameConfig {
  stage?: number;
  onClear?: () => void;
  onGameOver?: () => void;
}

export enum GamePhase {
  IDLE = 'idle',
  PLAYING = 'playing',
  ANIMATING = 'animating',
  CLEAR = 'clear',
  GAME_OVER = 'game_over',
}

export const EMPTY = -1;

// Special block type constants
export const ROCKET = 100;
export const BOMB = 101;
export const DISCO = 102;

/** 5 vibrant hex colors */
export const BLOCK_COLORS: number[] = [
  0xfa6c41, // orange
  0x2563eb, // blue
  0x8b5cf6, // purple
  0x059669, // green
  0xf43f5e, // rose
];
