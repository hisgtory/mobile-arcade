/**
 * ForestPop game type definitions
 */

export type TileType = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface StageConfig {
  stage: number;
  /** Number of distinct tile types */
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

// Reuse found3's tile images — forest / food themed
export const TILE_IMAGES: string[] = [
  'cake_strawberry',
  'boba_matcha',
  'coffee_espresso',
  'fruit_apple',
  'fruit_strawberry',
  'fruit_orange',
  'pastry_croissant',
  'icecream_1scoop',
  'onigiri_1',
  'popsicle_pink',
];
