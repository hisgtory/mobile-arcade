/**
 * Board logic for SlidingMatch
 *
 * Sliding puzzle + match-3 hybrid.
 * Board is a 2D array: board[row][col] = TileType (-1 = empty)
 *
 * Slide operations wrap around: the tile pushed off one end appears on the other.
 */

import type { TileType, CellPos, StageConfig } from '../types';

export const EMPTY = -1;

export type Board = TileType[][];

/** Create a new board with no initial matches */
export function createBoard(config: StageConfig): Board {
  const { rows, cols, typeCount } = config;
  let board: Board;
  let attempts = 0;

  do {
    board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * typeCount)),
    );
    attempts++;
    if (attempts > 100) break; // safety valve
  } while (findAllMatches(board).length > 0);

  return board;
}

/** Slide a row left: all tiles shift left by 1, leftmost wraps to right */
export function slideRowLeft(board: Board, row: number): void {
  const cols = board[0].length;
  const first = board[row][0];
  for (let c = 0; c < cols - 1; c++) {
    board[row][c] = board[row][c + 1];
  }
  board[row][cols - 1] = first;
}

/** Slide a row right: all tiles shift right by 1, rightmost wraps to left */
export function slideRowRight(board: Board, row: number): void {
  const cols = board[0].length;
  const last = board[row][cols - 1];
  for (let c = cols - 1; c > 0; c--) {
    board[row][c] = board[row][c - 1];
  }
  board[row][0] = last;
}

/** Slide a column up: all tiles shift up by 1, topmost wraps to bottom */
export function slideColUp(board: Board, col: number): void {
  const rows = board.length;
  const first = board[0][col];
  for (let r = 0; r < rows - 1; r++) {
    board[r][col] = board[r + 1][col];
  }
  board[rows - 1][col] = first;
}

/** Slide a column down: all tiles shift down by 1, bottommost wraps to top */
export function slideColDown(board: Board, col: number): void {
  const rows = board.length;
  const last = board[rows - 1][col];
  for (let r = rows - 1; r > 0; r--) {
    board[r][col] = board[r - 1][col];
  }
  board[0][col] = last;
}

/** Reverse a slide: undo the slide operation */
export function undoSlide(
  board: Board,
  direction: 'left' | 'right' | 'up' | 'down',
  index: number,
): void {
  switch (direction) {
    case 'left':
      slideRowRight(board, index);
      break;
    case 'right':
      slideRowLeft(board, index);
      break;
    case 'up':
      slideColDown(board, index);
      break;
    case 'down':
      slideColUp(board, index);
      break;
  }
}

/** Find all horizontal and vertical matches of 3+ */
export function findAllMatches(board: Board): CellPos[][] {
  const rows = board.length;
  const cols = board[0].length;
  const matches: CellPos[][] = [];

  // Horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 3; c++) {
      const t = board[r][c];
      if (t === EMPTY) continue;
      let end = c + 1;
      while (end < cols && board[r][end] === t) end++;
      if (end - c >= 3) {
        const cells: CellPos[] = [];
        for (let i = c; i < end; i++) cells.push({ row: r, col: i });
        matches.push(cells);
        c = end - 1;
      }
    }
  }

  // Vertical
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r <= rows - 3; r++) {
      const t = board[r][c];
      if (t === EMPTY) continue;
      let end = r + 1;
      while (end < rows && board[end][c] === t) end++;
      if (end - r >= 3) {
        const cells: CellPos[] = [];
        for (let i = r; i < end; i++) cells.push({ row: i, col: c });
        matches.push(cells);
        r = end - 1;
      }
    }
  }

  return mergeOverlapping(matches);
}

/** Merge match groups that share cells */
function mergeOverlapping(groups: CellPos[][]): CellPos[][] {
  if (groups.length <= 1) return groups;

  const key = (c: CellPos) => `${c.row},${c.col}`;
  const merged: CellPos[][] = [];
  const used = new Array(groups.length).fill(false);

  for (let i = 0; i < groups.length; i++) {
    if (used[i]) continue;
    const cellSet = new Set(groups[i].map(key));
    const cells = [...groups[i]];
    let changed = true;

    while (changed) {
      changed = false;
      for (let j = i + 1; j < groups.length; j++) {
        if (used[j]) continue;
        if (groups[j].some((c) => cellSet.has(key(c)))) {
          used[j] = true;
          for (const c of groups[j]) {
            const k = key(c);
            if (!cellSet.has(k)) {
              cellSet.add(k);
              cells.push(c);
            }
          }
          changed = true;
        }
      }
    }
    merged.push(cells);
  }

  return merged;
}

/** Remove matched cells (set to EMPTY) and return count removed */
export function removeCells(board: Board, cells: CellPos[]): number {
  for (const { row, col } of cells) {
    board[row][col] = EMPTY;
  }
  return cells.length;
}

/** Apply gravity: drop tiles down into empty cells. Returns cells that moved. */
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

/** Fill empty cells at top with new random tiles. Returns new tile positions. */
export function fillEmpty(board: Board, typeCount: number): CellPos[] {
  const rows = board.length;
  const cols = board[0].length;
  const filled: CellPos[] = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (board[r][c] === EMPTY) {
        board[r][c] = Math.floor(Math.random() * typeCount);
        filled.push({ row: r, col: c });
      }
    }
  }

  return filled;
}

/** Calculate score for a match group */
export function calcMatchScore(cellCount: number, combo: number): number {
  const base = cellCount === 3 ? 100 : cellCount === 4 ? 200 : 500;
  return base * Math.max(1, combo);
}
