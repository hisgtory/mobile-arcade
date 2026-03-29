/**
 * Fishdom game type definitions
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
  /** Number of distinct tile types (6-8) */
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

// Aquatic-themed tile emojis for Fishdom
export const TILE_EMOJIS: string[] = [
  '🐠', // tropical fish
  '🐟', // fish
  '🦀', // crab
  '🐚', // shell
  '🌊', // wave
  '⭐', // starfish
  '🐙', // octopus
  '🦑', // squid
];
