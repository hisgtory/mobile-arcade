/**
 * Board logic for Woodoku
 *
 * 9×9 grid with 3×3 sub-grid regions.
 * Place pieces, clear full rows, columns, or 3×3 regions.
 * board[row][col] = 0 (empty) or hex color (filled)
 */

import { GRID_SIZE, REGION_SIZE, type PieceShape } from '../types';

export type Board = number[][];

export function createBoard(): Board {
  return Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
}

/** Check if a piece can be placed at (startRow, startCol) */
export function canPlace(board: Board, piece: PieceShape, startRow: number, startCol: number): boolean {
  for (const cell of piece.cells) {
    const r = startRow + cell.row;
    const c = startCol + cell.col;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (board[r][c] !== 0) return false;
  }
  return true;
}

/** Place a piece on the board. Returns placed cell positions. */
export function placePiece(
  board: Board,
  piece: PieceShape,
  startRow: number,
  startCol: number,
): { row: number; col: number }[] {
  const placed: { row: number; col: number }[] = [];
  for (const cell of piece.cells) {
    const r = startRow + cell.row;
    const c = startCol + cell.col;
    board[r][c] = piece.color;
    placed.push({ row: r, col: c });
  }
  return placed;
}

/** Find full rows, columns, and 3×3 regions. Returns indices to clear. */
export function findFullLines(board: Board): { rows: number[]; cols: number[]; regions: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];
  const regions: number[] = [];

  // Check rows
  for (let r = 0; r < GRID_SIZE; r++) {
    if (board[r].every((cell) => cell !== 0)) {
      rows.push(r);
    }
  }

  // Check columns
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (board[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }

  // Check 3×3 regions (9 total: 3 rows × 3 cols of regions)
  for (let regionIdx = 0; regionIdx < 9; regionIdx++) {
    const regionRow = Math.floor(regionIdx / 3) * REGION_SIZE;
    const regionCol = (regionIdx % 3) * REGION_SIZE;
    let full = true;
    for (let r = regionRow; r < regionRow + REGION_SIZE; r++) {
      for (let c = regionCol; c < regionCol + REGION_SIZE; c++) {
        if (board[r][c] === 0) {
          full = false;
          break;
        }
      }
      if (!full) break;
    }
    if (full) regions.push(regionIdx);
  }

  return { rows, cols, regions };
}

/** Clear full rows, columns, and regions. Returns cells that were cleared. */
export function clearLines(
  board: Board,
  lines: { rows: number[]; cols: number[]; regions: number[] },
): { row: number; col: number }[] {
  const clearedSet = new Set<string>();
  const cleared: { row: number; col: number }[] = [];

  const addCell = (r: number, c: number) => {
    const key = `${r},${c}`;
    if (!clearedSet.has(key)) {
      clearedSet.add(key);
      cleared.push({ row: r, col: c });
    }
  };

  for (const r of lines.rows) {
    for (let c = 0; c < GRID_SIZE; c++) {
      addCell(r, c);
    }
  }

  for (const c of lines.cols) {
    for (let r = 0; r < GRID_SIZE; r++) {
      addCell(r, c);
    }
  }

  for (const regionIdx of lines.regions) {
    const regionRow = Math.floor(regionIdx / 3) * REGION_SIZE;
    const regionCol = (regionIdx % 3) * REGION_SIZE;
    for (let r = regionRow; r < regionRow + REGION_SIZE; r++) {
      for (let c = regionCol; c < regionCol + REGION_SIZE; c++) {
        addCell(r, c);
      }
    }
  }

  // Actually clear the board
  for (const { row, col } of cleared) {
    board[row][col] = 0;
  }

  return cleared;
}

/** Calculate score for clearing lines/regions */
export function calcClearScore(lineCount: number, cellCount: number): number {
  const lineBonus = lineCount <= 1 ? 1 : lineCount;
  return cellCount * 10 * lineBonus;
}

/** Check if any of the given pieces can be placed anywhere on the board */
export function canPlaceAny(board: Board, pieces: PieceShape[]): boolean {
  for (const piece of pieces) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlace(board, piece, r, c)) return true;
      }
    }
  }
  return false;
}
