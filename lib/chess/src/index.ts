export { createGame, destroyGame } from './game';
export type {
  GameConfig,
  Difficulty,
  BoardState,
  Color,
  Piece,
  PieceType,
  Move,
  Square,
  CastlingRights,
  GameStatus,
} from './types';
export {
  createInitialBoard,
  getLegalMoves,
  getAllLegalMoves,
  applyMove,
  isInCheck,
  getGameStatus,
} from './logic/rules';
export { createAI } from './logic/ai';
export type { ChessAI } from './logic/ai';
