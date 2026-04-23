import { MAX_ITEM_LEVEL, type Cell, type BoardState, type StageConfig, type MergeMove } from '../types';

// ─── Constants ───────────────────────────────────────────
const INITIAL_FILL_RATIO = 0.6;
const MAX_INITIAL_ITEMS = 20;

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  const { cols, rows, targetClues } = config;
  const totalCells = cols * rows;

  // Start with a few random Lv1 items scattered on the board
  const cells: Cell[] = new Array(totalCells).fill(null);
  const initialCount = Math.min(Math.floor(totalCells * INITIAL_FILL_RATIO), MAX_INITIAL_ITEMS);

  const indices = shuffleIndices(totalCells);
  for (let i = 0; i < initialCount; i++) {
    cells[indices[i]] = 1; // Lv1
  }

  return { cells, cols, rows, cluesCollected: 0, targetClues };
}

// ─── Spawn ───────────────────────────────────────────────

/** Spawn a new Lv1 item on a random empty cell. Mutates board in-place. Returns the index or -1 if board is full. */
export function spawnItem(board: BoardState): number {
  const empties = board.cells
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i >= 0);

  if (empties.length === 0) return -1;

  const idx = empties[Math.floor(Math.random() * empties.length)];
  board.cells[idx] = 1;
  return idx;
}

/** Count empty cells */
export function emptyCount(board: BoardState): number {
  return board.cells.filter((c) => c === null).length;
}

// ─── Merge Logic ─────────────────────────────────────────

/** Check if two cells can be merged (same level, adjacent) */
export function canMerge(board: BoardState, fromIdx: number, toIdx: number): MergeMove | null {
  if (fromIdx === toIdx) return null;
  if (fromIdx < 0 || fromIdx >= board.cells.length) return null;
  if (toIdx < 0 || toIdx >= board.cells.length) return null;

  const fromVal = board.cells[fromIdx];
  const toVal = board.cells[toIdx];

  if (fromVal === null || toVal === null) return null;
  if (fromVal !== toVal) return null;
  if (fromVal >= MAX_ITEM_LEVEL) return null; // can't merge max level items

  // Check adjacency (including diagonals)
  if (!isAdjacent(board.cols, board.rows, fromIdx, toIdx)) return null;

  return { fromIdx, toIdx, newLevel: fromVal + 1 };
}

/** Execute a merge: remove fromIdx item, upgrade toIdx item. Mutates board in-place. */
export function executeMerge(board: BoardState, move: MergeMove): { clueCreated: boolean } {
  board.cells[move.fromIdx] = null;
  board.cells[move.toIdx] = move.newLevel;

  let clueCreated = false;
  if (move.newLevel === MAX_ITEM_LEVEL) {
    board.cluesCollected++;
    clueCreated = true;
    // Remove clue item from board after collecting
    board.cells[move.toIdx] = null;
  }

  return { clueCreated };
}

// ─── Win / Lose ──────────────────────────────────────────

export function isWon(board: BoardState): boolean {
  return board.cluesCollected >= board.targetClues;
}

export function isGameOver(board: BoardState): boolean {
  // Board is full AND no possible merges
  if (emptyCount(board) > 0) return false;
  return !hasAnyMerge(board);
}

export function hasAnyMerge(board: BoardState): boolean {
  const { cols, rows, cells } = board;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const val = cells[idx];
      if (val === null || val >= MAX_ITEM_LEVEL) continue;

      // Check right
      if (c + 1 < cols && cells[idx + 1] === val) return true;
      // Check down
      if (r + 1 < rows && cells[idx + cols] === val) return true;
      // Check down-right
      if (c + 1 < cols && r + 1 < rows && cells[idx + cols + 1] === val) return true;
      // Check down-left
      if (c - 1 >= 0 && r + 1 < rows && cells[idx + cols - 1] === val) return true;
    }
  }
  return false;
}

// ─── Utilities ───────────────────────────────────────────

function isAdjacent(cols: number, rows: number, a: number, b: number): boolean {
  const ar = Math.floor(a / cols);
  const ac = a % cols;
  const br = Math.floor(b / cols);
  const bc = b % cols;
  const dr = Math.abs(ar - br);
  const dc = Math.abs(ac - bc);
  return dr <= 1 && dc <= 1 && (dr + dc > 0);
}

function shuffleIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
