/**
 * Anipang4 game type definitions
 *
 * Time-based match-3 (vs Crunch3's move-based approach)
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
  /** Time limit in seconds */
  timeLimit: number;
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

// Distinct tile set from crunch3 for visual differentiation
// Korean-flavored food + drink combos
export const TILE_IMAGES: string[] = [
  'fruit_watermelon',
  'fruit_grape_red',
  'fruit_cherry',
  'fruit_banana',
  'boba_taro',
  'boba_strawberry',
  'cake_chocolate',
  'cake_cheese',
  'soda_fanta',
  'popsicle_blue',
];
