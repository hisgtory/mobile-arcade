import { ERASE_THRESHOLD } from '../types';

/**
 * Tracks erased pixels in the target area using a grid-based approach.
 * Each cell represents a small region; when the eraser passes over it,
 * the cell is marked as erased.
 */

const GRID_RESOLUTION = 20; // 20x20 grid for the target area

export interface EraseGrid {
  cells: boolean[][];
  cols: number;
  rows: number;
}

export function createEraseGrid(): EraseGrid {
  const cells: boolean[][] = [];
  for (let r = 0; r < GRID_RESOLUTION; r++) {
    cells.push(new Array(GRID_RESOLUTION).fill(false));
  }
  return { cells, cols: GRID_RESOLUTION, rows: GRID_RESOLUTION };
}

/**
 * Mark cells as erased given a circular eraser at (ex, ey) with radius er.
 * All coordinates are in the target area's local space (0 to targetW, 0 to targetH).
 */
export function eraseAt(
  grid: EraseGrid,
  ex: number,
  ey: number,
  er: number,
  targetW: number,
  targetH: number,
): void {
  const cellW = targetW / grid.cols;
  const cellH = targetH / grid.rows;

  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (grid.cells[r][c]) continue;
      const cx = (c + 0.5) * cellW;
      const cy = (r + 0.5) * cellH;
      const dx = cx - ex;
      const dy = cy - ey;
      if (dx * dx + dy * dy <= er * er) {
        grid.cells[r][c] = true;
      }
    }
  }
}

/** Returns fraction of cells erased (0 to 1) */
export function getErasePercent(grid: EraseGrid): number {
  let erased = 0;
  let total = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      total++;
      if (grid.cells[r][c]) erased++;
    }
  }
  return total === 0 ? 0 : erased / total;
}

/** Check if enough of the target has been erased */
export function isSolved(grid: EraseGrid): boolean {
  return getErasePercent(grid) >= ERASE_THRESHOLD;
}
