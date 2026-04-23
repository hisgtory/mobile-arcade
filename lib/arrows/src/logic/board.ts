import { Dir, DIR_DELTA, type Cell, type BoardState, type StageConfig } from '../types';

// ─── Hamiltonian Path Generation ─────────────────────────

/**
 * Generate a random Hamiltonian path on a rows×cols grid using
 * backtracking with randomized neighbor ordering.
 * Returns array of [row, col] pairs in path order.
 */
function generateHamiltonianPath(
  rows: number,
  cols: number,
): [number, number][] | null {
  const total = rows * cols;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const path: [number, number][] = [];

  // Random start position
  const startR = Math.floor(Math.random() * rows);
  const startC = Math.floor(Math.random() * cols);

  function getNeighbors(r: number, c: number): [number, number][] {
    const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const result: [number, number][] = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        result.push([nr, nc]);
      }
    }
    // Shuffle neighbors for randomness
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Warnsdorff's heuristic: pick neighbor with fewest onward moves
  function getNeighborsSorted(r: number, c: number): [number, number][] {
    const neighbors = getNeighbors(r, c);
    neighbors.sort((a, b) => {
      // Temporary mark a as visited to get accurate degree for b
      visited[a[0]][a[1]] = true;
      const countA = getNeighbors(a[0], a[1]).length;
      visited[a[0]][a[1]] = false;

      visited[b[0]][b[1]] = true;
      const countB = getNeighbors(b[0], b[1]).length;
      visited[b[0]][b[1]] = false;

      return countA - countB;
    });

    // Add small randomness: swap equal-degree neighbors
    for (let i = 0; i < neighbors.length - 1; i++) {
      const ni = neighbors[i], nj = neighbors[i + 1];
      
      visited[ni[0]][ni[1]] = true;
      const ci = getNeighbors(ni[0], ni[1]).length;
      visited[ni[0]][ni[1]] = false;

      visited[nj[0]][nj[1]] = true;
      const cj = getNeighbors(nj[0], nj[1]).length;
      visited[nj[0]][nj[1]] = false;

      if (ci === cj && Math.random() < 0.3) {
        [neighbors[i], neighbors[i + 1]] = [neighbors[i + 1], neighbors[i]];
      }
    }
    return neighbors;
  }

  function backtrack(r: number, c: number): boolean {
    visited[r][c] = true;
    path.push([r, c]);

    if (path.length === total) return true;

    const neighbors = getNeighborsSorted(r, c);
    for (const [nr, nc] of neighbors) {
      if (backtrack(nr, nc)) return true;
    }

    visited[r][c] = false;
    path.pop();
    return false;
  }

  if (backtrack(startR, startC)) return path;
  return null;
}

/**
 * Determine arrow direction from one cell to the next in a path.
 */
function dirFromDelta(dr: number, dc: number): Dir {
  if (dr === -1 && dc === 0) return Dir.UP;
  if (dr === 1 && dc === 0) return Dir.DOWN;
  if (dr === 0 && dc === 1) return Dir.RIGHT;
  return Dir.LEFT;
}

// ─── Board Creation ──────────────────────────────────────

const MAX_BOARD_GENERATION_ATTEMPTS = 200;

