/**
 * SlidingMatch game type definitions
 */

export type TileType = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface MatchResult {
  cells: CellPos[];
}

export interface StageConfig {
  stage: number;
  /** Number of distinct tile types */
  typeCount: number;
  /** Grid rows */
  rows: number;
  /** Grid cols */
  cols: number;
  /** Max moves allowed */
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

// Visually distinct tile images (subset of shared pixel-art assets)
export const TILE_IMAGES: string[] = [
  'fruit_grape_red',
  'boba_matcha',
  'coffee_mocha',
  'cake_redvelvet',
  'fruit_banana',
  'popsicle_pink',
  'onigiri_1',
  'pastry_croissant',
  'icecream_3scoops',
  'soda_coke',
];
