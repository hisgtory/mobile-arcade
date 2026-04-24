export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: Color;
}

// Square index: 0-63. 0 = a8, 7 = h8, 56 = a1, 63 = h1.
// Row 0 is rank 8 (black back rank), row 7 is rank 1 (white back rank).
// Column 0 is a-file, column 7 is h-file.
export type Square = number;

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType; // queen for MVP auto-promotion
  isCastle?: 'k' | 'q'; // king-side / queen-side
  isEnPassant?: boolean;
  captured?: Piece | null;
}

export interface CastlingRights {
  wk: boolean; // white king-side
  wq: boolean; // white queen-side
  bk: boolean;
  bq: boolean;
}

export type GameStatus =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw_repetition'
  | 'draw_50move'
  | 'draw_material'
  | 'timeout'
  | 'draw_timeout';

export interface BoardState {
  board: (Piece | null)[]; // length 64
  turn: Color;
  castling: CastlingRights;
  enPassantTarget: Square | null; // square that may be captured en-passant by next player
  halfmoveClock: number; // for 50-move rule (tracked but not yet enforced)
  fullmoveNumber: number;
  status: GameStatus;
  winner: Color | 'draw' | null;
  lastMove: Move | null;
  positionHistory: Record<string, number>; // hash -> count for 3-fold repetition
  clocks: { w: number; b: number }; // remaining milliseconds
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  difficulty?: Difficulty;
  playerColor?: Color; // MVP: always 'w'
  timeControl?: {
    initialSeconds: number;
    incrementSeconds: number;
  };
}
