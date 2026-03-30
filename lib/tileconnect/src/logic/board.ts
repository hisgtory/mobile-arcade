import type { TileType, TileData, StageConfig, PathPoint } from '../types';

// --- Board generation ---

export function generateBoard(config: StageConfig): TileData[] {
  const { rows, cols, typeCount } = config;
  const total = rows * cols;

  if (total % 2 !== 0 || total % typeCount !== 0 || (total / typeCount) % 2 !== 0) {
    throw new Error(
      `Invalid stage config: ${total} tiles with ${typeCount} types — total must be even, divisible by typeCount, and each type must have an even count`,
    );
  }

  const perType = total / typeCount;

  // Fill type pool with even counts
  const pool: TileType[] = [];
  for (let t = 0; t < typeCount; t++) {
    for (let i = 0; i < perType; i++) {
      pool.push(t);
    }
  }

  // Shuffle pool (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Place onto grid
  const tiles: TileData[] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({ type: pool[idx], row: r, col: c });
      idx++;
    }
  }
  return tiles;
}

// --- Board 2D array helpers ---

export function tilesToBoard(
  tiles: TileData[],
  rows: number,
  cols: number,
): (TileType | null)[][] {
  const board: (TileType | null)[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(null),
  );
  for (const t of tiles) {
    board[t.row][t.col] = t.type;
  }
  return board;
}

// --- Path-finding algorithm ---

function isEmptyOrBorder(
  board: (TileType | null)[][],
  row: number,
  col: number,
  rows: number,
  cols: number,
): boolean {
  if (row < 0 || row >= rows || col < 0 || col >= cols) return true; // border
  return board[row][col] === null;
}

function canWalkLine(
  board: (TileType | null)[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  rows: number,
  cols: number,
): boolean {
  if (r1 === r2) {
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    for (let c = minC + 1; c < maxC; c++) {
      if (!isEmptyOrBorder(board, r1, c, rows, cols)) return false;
    }
    return true;
  }
  if (c1 === c2) {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    for (let r = minR + 1; r < maxR; r++) {
      if (!isEmptyOrBorder(board, r, c1, rows, cols)) return false;
    }
    return true;
  }
  return false;
}

/**
 * Find a connecting path between two tiles of the same type.
 *
 * The path can have at most 2 bends (turns). It may travel through:
 *   - Empty cells (null) on the board
 *   - A virtual border ring outside the board (row/col = -1 or rows/cols)
 *
 * Strategy:
 *   1. Try direct line (0 bends)
 *   2. Try L-shape via one corner point (1 bend)
 *   3. Scan every row/col (including border) for a Z/U-shape (2 bends)
 *
 * Returns the path as an array of PathPoints, or null if no valid path exists.
 */
export function findPath(
  board: (TileType | null)[][],
  rows: number,
  cols: number,
  a: PathPoint,
  b: PathPoint,
): PathPoint[] | null {
  // Same tile position check
  if (a.row === b.row && a.col === b.col) return null;

  // Must be same type
  if (board[a.row]?.[a.col] == null || board[b.row]?.[b.col] == null) return null;
  if (board[a.row][a.col] !== board[b.row][b.col]) return null;

  // 0 bends: direct line
  if (
    (a.row === b.row || a.col === b.col) &&
    canWalkLine(board, a.row, a.col, b.row, b.col, rows, cols)
  ) {
    return [a, b];
  }

  // 1 bend: L-shape via corner point
  for (const corner of [
    { row: a.row, col: b.col },
    { row: b.row, col: a.col },
  ]) {
    if (isEmptyOrBorder(board, corner.row, corner.col, rows, cols)) {
      if (
        canWalkLine(board, a.row, a.col, corner.row, corner.col, rows, cols) &&
        canWalkLine(board, corner.row, corner.col, b.row, b.col, rows, cols)
      ) {
        return [a, corner, b];
      }
    }
  }

  // 2 bends: scan all possible intermediate rows
  for (let r = -1; r <= rows; r++) {
    const mid1: PathPoint = { row: r, col: a.col };
    const mid2: PathPoint = { row: r, col: b.col };
    if (
      isEmptyOrBorder(board, r, a.col, rows, cols) &&
      isEmptyOrBorder(board, r, b.col, rows, cols)
    ) {
      if (
        canWalkLine(board, a.row, a.col, mid1.row, mid1.col, rows, cols) &&
        canWalkLine(board, mid1.row, mid1.col, mid2.row, mid2.col, rows, cols) &&
        canWalkLine(board, mid2.row, mid2.col, b.row, b.col, rows, cols)
      ) {
        return [a, mid1, mid2, b];
      }
    }
  }

  // 2 bends: scan all possible intermediate cols
  for (let c = -1; c <= cols; c++) {
    const mid1: PathPoint = { row: a.row, col: c };
    const mid2: PathPoint = { row: b.row, col: c };
    if (
      isEmptyOrBorder(board, a.row, c, rows, cols) &&
      isEmptyOrBorder(board, b.row, c, rows, cols)
    ) {
      if (
        canWalkLine(board, a.row, a.col, mid1.row, mid1.col, rows, cols) &&
        canWalkLine(board, mid1.row, mid1.col, mid2.row, mid2.col, rows, cols) &&
        canWalkLine(board, mid2.row, mid2.col, b.row, b.col, rows, cols)
      ) {
        return [a, mid1, mid2, b];
      }
    }
  }

  return null;
}

// --- Valid-move detection ---

export function hasValidMoves(
  board: (TileType | null)[][],
  rows: number,
  cols: number,
): boolean {
  // Collect non-null tile positions grouped by type
  const byType = new Map<TileType, PathPoint[]>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = board[r][c];
      if (t !== null) {
        if (!byType.has(t)) byType.set(t, []);
        byType.get(t)!.push({ row: r, col: c });
      }
    }
  }

  for (const positions of byType.values()) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (findPath(board, rows, cols, positions[i], positions[j]) !== null) {
          return true;
        }
      }
    }
  }
  return false;
}

