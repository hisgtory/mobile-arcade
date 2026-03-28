import { GRID_SIZE, type CellValue, type Player, type BoardState, type Difficulty } from '../types';

const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diags
];

export function createBoard(): BoardState {
  return {
    cells: Array(GRID_SIZE * GRID_SIZE).fill(null),
    currentPlayer: 'X',
    winner: null,
    winLine: null,
  };
}

export function makeMove(board: BoardState, index: number): BoardState | null {
  if (board.cells[index] !== null || board.winner !== null) return null;

  const newCells = [...board.cells];
  newCells[index] = board.currentPlayer;

  const winLine = checkWin(newCells, board.currentPlayer);
  const isDraw = !winLine && newCells.every((c) => c !== null);

  return {
    cells: newCells,
    currentPlayer: board.currentPlayer === 'X' ? 'O' : 'X',
    winner: winLine ? board.currentPlayer : isDraw ? 'draw' : null,
    winLine: winLine,
  };
}

function checkWin(cells: CellValue[], player: Player): number[] | null {
  for (const line of WIN_LINES) {
    if (line.every((i) => cells[i] === player)) {
      return line;
    }
  }
  return null;
}

// ─── AI (Minimax) ───────────────────────────────────────

export function getAIMove(board: BoardState, difficulty: Difficulty): number {
  const empty = board.cells
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i >= 0);

  if (empty.length === 0) return -1;

  if (difficulty === 'easy') {
    // 40% random, 60% minimax
    if (Math.random() < 0.4) return empty[Math.floor(Math.random() * empty.length)];
  } else if (difficulty === 'medium') {
    // 15% random, 85% minimax
    if (Math.random() < 0.15) return empty[Math.floor(Math.random() * empty.length)];
  }
  // hard: always minimax

  return minimaxMove(board.cells, board.currentPlayer);
}

function minimaxMove(cells: CellValue[], aiPlayer: Player): number {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== null) continue;
    cells[i] = aiPlayer;
    const score = minimax(cells, false, aiPlayer, 0);
    cells[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function minimax(
  cells: CellValue[],
  isMaximizing: boolean,
  aiPlayer: Player,
  depth: number,
): number {
  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X';

  // Check terminal states
  for (const line of WIN_LINES) {
    if (line.every((i) => cells[i] === aiPlayer)) return 10 - depth;
    if (line.every((i) => cells[i] === opponent)) return depth - 10;
  }
  if (cells.every((c) => c !== null)) return 0; // draw

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== null) continue;
      cells[i] = aiPlayer;
      best = Math.max(best, minimax(cells, false, aiPlayer, depth + 1));
      cells[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== null) continue;
      cells[i] = opponent;
      best = Math.min(best, minimax(cells, true, aiPlayer, depth + 1));
      cells[i] = null;
    }
    return best;
  }
}
