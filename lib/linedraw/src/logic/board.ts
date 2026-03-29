import {
  CELL_EMPTY,
  CELL_WALL,
  CELL_START,
  type CellType,
  type StageConfig,
  type BoardState,
} from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  const { cols, rows, walls, start } = config;
  const grid: CellType[] = new Array(cols * rows).fill(CELL_EMPTY);

  // Place walls
  for (const w of walls) {
    if (w >= 0 && w < grid.length) grid[w] = CELL_WALL;
  }

  // Place start
  grid[start] = CELL_START;

  const totalOpen = grid.filter((c) => c !== CELL_WALL).length;

  // Verify solvability — find a valid start that has a Hamiltonian path
  const validStart = findValidStart(cols, rows, grid, start);
  if (validStart !== start) {
    // Move start: restore original to CELL_EMPTY, set new start
    grid[start] = CELL_EMPTY;
    grid[validStart] = CELL_START;
  }

  return {
    cols,
    rows,
    grid,
    start: validStart,
    path: [validStart],
    totalOpen,
  };
}

// ─── Neighbors ───────────────────────────────────────────

export function getNeighbors(idx: number, cols: number, rows: number): number[] {
  const r = Math.floor(idx / cols);
  const c = idx % cols;
  const result: number[] = [];
  if (r > 0) result.push((r - 1) * cols + c);        // up
  if (r < rows - 1) result.push((r + 1) * cols + c);  // down
  if (c > 0) result.push(r * cols + (c - 1));          // left
  if (c < cols - 1) result.push(r * cols + (c + 1));   // right
  return result;
}

// ─── Move Validation ─────────────────────────────────────

export function canMove(board: BoardState, targetIdx: number): boolean {
  if (targetIdx < 0 || targetIdx >= board.grid.length) return false;
  if (board.grid[targetIdx] === CELL_WALL) return false;
  if (board.path.includes(targetIdx)) return false;

  const currentIdx = board.path[board.path.length - 1];
  const neighbors = getNeighbors(currentIdx, board.cols, board.rows);
  return neighbors.includes(targetIdx);
}

export function executeMove(board: BoardState, targetIdx: number): BoardState {
  return {
    ...board,
    path: [...board.path, targetIdx],
  };
}

// ─── Undo ────────────────────────────────────────────────

export function undoMove(board: BoardState): BoardState {
  if (board.path.length <= 1) return board; // Can't undo the start
  return {
    ...board,
    path: board.path.slice(0, -1),
  };
}

// ─── Win Check ───────────────────────────────────────────

export function isWon(board: BoardState): boolean {
  return board.path.length === board.totalOpen;
}

// ─── Solvability (DFS Hamiltonian path check) ────────────

function findValidStart(
  cols: number,
  rows: number,
  grid: CellType[],
  preferredStart: number,
): number {
  const total = grid.filter((c) => c !== CELL_WALL).length;

  // Try preferred start first
  if (hasHamiltonianPath(cols, rows, grid, preferredStart, total)) {
    return preferredStart;
  }

  // Try other positions
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === CELL_WALL) continue;
    if (i === preferredStart) continue;
    if (hasHamiltonianPath(cols, rows, grid, i, total)) {
      return i;
    }
  }

  // Fallback — should not happen with our stage configs
  return preferredStart;
}

function hasHamiltonianPath(
  cols: number,
  rows: number,
  grid: CellType[],
  start: number,
  total: number,
): boolean {
  const visited = new Set<number>();
  visited.add(start);
  return dfsHamiltonian(cols, rows, grid, start, visited, total);
}

function dfsHamiltonian(
  cols: number,
  rows: number,
  grid: CellType[],
  current: number,
  visited: Set<number>,
  total: number,
): boolean {
  if (visited.size === total) return true;

  const neighbors = getNeighbors(current, cols, rows);
  for (const n of neighbors) {
    if (grid[n] === CELL_WALL) continue;
    if (visited.has(n)) continue;

    visited.add(n);
    if (dfsHamiltonian(cols, rows, grid, n, visited, total)) {
      return true;
    }
    visited.delete(n);
  }

  return false;
}
