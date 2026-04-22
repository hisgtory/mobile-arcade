/**
 * Puzzle3Go game type definitions
 */

export type TileType = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface StageConfig {
  stage: number;
  rows: number;
  cols: number;
  typeCount: number;
  targetScore: number;
  maxMoves: number;
}

export enum GamePhase {
  IDLE = 'idle',
  PLAYING = 'playing',
  ANIMATING = 'animating',
  CLEAR = 'clear',
  GAME_OVER = 'game_over',
}

// 10 Hwatu-themed emojis
export const TILE_EMOJIS: string[] = ['🌸', '🐦', '🌿', '🦅', '🎋', '🦋', '🐗', '🌕', '🍶', '🦌'];

// Tile background colors corresponding to emojis
export const TILE_COLORS: number[] = [
  0xfff5f5, 0xfff0f6, 0xf8f0fc, 0xf3f0ff, 0xedf2ff,
  0xe7f5ff, 0xe3fafc, 0xe6fcf5, 0xebfbee, 0xf4fce3,
];

export interface GameConfig {
  stage?: number;
  onClear?: () => void;
  onGameOver?: () => void;
}
