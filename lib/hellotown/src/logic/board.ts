/**
 * Board logic for HelloTown merge game
 *
 * The board is a 2D array: board[row][col] = ItemLevel (-1 = empty)
 * Merge two adjacent identical-level items → one item of level + 1.
 */

import type { ItemLevel, CellPos, StageConfig } from '../types';

export const EMPTY = -1;

export type Board = ItemLevel[][];

/** Create a new board with random starting items placed */
export function createBoard(config: StageConfig): Board {
  const { rows, cols, startLevels, initialItems } = config;
  const board: Board = Array.from({ length: rows }, () =>
    new Array(cols).fill(EMPTY),
  );

  // Place initial items randomly
  const allCells: CellPos[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allCells.push({ row: r, col: c });
    }
  }

  // Shuffle cells
  for (let i = allCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
  }

  // Place items: ensure at least some pairs exist for merging
  const itemCount = Math.min(initialItems, rows * cols);
  for (let i = 0; i < itemCount; i++) {
    const cell = allCells[i];
    board[cell.row][cell.col] = Math.floor(Math.random() * startLevels);
  }

  // Ensure there's at least one mergeable pair (adjacent cells with same level)
  if (!hasMergeablePair(board)) {
    // Find two adjacent occupied cells and force them to the same level
    let forced = false;
    for (let r = 0; r < rows && !forced; r++) {
      for (let c = 0; c < cols && !forced; c++) {
        if (board[r][c] === EMPTY) continue;
        // Check right neighbor
        if (c + 1 < cols && board[r][c + 1] !== EMPTY) {
          board[r][c + 1] = board[r][c];
          forced = true;
        }
        // Check bottom neighbor
        else if (r + 1 < rows && board[r + 1][c] !== EMPTY) {
          board[r + 1][c] = board[r][c];
          forced = true;
        }
      }
    }
  }

  return board;
}

/** Check if two cells are adjacent (not diagonal) */
export function isAdjacent(a: CellPos, b: CellPos): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/** Check if a merge is valid: same level, adjacent, non-empty */
export function canMerge(board: Board, from: CellPos, to: CellPos): boolean {
  const rows = board.length;
  const cols = board[0].length;

  if (
    from.row < 0 || from.row >= rows || from.col < 0 || from.col >= cols ||
    to.row < 0 || to.row >= rows || to.col < 0 || to.col >= cols
  ) {
    return false;
  }

  if (!isAdjacent(from, to)) return false;

  const fromVal = board[from.row][from.col];
  const toVal = board[to.row][to.col];

  if (fromVal === EMPTY || toVal === EMPTY) return false;
  if (fromVal !== toVal) return false;

  return true;
}

/** Execute a merge: combine from into to, creating level + 1 at 'to' position */
export function executeMerge(board: Board, from: CellPos, to: CellPos): ItemLevel {
  const newLevel = board[to.row][to.col] + 1;
  board[to.row][to.col] = newLevel;
  board[from.row][from.col] = EMPTY;
  return newLevel;
}

/** Apply gravity: items fall down into empty cells */
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

/** Check if any mergeable pair exists on the board */
export function hasMergeablePair(board: Board): boolean {
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === EMPTY) continue;
      // Check right neighbor
      if (c + 1 < cols && board[r][c + 1] === board[r][c]) return true;
      // Check bottom neighbor
      if (r + 1 < rows && board[r + 1][c] === board[r][c]) return true;
    }
  }

  return false;
}

/** Get the highest level item on the board */
export function getMaxLevel(board: Board): number {
  let max = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell > max) max = cell;
    }
  }
  return max;
}

/** Count non-empty cells */
export function countItems(board: Board): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== EMPTY) count++;
    }
  }
  return count;
}

/** Calculate score for a merge */
export function calcMergeScore(newLevel: number, combo: number): number {
  const base = (newLevel + 1) * 50;
  return base * Math.max(1, combo);
}
