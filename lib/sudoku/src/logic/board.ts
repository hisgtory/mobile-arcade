import {
  GRID_SIZE,
  BOX_SIZE,
  DIFFICULTY_CONFIGS,
  type Difficulty,
  type CellValue,
  type Cell,
  type Grid,
  type BoardState,
} from '../types';

// ─── Helpers ─────────────────────────────────────────────

function createEmptyRaw(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < GRID_SIZE; c++) {
    if (grid[row][c] === num) return false;
  }
  // Check column
  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r][col] === num) return false;
  }
  // Check box
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

// ─── Solver (backtracking) ───────────────────────────────

function solve(grid: number[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) {
        // Randomize order for generation
        const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (isValidPlacement(grid, r, c, n)) {
            grid[r][c] = n;
            if (solve(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true; // all cells filled
}

/** Solve without randomization — for validation */
function solveOrdered(grid: number[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) {
        for (let n = 1; n <= 9; n++) {
          if (isValidPlacement(grid, r, c, n)) {
            grid[r][c] = n;
            if (solveOrdered(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/** Count solutions (stop at 2) */
function countSolutions(grid: number[][], limit = 2): number {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) {
        let count = 0;
        for (let n = 1; n <= 9; n++) {
          if (isValidPlacement(grid, r, c, n)) {
            grid[r][c] = n;
            count += countSolutions(grid, limit - count);
            grid[r][c] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1; // solution found
}

// ─── Generator ───────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateFullGrid(): number[][] {
  const grid = createEmptyRaw();
  solve(grid);
  return grid;
}

function removeCells(solution: number[][], removals: number): number[][] {
  const puzzle = solution.map(row => [...row]);
  const positions = shuffleArray(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= removals) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    // Ensure unique solution
    const test = puzzle.map(row => [...row]);
    if (countSolutions(test) === 1) {
      removed++;
    } else {
      puzzle[r][c] = backup; // restore
    }
  }

  return puzzle;
}

// ─── Board Creation ──────────────────────────────────────

export function createBoard(difficulty: Difficulty): BoardState {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const solution = generateFullGrid();
  const puzzle = removeCells(solution, config.removals);

  const grid: Grid = puzzle.map((row, r) =>
    row.map((val, c) => ({
      value: val as CellValue,
      given: val !== 0,
      notes: new Set<number>(),
      error: false,
    }))
  );

  return {
    grid,
    solution,
    difficulty,
    mistakes: 0,
    maxMistakes: 3,
  };
}

// ─── Validation ──────────────────────────────────────────

/** Check if placing `num` at (row,col) conflicts with any other cell */
export function hasConflict(grid: Grid, row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && grid[row][c].value === num) return true;
  }
  // Check column
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && grid[r][col].value === num) return true;
  }
  // Check box
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (r !== row || c !== col) {
        if (grid[r][c].value === num) return true;
      }
    }
  }
  return false;
}

/** Place a number — returns whether it was correct */
export function placeNumber(board: BoardState, row: number, col: number, num: number): boolean {
  const cell = board.grid[row][col];
  if (cell.given) return true; // cannot modify givens

  const isCorrect = board.solution[row][col] === num;

  cell.value = num as CellValue;
  cell.notes.clear();
  cell.error = !isCorrect;

  if (!isCorrect) {
    board.mistakes++;
  }

  // Auto-remove conflicting notes from peers
  if (isCorrect) {
    removeNoteFromPeers(board.grid, row, col, num);
  }

  return isCorrect;
}

/** Remove a note value from all peers of (row,col) */
function removeNoteFromPeers(grid: Grid, row: number, col: number, num: number): void {
  // Row
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col) grid[row][c].notes.delete(num);
  }
  // Col
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row) grid[r][col].notes.delete(num);
  }
  // Box
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (r !== row || c !== col) {
        grid[r][c].notes.delete(num);
      }
    }
  }
}

/** Toggle a pencil note */
export function toggleNote(board: BoardState, row: number, col: number, num: number): void {
  const cell = board.grid[row][col];
  if (cell.given || cell.value !== 0) return;

  if (cell.notes.has(num)) {
    cell.notes.delete(num);
  } else {
    cell.notes.add(num);
  }
}

/** Erase a cell */
export function eraseCell(board: BoardState, row: number, col: number): void {
  const cell = board.grid[row][col];
  if (cell.given) return;
  cell.value = 0;
  cell.notes.clear();
  cell.error = false;
}

// ─── Win Check ───────────────────────────────────────────

export function isComplete(board: BoardState): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board.grid[r][c].value !== board.solution[r][c]) return false;
    }
  }
  return true;
}

export function isGameOver(board: BoardState): boolean {
  return board.mistakes >= board.maxMistakes;
}

// ─── Hint ────────────────────────────────────────────────

/** Reveal one random empty cell. Returns the position or null if no empty cells. */
export function getHint(board: BoardState): { row: number; col: number } | null {
  const emptyCells: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = board.grid[r][c];
      if (!cell.given && cell.value !== board.solution[r][c]) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

/** Get remaining count per number (1-9). Returns map of num -> remaining */
export function getNumberCounts(board: BoardState): Map<number, number> {
  const counts = new Map<number, number>();
  for (let n = 1; n <= 9; n++) counts.set(n, 9); // start at max

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const v = board.grid[r][c].value;
      if (v !== 0 && board.grid[r][c].value === board.solution[r][c]) {
        counts.set(v, (counts.get(v) ?? 9) - 1);
      }
    }
  }
  return counts;
}
