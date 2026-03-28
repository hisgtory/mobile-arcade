/**
 * Crunch3 game type definitions
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
  /** Special tile created by 4+ matches */
  special?: 'line_h' | 'line_v' | 'bomb';
}

export interface MatchResult {
  cells: CellPos[];
  /** If 4+, indicates special tile to create */
  special?: 'line_h' | 'line_v' | 'bomb';
}

export interface SwapResult {
  valid: boolean;
  matches: MatchResult[];
  score: number;
  combo: number;
}

export interface StageConfig {
  stage: number;
  /** Number of distinct tile types (6-10) */
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

// Use a subset of found3's tile images for crunch3
// 8 visually distinct food types for match-3
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
