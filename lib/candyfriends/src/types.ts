/**
 * Candy Friends game type definitions
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

export interface SwapResult {
  valid: boolean;
  matches: MatchResult[];
  score: number;
  combo: number;
}

export interface StageConfig {
  stage: number;
  /** Number of distinct tile types (5-10) */
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

// Candy-themed tile images using available pixel art assets
export const TILE_IMAGES: string[] = [
  'cake_strawberry',
  'cake_chocolate',
  'popsicle_pink',
  'popsicle_blue',
  'popsicle_green',
  'icecream_1scoop',
  'icecream_3scoops',
  'boba_strawberry',
  'boba_taro',
  'jam_strawberry',
];
