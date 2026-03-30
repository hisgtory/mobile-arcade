/**
 * Board logic for ForestPop
 *
 * Tap-to-pop: BFS flood fill to find connected groups of same type.
 * The board is a 2D array: board[row][col] = TileType (-1 = empty)
 */

import type { TileType, CellPos, StageConfig } from '../types';

export const EMPTY = -1;

export type Board = TileType[][];

/** Create a new board with random tiles */
export function createBoard(config: StageConfig): Board {
  const { rows, cols, typeCount } = config;
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * typeCount)),
  );
}

/**
 * Find all connected tiles of the same type starting from (row, col).
 * Uses BFS flood fill (4-directional: up, down, left, right).
 */
export function findConnectedGroup(board: Board, row: number, col: number): CellPos[] {
  const rows = board.length;
  const cols = board[0].length;
  const tileType = board[row][col];

  if (tileType === EMPTY) return [];

  const visited = new Set<string>();
  const group: CellPos[] = [];
  const queue: CellPos[] = [{ row, col }];
  const key = (r: number, c: number) => `${r},${c}`;

  visited.add(key(row, col));

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
      if (
        n.row >= 0 && n.row < rows &&
        n.col >= 0 && n.col < cols &&
        !visited.has(key(n.row, n.col)) &&
        board[n.row][n.col] === tileType
      ) {
        visited.add(key(n.row, n.col));
        queue.push(n);
      }
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
  // Bigger groups = exponentially more points
  const base = cellCount <= 3 ? cellCount * 50 : cellCount * cellCount * 10;
  return base * Math.max(1, combo);
}

/** Check if any valid moves remain (any group >= minGroupSize) */
export function hasValidMoves(board: Board, minGroupSize: number): boolean {
  const rows = board.length;
  const cols = board[0].length;
  const checked = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === EMPTY || checked.has(key(r, c))) continue;
      const group = findConnectedGroup(board, r, c);
      for (const cell of group) {
        checked.add(key(cell.row, cell.col));
      }
      if (group.length >= minGroupSize) return true;
    }
  }

  return false;
}
