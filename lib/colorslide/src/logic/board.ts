import type { StageConfig, Board, BoardState, SlideMove, CellValue } from '../types';

// ─── Board Creation ──────────────────────────────────────

/**
 * Create a board for the given stage config.
 * The board is NxN with one empty cell (-1) and the rest filled with colors.
 * Colors are distributed evenly, then shuffled.
 * The solved state has same colors grouped together in contiguous regions.
 */
export function createBoard(config: StageConfig): BoardState {
  const { gridSize, numColors } = config;
  const totalCells = gridSize * gridSize;
  const filledCells = totalCells - 1; // one empty

  // Create the solved board first
  const solvedFlat = createSolvedFlat(gridSize, numColors);

  // Shuffle by performing random valid moves from the solved state
  const board = flatToBoard(solvedFlat, gridSize);
  let emptyRow = gridSize - 1;
  let emptyCol = gridSize - 1;

  // Perform many random moves to shuffle
  const shuffleMoves = filledCells * 20;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (let i = 0; i < shuffleMoves; i++) {
    const validMoves: [number, number][] = [];
    for (const [dr, dc] of dirs) {
      const nr = emptyRow + dr;
      const nc = emptyCol + dc;
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
        validMoves.push([nr, nc]);
      }
    }
    const [mr, mc] = validMoves[Math.floor(Math.random() * validMoves.length)];
    board[emptyRow][emptyCol] = board[mr][mc];
    board[mr][mc] = -1;
    emptyRow = mr;
    emptyCol = mc;
  }

  return { board, emptyRow, emptyCol, numColors, gridSize };
}

/**
 * Create a solved flat array where same colors are grouped.
 * The last cell is empty (-1).
 */
function createSolvedFlat(gridSize: number, numColors: number): CellValue[] {
  const totalCells = gridSize * gridSize;
  const filledCells = totalCells - 1;
  const flat: CellValue[] = [];

  // Distribute colors as evenly as possible
  const base = Math.floor(filledCells / numColors);
  const extra = filledCells % numColors;

  for (let c = 0; c < numColors; c++) {
    const count = base + (c < extra ? 1 : 0);
    for (let i = 0; i < count; i++) {
      flat.push(c);
    }
  }

  // Add empty cell at end
  flat.push(-1);

  return flat;
}

function flatToBoard(flat: CellValue[], gridSize: number): Board {
  const board: Board = [];
  for (let r = 0; r < gridSize; r++) {
    board[r] = [];
    for (let c = 0; c < gridSize; c++) {
      board[r][c] = flat[r * gridSize + c];
    }
  }
  return board;
}

// ─── Slide Logic ──────────────────────────────────────────

/**
 * Check if a tile at (row, col) can slide into the empty space.
 * Only tiles adjacent to the empty cell can slide.
 */
export function canSlide(state: BoardState, row: number, col: number): SlideMove | null {
  const { emptyRow, emptyCol, gridSize } = state;
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null;
  if (state.board[row][col] === -1) return null;

  const dr = Math.abs(row - emptyRow);
  const dc = Math.abs(col - emptyCol);

  // Must be adjacent (not diagonal)
  if (dr + dc !== 1) return null;

  return { fromRow: row, fromCol: col, toRow: emptyRow, toCol: emptyCol };
}

/**
 * Execute a slide move, returning a new board state.
 */
export function executeSlide(state: BoardState, move: SlideMove): BoardState {
  const newBoard = state.board.map(r => [...r]);
  newBoard[move.toRow][move.toCol] = newBoard[move.fromRow][move.fromCol];
  newBoard[move.fromRow][move.fromCol] = -1;

  return {
    ...state,
    board: newBoard,
    emptyRow: move.fromRow,
    emptyCol: move.fromCol,
  };
}

// ─── Win Check ───────────────────────────────────────────

/**
 * Check if the board is solved: all same-colored tiles form a single
 * contiguous group (connected via up/down/left/right).
 */
export function isWon(state: BoardState): boolean {
  const { board, gridSize, numColors } = state;

  // For each color, check that all tiles of that color are connected
  for (let c = 0; c < numColors; c++) {
    const cells: [number, number][] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let col = 0; col < gridSize; col++) {
        if (board[r][col] === c) {
          cells.push([r, col]);
        }
      }
    }
    if (cells.length === 0) continue;

    // BFS from first cell of this color
    const visited = new Set<string>();
    const queue: [number, number][] = [cells[0]];
    visited.add(`${cells[0][0]},${cells[0][1]}`);

    while (queue.length > 0) {
      const [cr, cc] = queue.shift()!;
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        const nr = cr + dr;
        const nc = cc + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize &&
            board[nr][nc] === c && !visited.has(key)) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }

    // All cells of this color should be visited
    if (visited.size !== cells.length) return false;
  }

  return true;
}
