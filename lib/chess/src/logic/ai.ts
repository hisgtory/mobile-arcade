import type { BoardState, Difficulty, Move, PieceType } from '../types';
import { getAllLegalMoves } from './rules';

export interface ChessAI {
  selectMove(state: BoardState): Move | null;
}

const PIECE_VALUE: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 1000,
};

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

class RandomAI implements ChessAI {
  selectMove(state: BoardState): Move | null {
    const moves = getAllLegalMoves(state, state.turn);
    return pickRandom(moves);
  }
}

class GreedyAI implements ChessAI {
  selectMove(state: BoardState): Move | null {
    const moves = getAllLegalMoves(state, state.turn);
    if (moves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMoves: Move[] = [];
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
    return pickRandom(bestMoves);
  }
}

// TODO: implement MinimaxAI (alpha-beta) for hard difficulty.
export function createAI(difficulty: Difficulty): ChessAI {
  switch (difficulty) {
    case 'easy':
      return new RandomAI();
    case 'medium':
      return new GreedyAI();
    case 'hard':
      return new GreedyAI();
    default:
      return new GreedyAI();
  }
}
