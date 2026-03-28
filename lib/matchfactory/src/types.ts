/**
 * Match Factory game type definitions
 *
 * A match-3 swap puzzle with collection-order goals instead of score targets.
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

export interface MatchResult {
  cells: CellPos[];
}

/** A single order: collect N tiles of a specific type */
export interface Order {
  type: TileType;
  target: number;
  collected: number;
}

export interface StageConfig {
  stage: number;
  /** Number of distinct tile types on the board */
  typeCount: number;
  rows: number;
  cols: number;
  maxMoves: number;
  /** Orders to fulfill */
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

// Factory-themed tile images — industrial/food items for the factory
export const TILE_IMAGES: string[] = [
  'fruit_apple',
  'fruit_orange',
  'cheese_gouda',
  'coffee_espresso',
  'eggs_fried',
  'pastry_croissant',
  'jam_strawberry',
  'soymilk_choco',
  'vegetable_carrot',
  'canned_soup',
];
