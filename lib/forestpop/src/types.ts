/**
 * ForestPop game type definitions
 *
 * Forest-themed tap-to-pop puzzle: tap connected groups of same-type tiles to pop them.
 */

export type TileType = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface TileData {
  type: TileType;
  row: number;
  col: number;
}

export interface PopResult {
  cells: CellPos[];
  score: number;
}

export interface StageConfig {
  stage: number;
  /** Number of distinct tile types (4-7) */
  typeCount: number;
  /** Grid rows */
  rows: number;
  /** Grid cols */
  cols: number;
  /** Max moves (taps) allowed */
  maxMoves: number;
  /** Target score to clear */
  targetScore: number;
  /** Minimum group size to pop */
  minGroupSize: number;
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

// Forest animal emoji tiles
export const TILE_EMOJIS: string[] = [
  '🐻',  // bear
  '🦊',  // fox
  '🐰',  // rabbit
  '🦉',  // owl
  '🐿️',  // squirrel
  '🦌',  // deer
  '🐸',  // frog
];
