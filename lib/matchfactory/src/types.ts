/**
 * Match Factory game type definitions
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

/** A single collection order: collect N tiles of a given type */
export interface Order {
  type: TileType;
  target: number;
  collected: number;
}

export interface StageConfig {
  stage: number;
  /** Number of distinct tile types (6-8) */
  typeCount: number;
  /** Grid rows */
  rows: number;
  /** Grid cols */
  cols: number;
  /** Max moves allowed */
  maxMoves: number;
  /** Collection orders to fulfill */
  orders: { type: TileType; target: number }[];
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

// 10 visually distinct food tile images for match-3
export const TILE_IMAGES: string[] = [
  'fruit_apple',
  'cheese_gouda',
  'coffee_espresso',
  'eggs_fried',
  'fruit_orange',
  'pastry_croissant',
  'boba_matcha',
  'cake_strawberry',
  'onigiri_1',
  'popsicle_pink',
];
