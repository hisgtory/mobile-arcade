export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;
export const GRID_SIZE = 3; // default, use getGridConfig() for dynamic sizing

export type CellValue = 'X' | 'O' | null;
export type Player = 'X' | 'O';

export interface BoardState {
  cells: CellValue[];
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  winLine: number[] | null;
  gridSize: number;
  matchLength: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  difficulty?: Difficulty;
}

export interface GridConfig {
  gridSize: number;
  matchLength: number;
}

export function getGridConfig(winStreak: number): GridConfig {
  if (winStreak >= 6) return { gridSize: 5, matchLength: 4 };
  if (winStreak >= 3) return { gridSize: 4, matchLength: 4 };
  return { gridSize: 3, matchLength: 3 };
}
