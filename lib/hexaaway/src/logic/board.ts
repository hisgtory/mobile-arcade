/**
 * Board logic for HexaAway
 *
 * Hexagonal grid with axial coordinates (q, r).
 * Valid cells satisfy: max(|q|, |r|, |q+r|) <= BOARD_RADIUS
 *
 * Lines clear along 3 axes:
 *   1. q-axis lines (constant q, varying r)
 *   2. r-axis lines (constant r, varying q)
 *   3. s-axis lines (constant s = -q-r, varying q and r)
 */

import { BOARD_RADIUS, type HexCoord, type PieceShape } from '../types';

/** Key for map lookup */
export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/** Board stored as Map<key, colorValue>. 0 = empty, nonzero = filled with that color. */
export type HexBoard = Map<string, number>;

/** Check if (q, r) is a valid cell in the hex grid */
export function isValidCell(q: number, r: number): boolean {
  const s = -q - r;
  return Math.abs(q) <= BOARD_RADIUS && Math.abs(r) <= BOARD_RADIUS && Math.abs(s) <= BOARD_RADIUS;
}

/** Create an empty hex board */
export function createBoard(): HexBoard {
  const board: HexBoard = new Map();
  for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
    for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
      if (isValidCell(q, r)) {
        board.set(hexKey(q, r), 0);
      }
    }
  }
  return board;
}

/** Check if a piece can be placed at offset (oq, or) */
export function canPlace(board: HexBoard, piece: PieceShape, oq: number, offsetR: number): boolean {
  for (const cell of piece.cells) {
    const q = oq + cell.q;
    const r = offsetR + cell.r;
    const key = hexKey(q, r);
    if (!board.has(key)) return false; // outside board
    if (board.get(key) !== 0) return false; // occupied
  }
  return true;
}

/** Place a piece on the board. Returns placed cell positions. */
export function placePiece(
  board: HexBoard,
  piece: PieceShape,
  oq: number,
  offsetR: number,
): HexCoord[] {
  const placed: HexCoord[] = [];
  for (const cell of piece.cells) {
    const q = oq + cell.q;
    const r = offsetR + cell.r;
    board.set(hexKey(q, r), piece.color);
    placed.push({ q, r });
  }
  return placed;
}

/**
 * Get all lines on the hex board grouped by the 3 axes.
 * Each line is an array of HexCoord that share the same axis value.
 */
function getAllLines(): HexCoord[][] {
  const lines: HexCoord[][] = [];

  // q-axis lines: for each q value, all valid (q, r) cells form a line
  for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
    const line: HexCoord[] = [];
    for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
      if (isValidCell(q, r)) line.push({ q, r });
    }
    if (line.length > 0) lines.push(line);
  }

  // r-axis lines: for each r value, all valid (q, r) cells form a line
  for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
    const line: HexCoord[] = [];
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      if (isValidCell(q, r)) line.push({ q, r });
    }
    if (line.length > 0) lines.push(line);
  }

  // s-axis lines: for each s=-q-r value, all valid cells form a line
  for (let s = -BOARD_RADIUS; s <= BOARD_RADIUS; s++) {
    const line: HexCoord[] = [];
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      const r = -q - s;
      if (isValidCell(q, r)) line.push({ q, r });
    }
    if (line.length > 0) lines.push(line);
  }

  return lines;
}

/** Cached lines for performance */
let cachedLines: HexCoord[][] | null = null;
function getLines(): HexCoord[][] {
  if (!cachedLines) cachedLines = getAllLines();
  return cachedLines;
}

/** Find all full lines. Returns arrays of cells to clear. */
export function findFullLines(board: HexBoard): HexCoord[][] {
  const fullLines: HexCoord[][] = [];

  for (const line of getLines()) {
    if (line.every((c) => (board.get(hexKey(c.q, c.r)) ?? 0) !== 0)) {
      fullLines.push(line);
    }
  }

  return fullLines;
}

/** Clear full lines. Returns unique cells that were cleared. */
export function clearLines(board: HexBoard, lines: HexCoord[][]): HexCoord[] {
  const clearedSet = new Set<string>();
  const cleared: HexCoord[] = [];

  for (const line of lines) {
    for (const c of line) {
      const key = hexKey(c.q, c.r);
      if (!clearedSet.has(key)) {
        clearedSet.add(key);
        cleared.push({ q: c.q, r: c.r });
      }
      board.set(key, 0);
    }
  }

  return cleared;
}

/** Calculate score for clearing lines */
export function calcClearScore(lineCount: number, cellCount: number): number {
  const lineBonus = lineCount <= 1 ? 1 : lineCount;
  return cellCount * 10 * lineBonus;
}

/** Check if any of the given pieces can be placed anywhere on the board */
export function canPlaceAny(board: HexBoard, pieces: PieceShape[]): boolean {
  for (const piece of pieces) {
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
        if (isValidCell(q, r) && canPlace(board, piece, q, r)) return true;
      }
    }
  }
  return false;
}
