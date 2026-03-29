/**
 * Minesweeper type definitions
 */

export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 680;

export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  mine: boolean;
  adjacentMines: number;
  state: CellState;
}

export type Difficulty = 'easy' | 'medium' | 'expert';

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: 'Easy' },
  medium: { rows: 16, cols: 16, mines: 40, label: 'Medium' },
  expert: { rows: 16, cols: 30, mines: 99, label: 'Expert' },
};

export type GamePhase = 'ready' | 'playing' | 'won' | 'lost';

export interface GameConfig {
  difficulty?: Difficulty;
  onGameOver?: () => void;
}
