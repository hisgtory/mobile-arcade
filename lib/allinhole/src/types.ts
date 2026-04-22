/**
 * All in Hole — type definitions
 *
 * A sliding-ball puzzle: swipe to slide all balls into holes on the board.
 * Balls slide in the swiped direction until they hit a wall, obstacle, or fall into a hole.
 */

/** Direction a ball can slide */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Grid position */
export interface CellPos {
  row: number;
  col: number;
}

/** Types of cells on the board */
export enum CellType {
  EMPTY = 0,
  WALL = 1,
  HOLE = 2,
}

/** Ball color index */
export type BallColor = number;

/** A ball on the board */
export interface BallData {
  id: number;
  color: BallColor;
  row: number;
  col: number;
  /** Whether this ball has fallen into a hole */
  sunk: boolean;
}

/** Stage configuration */
export interface StageConfig {
  stage: number;
  /** Grid rows */
  rows: number;
  /** Grid cols */
  cols: number;
  /** Max moves allowed */
  maxMoves: number;
  /** Number of balls to place */
  ballCount: number;
  /** Number of holes on the board */
  holeCount: number;
  /** Number of wall obstacles */
  wallCount: number;
}

/** Game config passed to createGame */
export interface GameConfig {
  stage?: number;
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

/** Ball color palette (emoji circles) */
export const BALL_COLORS: string[] = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

/** Ball emoji for each color index */
export const BALL_EMOJIS: string[] = [
  '🔴', '🔵', '🟢', '🟡', '🟣', '🩷', '🩵', '🟠',
];
