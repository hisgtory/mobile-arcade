/**
 * Anipang3 game type definitions
 *
 * Animal-themed match-3 game inspired by the Anipang series.
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
  /** Number of distinct tile types (5-8) */
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

// Animal-themed tile images using available food tile assets
// Each represents an "animal friend" in the Anipang style
export const TILE_IMAGES: string[] = [
  'fruit_cherry',
  'fruit_grape_red',
  'fruit_watermelon',
  'fruit_banana',
  'fruit_blueberry',
  'fruit_orange',
  'fruit_strawberry',
  'fruit_apple',
];
