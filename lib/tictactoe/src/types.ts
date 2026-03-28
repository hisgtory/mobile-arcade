export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;
export const GRID_SIZE = 3;

export type CellValue = 'X' | 'O' | null;
export type Player = 'X' | 'O';

export interface BoardState {
  cells: CellValue[];  // 9 cells, row-major
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  winLine: number[] | null; // indices of winning 3 cells
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  difficulty?: Difficulty;
}
