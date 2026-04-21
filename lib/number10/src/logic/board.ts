import { COLS, ROWS, type Cell } from '../types';

export function createGrid(): Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({
        value: Math.floor(Math.random() * 9) + 1, // 1-9
        col,
        row,
      });
    }
  }
  return cells;
}

/** Get cells within a rectangle selection (inclusive) */
export function getCellsInRect(
  cells: Cell[],
  c1: number, r1: number,
  c2: number, r2: number,
): Cell[] {
  const minC = Math.min(c1, c2);
  const maxC = Math.max(c1, c2);
  const minR = Math.min(r1, r2);
  const maxR = Math.max(r1, r2);

  return cells.filter(
    (cell) =>
      cell.value > 0 &&
      cell.col >= minC && cell.col <= maxC &&
      cell.row >= minR && cell.row <= maxR,
  );
}

/** Check if selected cells sum to 10 */
export function checkSum(selected: Cell[]): boolean {
  if (selected.length === 0) return false;
  const sum = selected.reduce((acc, c) => acc + c.value, 0);
  return sum === 10;
}

/** Clear cells (set value to 0) and return count cleared */
export function clearCells(cells: Cell[], toClear: Cell[]): number {
  const clearSet = new Set(toClear.map((c) => `${c.col},${c.row}`));
  let count = 0;
  for (const cell of cells) {
    if (clearSet.has(`${cell.col},${cell.row}`)) {
      cell.value = 0;
      count++;
    }
  }
  return count;
}

/** Count remaining non-zero cells */
export function remainingCount(cells: Cell[]): number {
  return cells.filter((c) => c.value > 0).length;
}

/** Check if any valid rectangle selection sums to 10 (prefix-sum optimized) */
export function hasValidMove(cells: Cell[]): boolean {
  // Build 2D grid for O(1) rectangle sum queries
  const grid: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  for (const c of cells) {
    if (c.value > 0) grid[c.row][c.col] = c.value;
  }

  // 2D prefix sum
  const ps: number[][] = Array.from({ length: ROWS + 1 }, () => Array(COLS + 1).fill(0));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ps[r + 1][c + 1] = grid[r][c] + ps[r][c + 1] + ps[r + 1][c] - ps[r][c];
    }
  }

  const rectSum = (r1: number, c1: number, r2: number, c2: number): number =>
    ps[r2 + 1][c2 + 1] - ps[r1][c2 + 1] - ps[r2 + 1][c1] + ps[r1][c1];

  // Check all rectangles with O(1) sum lookup
  for (let r1 = 0; r1 < ROWS; r1++) {
    for (let c1 = 0; c1 < COLS; c1++) {
      for (let r2 = r1; r2 < ROWS; r2++) {
        for (let c2 = c1; c2 < COLS; c2++) {
          const s = rectSum(r1, c1, r2, c2);
          if (s === 10) return true;
          if (s > 10) break; // wider rects only add more, prune
        }
      }
    }
  }
  return false;
}