export function createBoard(config: StageConfig): BoardState {
  const { rows, cols, fixedRatio } = config;

  for (let attempt = 0; attempt < MAX_BOARD_GENERATION_ATTEMPTS; attempt++) {
    const path = generateHamiltonianPath(rows, cols);
    if (!path) continue;

    // Build cells from path
    const cells: Cell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        dir: Dir.RIGHT,
        fixed: false,
      })),
    );

    // Set correct arrow directions based on path
    const solutionDirs: Dir[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(Dir.RIGHT),
    );

    for (let i = 0; i < path.length - 1; i++) {
      const [r, c] = path[i];
      const [nr, nc] = path[i + 1];
      const dir = dirFromDelta(nr - r, nc - c);
      solutionDirs[r][c] = dir;
      cells[r][c].dir = dir;
    }
    // Last cell — direction doesn't matter, but make it fixed so user doesn't have to guess
    const lastCell = path[path.length - 1];
    const lastDir = Math.floor(Math.random() * 4) as Dir;
    solutionDirs[lastCell[0]][lastCell[1]] = lastDir;
    cells[lastCell[0]][lastCell[1]].dir = lastDir;
    cells[lastCell[0]][lastCell[1]].fixed = true;

    // Determine which cells to fix
    const total = rows * cols;
    const fixedCount = Math.max(1, Math.floor(total * fixedRatio));

    // Always fix the start cell
    const startRow = path[0][0];
    const startCol = path[0][1];
    cells[startRow][startCol].fixed = true;

    // Fix additional cells randomly (excluding start and end)
    const indices: number[] = [];
    for (let i = 1; i < total - 1; i++) {
      const [r, c] = path[i];
      indices.push(r * cols + c);
    }
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Fix up to fixedCount - 2 more cells (start and end already fixed)
    for (let i = 0; i < Math.min(fixedCount - 2, indices.length); i++) {
      const idx = indices[i];
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      cells[r][c].fixed = true;
    }

    // Scramble non-fixed arrows (rotate randomly)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!cells[r][c].fixed) {
          const rotations = Math.floor(Math.random() * 3) + 1; // 1-3 rotations
          cells[r][c].dir = ((solutionDirs[r][c] + rotations) % 4) as Dir;
        }
      }
    }

    return { rows, cols, cells, startRow, startCol };
  }

  // Graceful fallback for emergency
  return createEmergencyBoard();
}

function createEmergencyBoard(): BoardState {
  const rows = 3;
  const cols = 3;
  const cells: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      dir: Dir.RIGHT,
      fixed: true,
    })),
  );
  // Simple snake path 3x3
  cells[0][0].dir = Dir.RIGHT;
  cells[0][1].dir = Dir.RIGHT;
  cells[0][2].dir = Dir.DOWN;
  cells[1][2].dir = Dir.LEFT;
  cells[1][1].dir = Dir.LEFT;
  cells[1][0].dir = Dir.DOWN;
  cells[2][0].dir = Dir.RIGHT;
  cells[2][1].dir = Dir.RIGHT;
  cells[2][2].dir = Dir.UP;
  
  // Make some unfixed and scramble
  cells[0][1].fixed = false;
  cells[0][1].dir = Dir.UP;

  return { rows, cols, cells, startRow: 0, startCol: 0 };
}

// ─── Path Tracing ────────────────────────────────────────

/**
 * Trace the path from start following arrows.
 * Returns array of [row, col] visited cells in order.
 * Stops when:
 * - Out of bounds
 * - Already visited cell
 * - All cells visited (success!)
 */
export function tracePath(board: BoardState): [number, number][] {
  const { rows, cols, cells, startRow, startCol } = board;
  const total = rows * cols;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const path: [number, number][] = [];

  let r = startRow;
  let c = startCol;

  while (true) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) break;
    if (visited[r][c]) break;

    visited[r][c] = true;
    path.push([r, c]);

    if (path.length === total) break; // All cells visited!

    const dir = cells[r][c].dir;
    const delta = DIR_DELTA[dir];
    r += delta.dr;
    c += delta.dc;
  }

  return path;
}

/**
 * Check if the current board configuration is solved.
 */
export function isSolved(board: BoardState): boolean {
  const total = board.rows * board.cols;
  const path = tracePath(board);
  return path.length === total;
}

// ─── Arrow Rotation ──────────────────────────────────────

/**
 * Rotate an arrow 90° clockwise.
 */
export function rotateArrow(board: BoardState, row: number, col: number): boolean {
  const cell = board.cells[row][col];
  if (cell.fixed) return false;
  cell.dir = ((cell.dir + 1) % 4) as Dir;
  return true;
}
