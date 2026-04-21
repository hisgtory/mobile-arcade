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

function preferQueenPromotions(moves: Move[]): Move[] {
  const queenPromotionKeys = new Set(
    moves
      .filter((move) => move.promotion === 'q')
      .map((move) => `${move.from}:${move.to}:${move.captured?.type ?? '-'}`),
  );

  return moves.filter((move) => {
    if (!move.promotion || move.promotion === 'q') return true;
    const key = `${move.from}:${move.to}:${move.captured?.type ?? '-'}`;
    return !queenPromotionKeys.has(key);
  });
}

class RandomAI implements ChessAI {
  selectMove(state: BoardState): Move | null {
    const moves = preferQueenPromotions(getAllLegalMoves(state, state.turn));
    return pickRandom(moves);
  }
}

class GreedyAI implements ChessAI {
  selectMove(state: BoardState): Move | null {
    const moves = preferQueenPromotions(getAllLegalMoves(state, state.turn));
    if (moves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMoves: Move[] = [];
    for (const move of moves) {
      const captureScore = move.captured ? PIECE_VALUE[move.captured.type] : 0;
      const promotionScore = move.promotion ? PIECE_VALUE[move.promotion] - PIECE_VALUE.p : 0;
      const score = captureScore + promotionScore;
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }
    return pickRandom(bestMoves);
  }
}

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
