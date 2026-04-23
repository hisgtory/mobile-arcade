import type { Coord, BoardState, Cell, Flow, StageConfig } from '../types';

// ─── Helpers ─────────────────────────────────────────────

function coordKey(c: Coord): string {
  return `${c.row},${c.col}`;
}

function neighbors(r: number, c: number, rows: number, cols: number): Coord[] {
  const dirs: Coord[] = [];
  if (r > 0) dirs.push({ row: r - 1, col: c });
  if (r < rows - 1) dirs.push({ row: r + 1, col: c });
  if (c > 0) dirs.push({ row: r, col: c - 1 });
  if (c < cols - 1) dirs.push({ row: r, col: c + 1 });
  return dirs;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Board Creation ──────────────────────────────────────

/**
 * Generate a solvable flow puzzle by laying out random non-intersecting paths
 * that cover all cells of the grid, then exposing only endpoints.
 */
export function createBoard(config: StageConfig): BoardState {
  const { rows, cols, numFlows } = config;
  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryGenerateBoard(rows, cols, numFlows);
    if (result) return result;
  }

  // Fallback: return a simpler board
  return createFallbackBoard(rows, cols, numFlows);
}

function tryGenerateBoard(
  rows: number,
  cols: number,
  numFlows: number,
): BoardState | null {
  const totalCells = rows * cols;
  const used = new Set<string>();
  const paths: { colorIndex: number; coords: Coord[] }[] = [];

  // Calculate minimum path length to fill all cells
  const minPathLen = Math.max(2, Math.floor(totalCells / numFlows) - 1);
  const maxPathLen = Math.ceil(totalCells / numFlows) + 2;

  for (let f = 0; f < numFlows; f++) {
    // Find a random starting cell that's not used
    let start: Coord | null = null;
    const candidates = shuffle(
      Array.from({ length: totalCells }, (_, i) => ({
        row: Math.floor(i / cols),
        col: i % cols,
      })).filter((c) => !used.has(coordKey(c))),
    );

    // Prefer starting from edges or near used cells for better coverage
    start = candidates[0] ?? null;
    if (!start) return null;

    // Random walk from start
    const path: Coord[] = [start];
    used.add(coordKey(start));

    const targetLen =
      f === numFlows - 1
        ? totalCells - used.size + 1 // Last flow fills remaining
        : minPathLen + Math.floor(Math.random() * (maxPathLen - minPathLen + 1));

    for (let step = 1; step < targetLen; step++) {
      const current = path[path.length - 1];
      const nextCandidates = shuffle(
        neighbors(current.row, current.col, rows, cols).filter(
          (n) => !used.has(coordKey(n)),
        ),
      );

      if (nextCandidates.length === 0) break;

      // Prefer candidates that don't cut off empty cells
      let chosen = nextCandidates[0];
      for (const nc of nextCandidates) {
        if (!wouldCreateDeadEnd(nc, used, rows, cols, path)) {
          chosen = nc;
          break;
        }
      }

      path.push(chosen);
      used.add(coordKey(chosen));
    }

    if (path.length < 2) return null;

    paths.push({ colorIndex: f, coords: path });
  }

  // Require at least 70% grid coverage to ensure puzzles feel substantial
  // (lower coverage creates too many disconnected empty cells)
  if (used.size < totalCells * 0.7) return null;

  // Build board state
  const grid = createEmptyGrid(rows, cols);
  const flows: Flow[] = [];
  const playerPaths = new Map<number, Coord[]>();

  for (const p of paths) {
    const start = p.coords[0];
    const end = p.coords[p.coords.length - 1];
    flows.push({
      colorIndex: p.colorIndex,
      endpoints: [start, end],
    });

    // Mark endpoints in grid
    grid[start.row][start.col] = { colorIndex: p.colorIndex, isEndpoint: true };
    grid[end.row][end.col] = { colorIndex: p.colorIndex, isEndpoint: true };

    // Initialize empty player paths
    playerPaths.set(p.colorIndex, []);
  }

  return { rows, cols, flows, grid, paths: playerPaths };
}

function wouldCreateDeadEnd(
  candidate: Coord,
  used: Set<string>,
  rows: number,
  cols: number,
  currentPath: Coord[],
): boolean {
  // Quick check: would adding this cell isolate any adjacent unused cell?
  const tempUsed = new Set(used);
  tempUsed.add(coordKey(candidate));

  for (const n of neighbors(candidate.row, candidate.col, rows, cols)) {
    if (tempUsed.has(coordKey(n))) continue;
    // Check if this neighbor still has at least one other free neighbor
    const freeNeighbors = neighbors(n.row, n.col, rows, cols).filter(
      (nn) =>
        !tempUsed.has(coordKey(nn)) ||
        coordKey(nn) === coordKey(currentPath[currentPath.length - 1]),
    );
    if (freeNeighbors.length === 0) return true;
  }
  return false;
}

function createEmptyGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ colorIndex: -1, isEndpoint: false })),
  );
}

function createFallbackBoard(
  rows: number,
  cols: number,
  numFlows: number,
): BoardState {
  // Simple snake-pattern board generation as fallback
  const grid = createEmptyGrid(rows, cols);
  const flows: Flow[] = [];
  const playerPaths = new Map<number, Coord[]>();

  // Generate snake paths through the grid
  const cells: Coord[] = [];
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < cols; c++) cells.push({ row: r, col: c });
    } else {
      for (let c = cols - 1; c >= 0; c--) cells.push({ row: r, col: c });
    }
  }

  const totalCells = cells.length;
  // Ensure each flow has at least 2 cells (start and end)
  const safeNumFlows = Math.max(1, Math.min(numFlows, Math.floor(totalCells / 2)));
  const segmentLen = Math.floor(totalCells / safeNumFlows);

  for (let f = 0; f < safeNumFlows; f++) {
    const startIdx = f * segmentLen;
    const endIdx = f === safeNumFlows - 1 ? totalCells - 1 : (f + 1) * segmentLen - 1;
    const start = cells[startIdx];
    const end = cells[endIdx];

    flows.push({ colorIndex: f, endpoints: [start, end] });
    grid[start.row][start.col] = { colorIndex: f, isEndpoint: true };
    grid[end.row][end.col] = { colorIndex: f, isEndpoint: true };
    playerPaths.set(f, []);
  }

  return { rows, cols, flows, grid, paths: playerPaths };
}

// ─── Game Logic ──────────────────────────────────────────

/** Check if a coordinate is adjacent to another */
export function isAdjacent(a: Coord, b: Coord): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/** Check if a cell is an endpoint for a given flow */
export function isEndpoint(board: BoardState, coord: Coord, colorIndex: number): boolean {
  const flow = board.flows.find((f) => f.colorIndex === colorIndex);
  if (!flow) return false;
  return (
    (flow.endpoints[0].row === coord.row && flow.endpoints[0].col === coord.col) ||
    (flow.endpoints[1].row === coord.row && flow.endpoints[1].col === coord.col)
  );
}

/** Check if a flow is complete (path connects both endpoints) */
export function isFlowComplete(board: BoardState, colorIndex: number): boolean {
  const flow = board.flows.find((f) => f.colorIndex === colorIndex);
  if (!flow) return false;

  const path = board.paths.get(colorIndex);
  if (!path || path.length < 2) return false;

  const first = path[0];
  const last = path[path.length - 1];
  const ep0 = flow.endpoints[0];
  const ep1 = flow.endpoints[1];

  return (
    ((first.row === ep0.row && first.col === ep0.col && last.row === ep1.row && last.col === ep1.col) ||
      (first.row === ep1.row && first.col === ep1.col && last.row === ep0.row && last.col === ep0.col))
  );
}

/** Get the number of cells covered by all paths */
export function getCoveredCount(board: BoardState): number {
  const covered = new Set<string>();
  for (const [, path] of board.paths) {
    for (const c of path) {
      covered.add(coordKey(c));
    }
  }
  return covered.size;
}

/** Check if all flows are complete and all cells are covered */
export function isWon(board: BoardState): boolean {
  // All flows must be connected
  for (const flow of board.flows) {
    if (!isFlowComplete(board, flow.colorIndex)) return false;
  }
  // Original Flow Free requirement: all cells must be covered
  return getCoveredCount(board) === board.rows * board.cols;
}

/** Get total pipe coverage percentage */
export function getCoveragePercent(board: BoardState): number {
  const total = board.rows * board.cols;
  return Math.round((getCoveredCount(board) / total) * 100);
}

/** Check if a cell is occupied by any flow's path (excluding specified color) */
export function isCellOccupied(
  board: BoardState,
  coord: Coord,
  excludeColor?: number,
): number | null {
  for (const [colorIndex, path] of board.paths) {
    if (colorIndex === excludeColor) continue;
    for (const c of path) {
      if (c.row === coord.row && c.col === coord.col) return colorIndex;
    }
  }
  return null;
}
