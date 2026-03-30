/**
 * ForestPop game type definitions
 *
 * Forest-themed tap-to-pop puzzle: tap connected groups of 2+ same-type
 * tiles to pop them, then gravity fills gaps with new tiles.
 */

export type TileType = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface PopResult {
  cells: CellPos[];
  type: TileType;
  score: number;
}

export interface StageConfig {
  stage: number;
  /** Number of distinct tile types (5-8) */
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
  minGroup: number;
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

// Forest animal emoji tile types
export const TILE_EMOJIS: string[] = [
  '🐻',  // bear
  '🦊',  // fox
  '🐰',  // rabbit
  '🦉',  // owl
  '🐿️', // squirrel
  '🦌',  // deer
  '🐸',  // frog
  '🦋',  // butterfly
];
