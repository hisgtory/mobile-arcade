/**
 * ForestPop game type definitions
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
}

export interface GameConfig {
  stage?: number;
  assetBaseUrl?: string;
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

// Forest/nature themed tile images
export const TILE_IMAGES: string[] = [
  'fruit_apple',
  'fruit_cherry',
  'fruit_blueberry',
  'fruit_peach',
  'fruit_kiwi',
  'fruit_strawberry',
  'fruit_orange',
  'fruit_grape_red',
  'vegetable_carrot',
  'vegetable_corn',
];
