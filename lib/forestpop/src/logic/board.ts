/**
 * Board logic for ForestPop
 *
 * Tap-to-pop connected groups mechanic.
 * The board is a 2D array: board[row][col] = TileType (-1 = empty)
 */

import type { TileType, CellPos, StageConfig } from '../types';

export const EMPTY = -1;

export type Board = TileType[][];

/** Create a new board with no large initial groups */
export function createBoard(config: StageConfig): Board {
  const { rows, cols, typeCount } = config;
  let board: Board;

  do {
    board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * typeCount)),
    );
  } while (hasLargeGroup(board, 6));

  return board;
}

/** Check if any connected group exceeds maxSize */
function hasLargeGroup(board: Board, maxSize: number): boolean {
  const rows = board.length;
  const cols = board[0].length;
  const visited = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visited.has(key(r, c))) continue;
      const group = floodFill(board, r, c);
      for (const cell of group) visited.add(key(cell.row, cell.col));
      if (group.length > maxSize) return true;
    }
  }
  return false;
}

/** BFS flood fill to find connected same-type tiles */
export function floodFill(board: Board, startRow: number, startCol: number): CellPos[] {
  const rows = board.length;
  const cols = board[0].length;
  const type = board[startRow][startCol];
  if (type === EMPTY) return [];

  const visited = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const queue: CellPos[] = [{ row: startRow, col: startCol }];
  const group: CellPos[] = [];

  visited.add(key(startRow, startCol));

  while (queue.length > 0) {
    const cell = queue.shift()!;
    group.push(cell);

    const neighbors: CellPos[] = [
      { row: cell.row - 1, col: cell.col },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
      { row: cell.row, col: cell.col + 1 },
    ];

    for (const n of neighbors) {
      if (n.row < 0 || n.row >= rows || n.col < 0 || n.col >= cols) continue;
      const k = key(n.row, n.col);
      if (visited.has(k)) continue;
      if (board[n.row][n.col] !== type) continue;
      visited.add(k);
      queue.push(n);
    }
  }

  return group;
}

/** Remove cells (set to EMPTY) and return count removed */
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

/** Calculate score for a popped group */
export function calcPopScore(cellCount: number, combo: number): number {
  let base: number;
  if (cellCount <= 2) base = 50;
  else if (cellCount === 3) base = 100;
  else if (cellCount === 4) base = 200;
  else base = 300 + (cellCount - 5) * 100;
  return base * Math.max(1, combo);
}
