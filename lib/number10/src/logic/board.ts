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

/** Check if any valid rectangle selection sums to 10 */
export function hasValidMove(cells: Cell[]): boolean {
  for (let r1 = 0; r1 < ROWS; r1++) {
    for (let c1 = 0; c1 < COLS; c1++) {
      for (let r2 = r1; r2 < ROWS; r2++) {
        for (let c2 = c1; c2 < COLS; c2++) {
          const selected = getCellsInRect(cells, c1, r1, c2, r2);
          if (selected.length > 0 && checkSum(selected)) return true;
        }
      }
    }
  }
  return false;
}
