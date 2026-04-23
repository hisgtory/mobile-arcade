/**
 * CandyPop Forest game type definitions
 */

export type TileType = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface StageConfig {
  stage: number;
  rows: number;
  cols: number;
  typeCount: number;
  targetScore: number;
  maxMoves: number;
}

export enum GamePhase {
  IDLE = 'idle',
  PLAYING = 'playing',
  ANIMATING = 'animating',
  CLEAR = 'clear',
  GAME_OVER = 'game_over',
}

export const TILE_IMAGES: string[] = [
  'apple', 'strawberry', 'cherry', 'grape', 'blueberry',
  'peach', 'kiwi', 'lemon', 'watermelon', 'orange'
];

export interface GameConfig {
  stage?: number;
  onClear?: () => void;
  onGameOver?: () => void;
}
