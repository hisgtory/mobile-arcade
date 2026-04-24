import type { BoardState, Difficulty, Move, PieceType } from '../types';
import { applyMove, getAllLegalMoves } from './rules';

export interface ChessAI {
  selectMove(state: BoardState): Move | null;
}

const PIECE_VALUE: Record<PieceType, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900,
};

// Piece-Square Tables (White perspective)
// Values are added to the material score.
// Indices 0-63 correspond to squares a8-h1.
const PST_PAWN = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10,-20,-20, 10, 10,  5,
  5, -5,-10,  0,  0,-10, -5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5,  5, 10, 25, 25, 10,  5,  5,
  10, 10, 20, 30, 30, 20, 10, 10,
  50, 50, 50, 50, 50, 50, 50, 50,
  0,  0,  0,  0,  0,  0,  0,  0
].reverse(); // Reverse so it starts from rank 1 (white side) for calculation

const PST_KNIGHT = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
].reverse();

const PST_BISHOP = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
].reverse();

const PST_ROOK = [
  0,  0,  0,  5,  5,  0,  0,  0,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  5, 10, 10, 10, 10, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
].reverse();

const PST_QUEEN = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  5,  5,  5,  5,  5,  0,-10,
  0,  0,  5,  5,  5,  5,  0, -5,
  -5,  0,  5,  5,  5,  5,  0, -5,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
].reverse();

const PST_KING = [
  20, 30, 10,  0,  0, 10, 30, 20,
  20, 20,  0,  0,  0,  0, 20, 20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30
].reverse();

const PST: Record<PieceType, number[]> = {
  p: PST_PAWN,
  n: PST_KNIGHT,
  b: PST_BISHOP,
  r: PST_ROOK,
  q: PST_QUEEN,
  k: PST_KING,
};

function evaluatePosition(state: BoardState): number {
  if (state.status === 'checkmate') {
    return state.winner === 'w' ? 10000 : -10000;
  }
  if (state.status.startsWith('draw') || state.status === 'stalemate') {
    return 0;
  }

  let totalScore = 0;
  for (let i = 0; i < 64; i++) {
    const piece = state.board[i];
    if (!piece) continue;

    const type = piece.type;
    const isWhite = piece.color === 'w';
    let pieceScore = PIECE_VALUE[type];

    // Positional score
    // PST is for White. For Black, mirror row-wise.
    const row = Math.floor(i / 8);
    const col = i % 8;
    const pstIndex = isWhite ? (7 - row) * 8 + col : row * 8 + col;
    pieceScore += PST[type][pstIndex];

    totalScore += isWhite ? pieceScore : -pieceScore;
  }

  return totalScore;
}

function minimax(
  state: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
): number {
  if (depth === 0 || state.status !== 'playing' && state.status !== 'check') {
    return evaluatePosition(state);
  }

  const moves = getAllLegalMoves(state, state.turn);
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const m of moves) {
      const next = applyMove(state, m);
      const ev = minimax(next, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      const next = applyMove(state, m);
      const ev = minimax(next, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

class RandomAI implements ChessAI {
  selectMove(state: BoardState): Move | null {
    const moves = getAllLegalMoves(state, state.turn);
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }
}

class GreedyAI implements ChessAI {
  selectMove(state: BoardState): Move | null {
    const moves = getAllLegalMoves(state, state.turn);
    if (moves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMoves: Move[] = [];
    const isWhite = state.turn === 'w';

    for (const m of moves) {
      let score = m.captured ? PIECE_VALUE[m.captured.type] : 0;
      if (m.promotion) {
        score += PIECE_VALUE[m.promotion];
      }

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [m];
      } else if (score === bestScore) {
        bestMoves.push(m);
      }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }
}

class MinimaxAI implements ChessAI {
  constructor(private depth: number) {}

  selectMove(state: BoardState): Move | null {
    const moves = getAllLegalMoves(state, state.turn);
    if (moves.length === 0) return null;

    const isWhite = state.turn === 'w';
    let bestScore = isWhite ? -Infinity : Infinity;
    let bestMoves: Move[] = [];

    // Sort moves: captures first for better pruning
    moves.sort((a, b) => {
      const aVal = a.captured ? PIECE_VALUE[a.captured.type] : 0;
      const bVal = b.captured ? PIECE_VALUE[b.captured.type] : 0;
      return bVal - aVal;
    });

    for (const m of moves) {
      const next = applyMove(state, m);
      const score = minimax(next, this.depth - 1, -Infinity, Infinity, !isWhite);

      if (isWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [m];
        } else if (score === bestScore) {
          bestMoves.push(m);
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMoves = [m];
        } else if (score === bestScore) {
          bestMoves.push(m);
        }
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }
}

export function createAI(difficulty: Difficulty): ChessAI {
  switch (difficulty) {
    case 'easy':
      return new RandomAI();
    case 'medium':
      return new GreedyAI();
    case 'hard':
      return new MinimaxAI(3);
    default:
      return new GreedyAI();
  }
}
