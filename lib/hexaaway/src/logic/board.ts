/**
 * Board logic for Hexa Away
 *
 * Hexagonal board using axial coordinates (q, r).
 * Board is a regular hexagon of BOARD_RADIUS.
 *
 * Lines run in 3 axial directions:
 *   - constant q  (vertical-ish)
 *   - constant r  (horizontal-ish)
 *   - constant s = -(q+r)  (diagonal)
 */

import {
  BOARD_RADIUS,
  hexInBoard,
  hexKey,
  type Hex,
  type PieceShape,
} from '../types';

// ─── Board type ──────────────────────────────────────────
/** Map from "q,r" → colour (0x000000 means empty is NOT used; absence = empty) */
export type Board = Map<string, number>;

/** Generate all valid cell keys for the hex board */
export function allCells(radius: number = BOARD_RADIUS): Hex[] {
  const cells: Hex[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (hexInBoard(q, r, radius)) {
        cells.push({ q, r });
      }
    }
  }
  return cells;
}

export function createBoard(radius: number = BOARD_RADIUS): Board {
  const board: Board = new Map();
  for (const { q, r } of allCells(radius)) {
    board.set(hexKey(q, r), 0); // 0 = empty
  }
  return board;
}

// ─── Placement ───────────────────────────────────────────

export function canPlace(
  board: Board,
  piece: PieceShape,
  anchorQ: number,
  anchorR: number,
): boolean {
  for (const cell of piece.cells) {
    const q = anchorQ + cell.q;
    const r = anchorR + cell.r;
    const key = hexKey(q, r);
    if (!board.has(key)) return false; // outside board
    if (board.get(key) !== 0) return false; // occupied
  }
  return true;
}

export function placePiece(
  board: Board,
  piece: PieceShape,
  anchorQ: number,
  anchorR: number,
): Hex[] {
  const placed: Hex[] = [];
  for (const cell of piece.cells) {
    const q = anchorQ + cell.q;
    const r = anchorR + cell.r;
    board.set(hexKey(q, r), piece.color);
    placed.push({ q, r });
  }
  return placed;
}

// ─── Line detection ──────────────────────────────────────

export interface LineSet {
  qLines: number[]; // constant-q values that are full
  rLines: number[]; // constant-r values that are full
  sLines: number[]; // constant-s values that are full
}

/** Collect cells that belong to a specific line */
function cellsOnQLine(q: number, radius: number): Hex[] {
  const cells: Hex[] = [];
  for (let r = -radius; r <= radius; r++) {
    if (hexInBoard(q, r, radius)) cells.push({ q, r });
  }
  return cells;
}

function cellsOnRLine(r: number, radius: number): Hex[] {
  const cells: Hex[] = [];
  for (let q = -radius; q <= radius; q++) {
    if (hexInBoard(q, r, radius)) cells.push({ q, r });
  }
  return cells;
}

function cellsOnSLine(s: number, radius: number): Hex[] {
  const cells: Hex[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r = -s - q;
    if (hexInBoard(q, r, radius)) cells.push({ q, r });
  }
  return cells;
}

function isLineFull(board: Board, cells: Hex[]): boolean {
  return cells.every(({ q, r }) => {
    const v = board.get(hexKey(q, r));
    return v !== undefined && v !== 0;
  });
}

export function findFullLines(board: Board, radius: number = BOARD_RADIUS): LineSet {
  const qLines: number[] = [];
  const rLines: number[] = [];
  const sLines: number[] = [];

  for (let i = -radius; i <= radius; i++) {
    const qCells = cellsOnQLine(i, radius);
    if (qCells.length > 0 && isLineFull(board, qCells)) qLines.push(i);

    const rCells = cellsOnRLine(i, radius);
    if (rCells.length > 0 && isLineFull(board, rCells)) rLines.push(i);

    const sCells = cellsOnSLine(i, radius);
    if (sCells.length > 0 && isLineFull(board, sCells)) sLines.push(i);
  }

  return { qLines, rLines, sLines };
}

export function clearLines(board: Board, lines: LineSet, radius: number = BOARD_RADIUS): Hex[] {
  const cleared: Hex[] = [];
  const clearedSet = new Set<string>();

  const addCells = (cells: Hex[]) => {
    for (const { q, r } of cells) {
      const key = hexKey(q, r);
      if (!clearedSet.has(key)) {
        clearedSet.add(key);
        cleared.push({ q, r });
      }
      board.set(key, 0);
    }
  };

  for (const q of lines.qLines) addCells(cellsOnQLine(q, radius));
  for (const r of lines.rLines) addCells(cellsOnRLine(r, radius));
  for (const s of lines.sLines) addCells(cellsOnSLine(s, radius));

  return cleared;
}

// ─── Scoring ─────────────────────────────────────────────

export function calcClearScore(lineCount: number, cellCount: number): number {
  const lineBonus = lineCount <= 1 ? 1 : lineCount;
  return cellCount * 10 * lineBonus;
}

// ─── Game-over check ─────────────────────────────────────

export function canPlaceAny(board: Board, pieces: PieceShape[], radius: number = BOARD_RADIUS): boolean {
  const cells = allCells(radius);
  for (const piece of pieces) {
    for (const { q, r } of cells) {
      if (canPlace(board, piece, q, r)) return true;
    }
  }
  return false;
}
