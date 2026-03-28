/**
 * Fishdom game type definitions
 *
 * Match-3 core + aquarium meta-game types.
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

// Sea-themed food tile images for Fishdom
export const TILE_IMAGES: string[] = [
  'soda_coke',
  'boba_strawberry',
  'fruit_orange',
  'icecream_3scoops',
  'cake_cheese',
  'coffee_greentea',
  'popsicle_pink',
  'eggs_fried',
  'cheese_gouda',
  'jam_strawberry',
];
