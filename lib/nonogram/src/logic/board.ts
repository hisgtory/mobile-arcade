import { CellState, type BoardState, type PuzzleDef, type Clues } from '../types';

// ─── Clue Computation ────────────────────────────────────

export function computeClues(solution: number[][]): Clues {
  const rows = solution.length;
  const cols = solution[0].length;

  const rowClues: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const clue: number[] = [];
    let run = 0;
    for (let c = 0; c < cols; c++) {
      if (solution[r][c] === 1) {
        run++;
      } else {
        if (run > 0) clue.push(run);
        run = 0;
      }
    }
    if (run > 0) clue.push(run);
    rowClues.push(clue.length > 0 ? clue : [0]);
  }

  const colClues: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const clue: number[] = [];
    let run = 0;
    for (let r = 0; r < rows; r++) {
      if (solution[r][c] === 1) {
        run++;
      } else {
        if (run > 0) clue.push(run);
        run = 0;
      }
    }
    if (run > 0) clue.push(run);
    colClues.push(clue.length > 0 ? clue : [0]);
  }

  return { rowClues, colClues };
}

// ─── Board Creation ──────────────────────────────────────

export function createBoard(puzzle: PuzzleDef): BoardState {
  const grid: CellState[][] = [];
  for (let r = 0; r < puzzle.rows; r++) {
    grid.push(new Array(puzzle.cols).fill(CellState.EMPTY));
  }
  const clues = computeClues(puzzle.solution);
  return { grid, puzzle, clues };
}

// ─── Cell Toggle ─────────────────────────────────────────

/** Cycle: EMPTY → FILLED → MARKED → EMPTY */
export function toggleCell(grid: CellState[][], row: number, col: number): CellState[][] {
  const newGrid = grid.map((r) => [...r]);
  const current = newGrid[row][col];
  if (current === CellState.EMPTY) {
    newGrid[row][col] = CellState.FILLED;
  } else if (current === CellState.FILLED) {
    newGrid[row][col] = CellState.MARKED;
  } else {
    newGrid[row][col] = CellState.EMPTY;
  }
  return newGrid;
}

/** Direct fill: set cell to FILLED if empty */
export function fillCell(grid: CellState[][], row: number, col: number): CellState[][] {
  const newGrid = grid.map((r) => [...r]);
  if (newGrid[row][col] === CellState.EMPTY) {
    newGrid[row][col] = CellState.FILLED;
  }
  return newGrid;
}

/** Direct mark: set cell to MARKED if empty */
export function markCell(grid: CellState[][], row: number, col: number): CellState[][] {
  const newGrid = grid.map((r) => [...r]);
  if (newGrid[row][col] === CellState.EMPTY) {
    newGrid[row][col] = CellState.MARKED;
  }
  return newGrid;
}

// ─── Line Check ──────────────────────────────────────────

/** Check if a row's filled cells match the clue */
export function isRowComplete(grid: CellState[][], row: number, clue: number[]): boolean {
  const cols = grid[row].length;
  const runs: number[] = [];
  let run = 0;
  for (let c = 0; c < cols; c++) {
    if (grid[row][c] === CellState.FILLED) {
      run++;
    } else {
      if (run > 0) runs.push(run);
      run = 0;
    }
  }
  if (run > 0) runs.push(run);
  if (runs.length === 0) runs.push(0);

  if (runs.length !== clue.length) return false;
  return runs.every((v, i) => v === clue[i]);
}

/** Check if a col's filled cells match the clue */
export function isColComplete(grid: CellState[][], col: number, clue: number[]): boolean {
  const rows = grid.length;
  const runs: number[] = [];
  let run = 0;
  for (let r = 0; r < rows; r++) {
    if (grid[r][col] === CellState.FILLED) {
      run++;
    } else {
      if (run > 0) runs.push(run);
      run = 0;
    }
  }
  if (run > 0) runs.push(run);
  if (runs.length === 0) runs.push(0);

  if (runs.length !== clue.length) return false;
  return runs.every((v, i) => v === clue[i]);
}

// ─── Win Check ───────────────────────────────────────────

export function isWon(board: BoardState): boolean {
  const { grid, puzzle } = board;
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const isFilled = grid[r][c] === CellState.FILLED;
      const shouldBeFilled = puzzle.solution[r][c] === 1;
      if (isFilled !== shouldBeFilled) return false;
    }
  }
  return true;
}

// ─── Error Check ─────────────────────────────────────────

export function hasErrors(board: BoardState): { row: number; col: number }[] {
  const errors: { row: number; col: number }[] = [];
  const { grid, puzzle } = board;
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (grid[r][c] === CellState.FILLED && puzzle.solution[r][c] === 0) {
        errors.push({ row: r, col: c });
      }
    }
  }
  return errors;
}
