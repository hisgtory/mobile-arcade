export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Square = number;

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
  isCastle?: 'k' | 'q';
  isEnPassant?: boolean;
  captured?: Piece | null;
}

export interface CastlingRights {
  wk: boolean;
  wq: boolean;
  bk: boolean;
  bq: boolean;
}

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export interface BoardState {
  board: (Piece | null)[];
  turn: Color;
  castling: CastlingRights;
  enPassantTarget: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
  status: GameStatus;
  winner: Color | 'draw' | null;
  lastMove: Move | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  difficulty?: Difficulty;
  playerColor?: Color;
}
