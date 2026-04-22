/**
 * Board logic for BlockCrush (SameGame / Collapse)
 *
 * board[row][col] = 0 (empty) or hex color (filled)
 * Row 0 is top, row ROWS-1 is bottom.
 */

import { ROWS, COLS, BLOCK_COLORS, NUM_COLORS } from '../types';

export type Board = number[][];

/** Create a new board filled with random colors */
export function createBoard(
  rows: number = ROWS,
  cols: number = COLS,
  numColors: number = NUM_COLORS,
): Board {
  const colors = BLOCK_COLORS.slice(0, numColors);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => colors[Math.floor(Math.random() * colors.length)]),
  );
}

/** BFS to find all connected same-colored cells from (row, col) */
export function findGroup(
  board: Board,
  row: number,
  col: number,
): { row: number; col: number }[] {
  const rows = board.length;
  const cols = board[0].length;
  const color = board[row][col];
  if (color === 0) return [];

  const visited = new Set<string>();
  const group: { row: number; col: number }[] = [];
  const queue: { row: number; col: number }[] = [{ row, col }];
  visited.add(`${row},${col}`);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    group.push(cur);

    const neighbors = [
      { row: cur.row - 1, col: cur.col },
      { row: cur.row + 1, col: cur.col },
      { row: cur.row, col: cur.col - 1 },
      { row: cur.row, col: cur.col + 1 },
    ];

    for (const n of neighbors) {
      if (n.row < 0 || n.row >= rows || n.col < 0 || n.col >= cols) continue;
      const key = `${n.row},${n.col}`;
      if (visited.has(key)) continue;
      if (board[n.row][n.col] !== color) continue;
      visited.add(key);
      queue.push(n);
    }
  }

  return group;
}

/** Remove cells from board (set to 0) */
export function crushGroup(board: Board, cells: { row: number; col: number }[]): void {
  for (const { row, col } of cells) {
    board[row][col] = 0;
  }
}

/** Make blocks fall down within each column (gravity) */
export function applyGravity(board: Board): void {
  const rows = board.length;
  const cols = board[0].length;

  for (let c = 0; c < cols; c++) {
    // Collect non-empty cells from bottom to top
    const filled: number[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (board[r][c] !== 0) {
        filled.push(board[r][c]);
      }
    }
    // Fill column from bottom with filled cells, rest with 0
    for (let r = rows - 1; r >= 0; r--) {
      const idx = rows - 1 - r;
      board[r][c] = idx < filled.length ? filled[idx] : 0;
    }
  }
}

/** Collapse empty columns to the left */
export function shiftColumnsLeft(board: Board): void {
  const rows = board.length;
  const cols = board[0].length;

  // Find non-empty columns
  const nonEmpty: number[] = [];
  for (let c = 0; c < cols; c++) {
    let empty = true;
    for (let r = 0; r < rows; r++) {
      if (board[r][c] !== 0) {
        empty = false;
        break;
      }
    }
    if (!empty) nonEmpty.push(c);
  }

  // Rebuild: shift non-empty columns left, fill rest with 0
  for (let c = 0; c < cols; c++) {
    if (c < nonEmpty.length) {
      const srcCol = nonEmpty[c];
      if (srcCol !== c) {
        for (let r = 0; r < rows; r++) {
          board[r][c] = board[r][srcCol];
        }
      }
    } else {
      for (let r = 0; r < rows; r++) {
        board[r][c] = 0;
      }
    }
  }
}

/** Check if any group of 2+ connected same-colored blocks exists */
export function hasValidMoves(board: Board): boolean {
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === 0) continue;
      const color = board[r][c];
      // Check right neighbor
      if (c + 1 < cols && board[r][c + 1] === color) return true;
      // Check bottom neighbor
      if (r + 1 < rows && board[r + 1][c] === color) return true;
    }
  }
  return false;
}

/** Score for crushing a group of n blocks: n*(n-1) */
export function calcGroupScore(n: number): number {
  return n * (n - 1);
}