// --- Find any valid pair (for hint) ---

export function findAnyPair(
  board: (TileType | null)[][],
  rows: number,
  cols: number,
): { a: PathPoint; b: PathPoint; path: PathPoint[] } | null {
  const byType = new Map<TileType, PathPoint[]>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = board[r][c];
      if (t !== null) {
        if (!byType.has(t)) byType.set(t, []);
        byType.get(t)!.push({ row: r, col: c });
      }
    }
  }

  for (const positions of byType.values()) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const path = findPath(board, rows, cols, positions[i], positions[j]);
        if (path !== null) {
          return { a: positions[i], b: positions[j], path };
        }
      }
    }
  }
  return null;
}

// --- Shuffle remaining tiles ---

export function shuffleRemaining(
  board: (TileType | null)[][],
  rows: number,
  cols: number,
): TileData[] {
  // Collect remaining types and positions
  const types: TileType[] = [];
  const positions: { row: number; col: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] !== null) {
        types.push(board[r][c]!);
        positions.push({ row: r, col: c });
      }
    }
  }

  // Retry shuffle until a solvable layout is found (up to 20 attempts)
  let tiles: TileData[] = [];
  for (let attempt = 0; attempt < 20; attempt++) {
    // Shuffle types (Fisher-Yates)
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    // Rebuild tiles
    tiles = [];
    for (let k = 0; k < positions.length; k++) {
      tiles.push({ type: types[k], row: positions[k].row, col: positions[k].col });
    }

    // Update board in-place
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        board[r][c] = null;
      }
    }
    for (const t of tiles) {
      board[t.row][t.col] = t.type;
    }

    // Check if this layout has valid moves
    if (hasValidMoves(board, rows, cols)) {
      return tiles;
    }
  }

  // Return last attempt even if unsolvable (caller will handle game over)
  return tiles;
}

// --- Count remaining tiles ---

export function countRemaining(board: (TileType | null)[][], rows: number, cols: number): number {
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] !== null) count++;
    }
  }
  return count;
}
