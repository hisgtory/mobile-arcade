/**
 * Board logic for Block Puzzle
 *
 * 8×8 grid. Place pieces, clear completed rows/columns.
 */

import {
  BOARD_ROWS,
  BOARD_COLS,
  PIECE_CATALOG,
  JEWEL_COLORS,
  type PieceShape,
  type Piece,
} from '../types';

/** Board cell: 0 = empty, positive number = color */
export type Board = number[][];

export function createBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array(BOARD_COLS).fill(0),
  );
}

/** Check if a piece can be placed at (row, col) */
export function canPlace(
  board: Board,
  piece: PieceShape,
  row: number,
  col: number,
): boolean {
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (!piece[r][c]) continue;
      const br = row + r;
      const bc = col + c;
      if (br < 0 || br >= BOARD_ROWS || bc < 0 || bc >= BOARD_COLS) return false;
      if (board[br][bc] !== 0) return false;
    }
  }
  return true;
}

/** Place a piece on the board. Returns the filled cell positions. */
export function placePiece(
  board: Board,
  piece: PieceShape,
  row: number,
  col: number,
  color: number,
): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (!piece[r][c]) continue;
      board[row + r][col + c] = color;
      cells.push({ row: row + r, col: col + c });
    }
  }
  return cells;
}

/** Check and clear completed rows/columns. Returns cleared cell positions and line count. */
export function checkAndClear(board: Board): {
  cleared: { row: number; col: number }[];
  lines: number;
} {
  const rowsToClear: number[] = [];
  const colsToClear: number[] = [];

  // Check rows
  for (let r = 0; r < BOARD_ROWS; r++) {
    if (board[r].every((cell) => cell !== 0)) {
      rowsToClear.push(r);
    }
  }

  // Check columns
  for (let c = 0; c < BOARD_COLS; c++) {
    let full = true;
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (board[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.push(c);
  }

  // Collect cells to clear (use Set to avoid duplicates at intersections)
  const clearSet = new Set<string>();
  for (const r of rowsToClear) {
    for (let c = 0; c < BOARD_COLS; c++) {
      clearSet.add(`${r},${c}`);
    }
  }
  for (const c of colsToClear) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      clearSet.add(`${r},${c}`);
    }
  }

  const cleared: { row: number; col: number }[] = [];
  for (const key of clearSet) {
    const [r, c] = key.split(',').map(Number);
    board[r][c] = 0;
    cleared.push({ row: r, col: c });
  }

  return { cleared, lines: rowsToClear.length + colsToClear.length };
}

/** Check if any of the given pieces can be placed anywhere on the board */
export function canPlaceAny(board: Board, pieces: Piece[]): boolean {
  for (const piece of pieces) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (canPlace(board, piece.shape, r, c)) return true;
      }
    }
  }
  return false;
}

/** Generate random pieces */
export function generatePieces(count: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const shape = PIECE_CATALOG[Math.floor(Math.random() * PIECE_CATALOG.length)];
    const color = JEWEL_COLORS[Math.floor(Math.random() * JEWEL_COLORS.length)];
    pieces.push({ shape, color });
  }
  return pieces;
}

/** Count filled cells in a piece shape */
export function pieceSize(shape: PieceShape): number {
  let count = 0;
  for (const row of shape) {
    for (const cell of row) {
      if (cell) count++;
    }
  }
  return count;
}

/** Calculate score for line clears */
export function calculateClearScore(lines: number, combo: number): number {
  if (lines === 0) return 0;
  let base: number;
  if (lines === 1) base = 100;
  else if (lines === 2) base = 300;
  else if (lines === 3) base = 600;
  else base = lines * 250;
  return base * Math.max(1, combo);
}
