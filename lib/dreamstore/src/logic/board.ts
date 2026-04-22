/**
 * Board logic for DreamStore
 *
 * Grid of product tiles. When a product is consumed, gravity pulls tiles
 * down and new ones fill from the top.
 */

import type { ProductType, CellPos, StageConfig } from '../types';

export const EMPTY = -1;

export type Board = ProductType[][];

/** Create a new board with random products */
export function createBoard(config: StageConfig): Board {
  const { rows, cols, productTypes } = config;
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * productTypes)),
  );
}

/** Remove a cell (set to EMPTY) */
export function removeCell(board: Board, row: number, col: number): void {
  board[row][col] = EMPTY;
}

/** Apply gravity: drop tiles down into empty cells */
export function applyGravity(board: Board): { from: CellPos; to: CellPos }[] {
  const rows = board.length;
  const cols = board[0].length;
  const moves: { from: CellPos; to: CellPos }[] = [];

  for (let c = 0; c < cols; c++) {
    let writeRow = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (board[r][c] !== EMPTY) {
        if (r !== writeRow) {
          board[writeRow][c] = board[r][c];
          board[r][c] = EMPTY;
          moves.push({ from: { row: r, col: c }, to: { row: writeRow, col: c } });
        }
        writeRow--;
      }
    }
  }

  return moves;
}

/** Fill empty cells at top with new random products */
export function fillEmpty(board: Board, productTypes: number): CellPos[] {
  const rows = board.length;
  const cols = board[0].length;
  const filled: CellPos[] = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (board[r][c] === EMPTY) {
        board[r][c] = Math.floor(Math.random() * productTypes);
        filled.push({ row: r, col: c });
      }
    }
  }

  return filled;
}
