/**
 * Board logic for Toon Blast
 *
 * Tap-to-crush: BFS group finding, gravity, column collapse.
 * Board is a 2D array: board[row][col] = TileType (-1 = empty)
 * No new blocks spawn after crushing — the board gets progressively emptier.
 */

import { EMPTY, ROCKET, BOMB, DISCO, type TileType, type CellPos, type StageConfig } from '../types';

export type Board = TileType[][];

/** Create a new board with no initial groups larger than 3 */
export function createBoard(config: StageConfig): Board {
  const { rows, cols, colorCount } = config;
  let board: Board;
  let attempts = 0;

  do {
    board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * colorCount)),
    );
    attempts++;
    if (attempts > 200) break;
  } while (hasLargeGroup(board, 4));

  return board;
}

/** Check if any group of size >= threshold exists */
function hasLargeGroup(board: Board, threshold: number): boolean {
  const rows = board.length;
  const cols = board[0].length;
  const visited = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = `${r},${c}`;
      if (visited.has(k)) continue;
      if (board[r][c] === EMPTY || board[r][c] >= ROCKET) continue;
      const group = bfs(board, r, c, visited);
      if (group.length >= threshold) return true;
    }
  }
  return false;
}

/** BFS to find all same-colored adjacent blocks from (row, col) */
export function findGroup(board: Board, row: number, col: number): CellPos[] {
  const rows = board.length;
  const cols = board[0].length;
  if (row < 0 || row >= rows || col < 0 || col >= cols) return [];

  const type = board[row][col];
  if (type === EMPTY || type >= ROCKET) return [];

  const visited = new Set<string>();
  return bfs(board, row, col, visited);
}

function bfs(board: Board, startRow: number, startCol: number, visited: Set<string>): CellPos[] {
  const rows = board.length;
  const cols = board[0].length;
  const type = board[startRow][startCol];
  if (type === EMPTY || type >= ROCKET) return [];

  const group: CellPos[] = [];
  const queue: CellPos[] = [{ row: startRow, col: startCol }];
  const startKey = `${startRow},${startCol}`;
  visited.add(startKey);

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const cell = queue.shift()!;
    group.push(cell);

    for (const [dr, dc] of dirs) {
      const nr = cell.row + dr;
      const nc = cell.col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      if (board[nr][nc] !== type) continue;
      visited.add(key);
      queue.push({ row: nr, col: nc });
    }
  }

  return group;
}

/** Remove cells from board (set to EMPTY), returns count removed */
export function crushGroup(board: Board, cells: CellPos[]): number {
  for (const { row, col } of cells) {
    board[row][col] = EMPTY;
  }
  return cells.length;
}

/** Drop blocks down into empty spaces. Returns moves for animation. */
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

/** Shift non-empty columns left to fill empty columns. Returns column shift mapping. */
export function collapseColumns(board: Board): { fromCol: number; toCol: number }[] {
  const rows = board.length;
  const cols = board[0].length;
  const shifts: { fromCol: number; toCol: number }[] = [];

  let writeCol = 0;
  for (let c = 0; c < cols; c++) {
    // Check if column has any non-empty cell
    let hasBlock = false;
    for (let r = 0; r < rows; r++) {
      if (board[r][c] !== EMPTY) {
        hasBlock = true;
        break;
      }
    }

    if (hasBlock) {
      if (c !== writeCol) {
        // Move entire column
        for (let r = 0; r < rows; r++) {
          board[r][writeCol] = board[r][c];
          board[r][c] = EMPTY;
        }
        shifts.push({ fromCol: c, toCol: writeCol });
      }
      writeCol++;
    }
  }

  return shifts;
}

/** Fill empty cells with random colors (for testing only) */
export function fillEmpty(board: Board, colorCount: number): CellPos[] {
  const rows = board.length;
  const cols = board[0].length;
  const filled: CellPos[] = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (board[r][c] === EMPTY) {
        board[r][c] = Math.floor(Math.random() * colorCount);
        filled.push({ row: r, col: c });
      }
    }
  }

  return filled;
}

/** Score = n * (n - 1) * 10 where n = blocks crushed */
export function calcGroupScore(n: number): number {
  return n * (n - 1) * 10;
}

/** Determine special block type based on group size */
export function getSpecialForGroup(n: number): 'rocket' | 'bomb' | 'disco' | null {
  if (n >= 10) return 'disco';
  if (n >= 7) return 'bomb';
  if (n >= 5) return 'rocket';
  return null;
}

/** Check if any group of 2+ same-colored adjacent blocks exists */
export function hasValidMoves(board: Board): boolean {
  const rows = board.length;
  const cols = board[0].length;
  const visited = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = `${r},${c}`;
      if (visited.has(k)) continue;
      if (board[r][c] === EMPTY || board[r][c] >= ROCKET) continue;
      const group = bfs(board, r, c, visited);
      if (group.length >= 2) return true;
    }
  }
  return false;
}
