import { type DesignConfig, type BoardState, type CellState } from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(design: DesignConfig): BoardState {
  let totalCells = 0;
  const cells: CellState[][] = [];

  for (let r = 0; r < design.rows; r++) {
    const row: CellState[] = [];
    for (let c = 0; c < design.cols; c++) {
      const targetColor = design.grid[r][c];
      if (targetColor > 0) totalCells++;
      row.push({ targetColor, filled: false });
    }
    cells.push(row);
  }

  return {
    cells,
    cols: design.cols,
    rows: design.rows,
    numColors: design.numColors,
    totalCells,
    filledCells: 0,
  };
}

// ─── Fill Cell ───────────────────────────────────────────

export function fillCell(
  board: BoardState,
  row: number,
  col: number,
  selectedColor: number,
): { correct: boolean; alreadyFilled: boolean } {
  const cell = board.cells[row][col];

  if (cell.targetColor === 0) return { correct: false, alreadyFilled: false };
  if (cell.filled) return { correct: false, alreadyFilled: true };

  if (cell.targetColor === selectedColor) {
    cell.filled = true;
    board.filledCells++;
    return { correct: true, alreadyFilled: false };
  }

  return { correct: false, alreadyFilled: false };
}

// ─── Win Check ───────────────────────────────────────────

export function isComplete(board: BoardState): boolean {
  return board.filledCells === board.totalCells;
}

// ─── Get remaining cells for a specific color ────────────

export function getRemainingForColor(board: BoardState, colorIdx: number): number {
  let count = 0;
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const cell = board.cells[r][c];
      if (cell.targetColor === colorIdx && !cell.filled) count++;
    }
  }
  return count;
}

// ─── Get all used colors in the design ───────────────────

export function getUsedColors(board: BoardState): number[] {
  const colors = new Set<number>();
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const t = board.cells[r][c].targetColor;
      if (t > 0) colors.add(t);
    }
  }
  return Array.from(colors).sort((a, b) => a - b);
}

// ─── Progress percentage ─────────────────────────────────

export function getProgress(board: BoardState): number {
  if (board.totalCells === 0) return 100;
  return Math.round((board.filledCells / board.totalCells) * 100);
}
