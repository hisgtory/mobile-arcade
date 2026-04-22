import { GRID_SIZE, type CellValue, type Player, type BoardState, type Difficulty } from '../types';

export function generateWinLines(gridSize: number, matchLength: number): number[][] {
  const lines: number[][] = [];

  // Rows
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c <= gridSize - matchLength; c++) {
      const line: number[] = [];
      for (let k = 0; k < matchLength; k++) line.push(r * gridSize + c + k);
      lines.push(line);
    }
  }

  // Columns
  for (let c = 0; c < gridSize; c++) {
    for (let r = 0; r <= gridSize - matchLength; r++) {
      const line: number[] = [];
      for (let k = 0; k < matchLength; k++) line.push((r + k) * gridSize + c);
      lines.push(line);
    }
  }

  // Diagonals (top-left to bottom-right)
  for (let r = 0; r <= gridSize - matchLength; r++) {
    for (let c = 0; c <= gridSize - matchLength; c++) {
      const line: number[] = [];
      for (let k = 0; k < matchLength; k++) line.push((r + k) * gridSize + c + k);
      lines.push(line);
    }
  }

  // Anti-diagonals (top-right to bottom-left)
  for (let r = 0; r <= gridSize - matchLength; r++) {
    for (let c = matchLength - 1; c < gridSize; c++) {
      const line: number[] = [];
      for (let k = 0; k < matchLength; k++) line.push((r + k) * gridSize + c - k);
      lines.push(line);
    }
  }

  return lines;
}

// Cache win lines per config
const winLinesCache = new Map<string, number[][]>();

function getWinLines(gridSize: number, matchLength: number): number[][] {
  const key = `${gridSize}-${matchLength}`;
  let lines = winLinesCache.get(key);
  if (!lines) {
    lines = generateWinLines(gridSize, matchLength);
    winLinesCache.set(key, lines);
  }
  return lines;
}

export function createBoard(gridSize: number = GRID_SIZE, matchLength: number = gridSize): BoardState {
  return {
    cells: Array(gridSize * gridSize).fill(null),
    currentPlayer: 'X',
    winner: null,
    winLine: null,
    gridSize,
    matchLength,
  };
}

export function makeMove(board: BoardState, index: number): BoardState | null {
  if (board.cells[index] !== null || board.winner !== null) return null;

  const newCells = [...board.cells];
  newCells[index] = board.currentPlayer;

  const winLines = getWinLines(board.gridSize, board.matchLength);
  const winLine = checkWin(newCells, board.currentPlayer, winLines);
  const isDraw = !winLine && newCells.every((c) => c !== null);

  return {
    cells: newCells,
    currentPlayer: board.currentPlayer === 'X' ? 'O' : 'X',
    winner: winLine ? board.currentPlayer : isDraw ? 'draw' : null,
    winLine: winLine,
    gridSize: board.gridSize,
    matchLength: board.matchLength,
  };
}

function checkWin(cells: CellValue[], player: Player, winLines: number[][]): number[] | null {
  for (const line of winLines) {
    if (line.every((i) => cells[i] === player)) {
      return line;
    }
  }
  return null;
}

// ─── AI (Minimax with Alpha-Beta Pruning) ─────────────────

export function getAIMove(board: BoardState, difficulty: Difficulty): number {
  const empty = board.cells
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i >= 0);

  if (empty.length === 0) return -1;

  if (difficulty === 'easy') {
    if (Math.random() < 0.4) return empty[Math.floor(Math.random() * empty.length)];
  } else if (difficulty === 'medium') {
    if (Math.random() < 0.15) return empty[Math.floor(Math.random() * empty.length)];
  }

  const winLines = getWinLines(board.gridSize, board.matchLength);

  // Use unlimited depth for 3x3, depth-limited for larger grids
  const maxDepth = board.gridSize <= 3 ? Infinity : board.gridSize <= 4 ? 6 : 4;

  return minimaxMove(board.cells, board.currentPlayer, winLines, maxDepth);
}

function minimaxMove(
  cells: CellValue[],
  aiPlayer: Player,
  winLines: number[][],
  maxDepth: number,
): number {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== null) continue;
    cells[i] = aiPlayer;
    const score = minimax(cells, false, aiPlayer, 0, -Infinity, Infinity, winLines, maxDepth);
    cells[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function evaluate(
  cells: CellValue[],
  aiPlayer: Player,
  opponent: Player,
  winLines: number[][],
): number {
  // Heuristic evaluation for depth-limited search
  let score = 0;
  for (const line of winLines) {
    let aiCount = 0;
    let oppCount = 0;
    for (const i of line) {
      if (cells[i] === aiPlayer) aiCount++;
      else if (cells[i] === opponent) oppCount++;
    }
    if (oppCount === 0 && aiCount > 0) score += aiCount * aiCount;
    if (aiCount === 0 && oppCount > 0) score -= oppCount * oppCount;
  }
  return score;
}

function minimax(
  cells: CellValue[],
  isMaximizing: boolean,
  aiPlayer: Player,
  depth: number,
  alpha: number,
  beta: number,
  winLines: number[][],
  maxDepth: number,
): number {
  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X';

  // Check terminal states
  for (const line of winLines) {
    if (line.every((i) => cells[i] === aiPlayer)) return 1000 - depth;
    if (line.every((i) => cells[i] === opponent)) return depth - 1000;
  }
  if (cells.every((c) => c !== null)) return 0;

  // Depth limit reached — use heuristic
  if (depth >= maxDepth) {
    return evaluate(cells, aiPlayer, opponent, winLines);
  }

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== null) continue;
      cells[i] = aiPlayer;
      best = Math.max(best, minimax(cells, false, aiPlayer, depth + 1, alpha, beta, winLines, maxDepth));
      cells[i] = null;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== null) continue;
      cells[i] = opponent;
      best = Math.min(best, minimax(cells, true, aiPlayer, depth + 1, alpha, beta, winLines, maxDepth));
      cells[i] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}
