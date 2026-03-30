/**
 * Board logic for ForestPop
 *
 * Tap-to-pop connected groups mechanic using BFS flood fill.
 * board[row][col] = TileType (-1 = empty)
 */

import type { TileType, CellPos, StageConfig } from '../types';

export const EMPTY = -1;

export type Board = TileType[][];

/** Create a new board filled with random tiles */
export function createBoard(config: StageConfig): Board {
  const { rows, cols, typeCount } = config;
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * typeCount)),
  );
}

/**
 * BFS flood fill — find all connected same-type tiles from a starting cell.
 * Only considers orthogonal (up/down/left/right) neighbors.
 */
export function findConnectedGroup(board: Board, start: CellPos): CellPos[] {
  const rows = board.length;
  const cols = board[0].length;
  const type = board[start.row][start.col];

  if (type === EMPTY) return [];

  const visited = new Set<string>();
  const queue: CellPos[] = [start];
  const group: CellPos[] = [];
  const key = (r: number, c: number) => `${r},${c}`;

  visited.add(key(start.row, start.col));

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
        board[n.row][n.col] === type
      ) {
        visited.add(key(n.row, n.col));
        queue.push(n);
      }
    }
  }

  return group;
}

/** Remove cells (set to EMPTY) */
export function removeCells(board: Board, cells: CellPos[]): void {
  for (const { row, col } of cells) {
    board[row][col] = EMPTY;
  }
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

/** Calculate score for popping a group */
export function calcPopScore(cellCount: number, combo: number): number {
  // Bigger groups give more points per tile
  const perTile = cellCount <= 3 ? 50 : cellCount <= 5 ? 80 : cellCount <= 8 ? 120 : 200;
  return perTile * cellCount * Math.max(1, combo);
}

/** Check if any tappable group exists with at least minGroup tiles */
export function hasValidMoves(board: Board, minGroup: number): boolean {
  const rows = board.length;
  const cols = board[0].length;
  const visited = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visited.has(key(r, c))) continue;
      if (board[r][c] === EMPTY) continue;

      const group = findConnectedGroup(board, { row: r, col: c });
      for (const cell of group) {
        visited.add(key(cell.row, cell.col));
      }
      if (group.length >= minGroup) return true;
    }
  }

  return false;
}
