/**
 * Board logic for ForestPop (tap-to-pop)
 *
 * Handles grid creation, connected-group finding, gravity, and new tile generation.
 * The board is a 2D array: board[row][col] = TileType (-1 = empty)
 */

import type { TileType, CellPos, StageConfig } from '../types';

export const EMPTY = -1;

export type Board = TileType[][];

/** Create a new board with no poppable groups of 3+ at start */
export function createBoard(config: StageConfig): Board {
  const { rows, cols, typeCount } = config;
  let board: Board;

  do {
    board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * typeCount)),
    );
  } while (findConnectedGroups(board, 3).length > 0);

  return board;
}

/** Find the connected group of same-type tiles starting from a cell (flood fill) */
export function findGroup(board: Board, start: CellPos): CellPos[] {
  const rows = board.length;
  const cols = board[0].length;
  const type = board[start.row][start.col];
  if (type === EMPTY) return [];

  const visited = new Set<string>();
  const group: CellPos[] = [];
  const stack: CellPos[] = [start];
  const key = (r: number, c: number) => `${r},${c}`;

  while (stack.length > 0) {
    const cell = stack.pop()!;
    const k = key(cell.row, cell.col);
    if (visited.has(k)) continue;
    visited.add(k);
    group.push(cell);

    // Check 4 neighbors (up, down, left, right)
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
        stack.push(n);
      }
    }
  }

  return group;
}

/** Find all connected groups of size >= minSize */
export function findConnectedGroups(board: Board, minSize: number = 3): CellPos[][] {
  const rows = board.length;
  const cols = board[0].length;
  const visited = new Set<string>();
  const groups: CellPos[][] = [];
  const key = (r: number, c: number) => `${r},${c}`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === EMPTY || visited.has(key(r, c))) continue;
      const group = findGroup(board, { row: r, col: c });
      for (const cell of group) {
        visited.add(key(cell.row, cell.col));
      }
      if (group.length >= minSize) {
        groups.push(group);
      }
    }
  }

  return groups;
}

/** Remove cells (set to EMPTY) */
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

/** Calculate score for popping a group */
export function calcPopScore(cellCount: number, combo: number): number {
  const base = cellCount <= 3 ? 100 : cellCount <= 4 ? 200 : 500;
  return base * Math.max(1, combo);
}
