import type {
  BoardState,
  CastlingRights,
  Color,
  Move,
  Piece,
  PieceType,
  Square,
} from '../types';

export function sq(row: number, col: number): Square {
  return row * 8 + col;
}

export function rowOf(square: Square): number {
  return square >> 3;
}

export function colOf(square: Square): number {
  return square & 7;
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

const opposite = (color: Color): Color => (color === 'w' ? 'b' : 'w');

export function createInitialBoard(): BoardState {
  const board: (Piece | null)[] = new Array(64).fill(null);
  const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

  for (let col = 0; col < 8; col++) {
    board[sq(0, col)] = { type: backRank[col], color: 'b' };
    board[sq(1, col)] = { type: 'p', color: 'b' };
    board[sq(6, col)] = { type: 'p', color: 'w' };
    board[sq(7, col)] = { type: backRank[col], color: 'w' };
  }

  return {
    board,
    turn: 'w',
    castling: { wk: true, wq: true, bk: true, bq: true },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    status: 'playing',
    winner: null,
    lastMove: null,
  };
}

const KNIGHT_DELTAS: [number, number][] = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1],
];
const BISHOP_DIRS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const KING_DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
];
const PROMOTION_PIECES: PieceType[] = ['q', 'r', 'b', 'n'];

function pushSlider(
  state: BoardState,
  from: Square,
  color: Color,
  directions: [number, number][],
  out: Move[],
) {
  const row = rowOf(from);
  const col = colOf(from);

  for (const [dr, dc] of directions) {
    let nextRow = row + dr;
    let nextCol = col + dc;

    while (inBounds(nextRow, nextCol)) {
      const to = sq(nextRow, nextCol);
      const target = state.board[to];
      if (!target) {
        out.push({ from, to });
      } else {
        if (target.color !== color) out.push({ from, to, captured: target });
        break;
      }
      nextRow += dr;
      nextCol += dc;
    }
  }
}

function pawnMoves(state: BoardState, from: Square, color: Color, out: Move[]) {
  const row = rowOf(from);
  const col = colOf(from);
  const dir = color === 'w' ? -1 : 1;
  const startRow = color === 'w' ? 6 : 1;
  const promoRow = color === 'w' ? 0 : 7;
  const forwardRow = row + dir;

  if (inBounds(forwardRow, col) && !state.board[sq(forwardRow, col)]) {
    if (forwardRow === promoRow) {
      for (const promotion of PROMOTION_PIECES) {
        out.push({ from, to: sq(forwardRow, col), promotion });
      }
    } else {
      out.push({ from, to: sq(forwardRow, col) });
      const doubleForwardRow = row + 2 * dir;
      if (row === startRow && !state.board[sq(doubleForwardRow, col)]) {
        out.push({ from, to: sq(doubleForwardRow, col) });
      }
    }
  }

  for (const dc of [-1, 1]) {
    const nextCol = col + dc;
    if (!inBounds(forwardRow, nextCol)) continue;

    const to = sq(forwardRow, nextCol);
    const target = state.board[to];
    if (target && target.color !== color) {
      if (forwardRow === promoRow) {
        for (const promotion of PROMOTION_PIECES) {
          out.push({ from, to, promotion, captured: target });
        }
      } else {
        out.push({ from, to, captured: target });
      }
    } else if (!target && state.enPassantTarget === to) {
      const capturedPawn = state.board[sq(row, nextCol)];
      out.push({ from, to, isEnPassant: true, captured: capturedPawn ?? null });
    }
  }
}

function knightMoves(state: BoardState, from: Square, color: Color, out: Move[]) {
  const row = rowOf(from);
  const col = colOf(from);

  for (const [dr, dc] of KNIGHT_DELTAS) {
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (!inBounds(nextRow, nextCol)) continue;
    const to = sq(nextRow, nextCol);
    const target = state.board[to];
    if (!target) out.push({ from, to });
    else if (target.color !== color) out.push({ from, to, captured: target });
  }
}

function kingMoves(state: BoardState, from: Square, color: Color, out: Move[]) {
  const row = rowOf(from);
  const col = colOf(from);

  for (const [dr, dc] of KING_DIRS) {
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (!inBounds(nextRow, nextCol)) continue;
    const to = sq(nextRow, nextCol);
    const target = state.board[to];
    if (!target) out.push({ from, to });
    else if (target.color !== color) out.push({ from, to, captured: target });
  }

  const homeRow = color === 'w' ? 7 : 0;
  if (row !== homeRow || col !== 4) return;
  const rights = state.castling;
  const kingSide = color === 'w' ? rights.wk : rights.bk;
  const queenSide = color === 'w' ? rights.wq : rights.bq;

  if (!kingSide && !queenSide) return;
  if (isSquareAttacked(state, sq(homeRow, 4), opposite(color))) return;

  if (kingSide) {
    const f = sq(homeRow, 5);
    const g = sq(homeRow, 6);
    const rook = state.board[sq(homeRow, 7)];
    if (
      !state.board[f] &&
      !state.board[g] &&
      rook &&
      rook.type === 'r' &&
      rook.color === color &&
      !isSquareAttacked(state, f, opposite(color)) &&
      !isSquareAttacked(state, g, opposite(color))
    ) {
      out.push({ from, to: g, isCastle: 'k' });
    }
  }

  if (queenSide) {
    const d = sq(homeRow, 3);
    const c = sq(homeRow, 2);
    const b = sq(homeRow, 1);
    const rook = state.board[sq(homeRow, 0)];
    if (
      !state.board[d] &&
      !state.board[c] &&
      !state.board[b] &&
      rook &&
      rook.type === 'r' &&
      rook.color === color &&
      !isSquareAttacked(state, d, opposite(color)) &&
      !isSquareAttacked(state, c, opposite(color))
    ) {
      out.push({ from, to: c, isCastle: 'q' });
    }
  }
}

function pseudoMovesFor(state: BoardState, from: Square): Move[] {
  const piece = state.board[from];
  if (!piece) return [];

  const out: Move[] = [];
  switch (piece.type) {
    case 'p':
      pawnMoves(state, from, piece.color, out);
      break;
    case 'n':
      knightMoves(state, from, piece.color, out);
      break;
    case 'b':
      pushSlider(state, from, piece.color, BISHOP_DIRS, out);
      break;
    case 'r':
      pushSlider(state, from, piece.color, ROOK_DIRS, out);
      break;
    case 'q':
      pushSlider(state, from, piece.color, BISHOP_DIRS, out);
      pushSlider(state, from, piece.color, ROOK_DIRS, out);
      break;
    case 'k':
      kingMoves(state, from, piece.color, out);
      break;
  }

  return out;
}

export function isSquareAttacked(state: BoardState, target: Square, byColor: Color): boolean {
  const targetRow = rowOf(target);
  const targetCol = colOf(target);
  const pawnFromRow = byColor === 'w' ? targetRow + 1 : targetRow - 1;

  if (pawnFromRow >= 0 && pawnFromRow < 8) {
    for (const dc of [-1, 1]) {
      const nextCol = targetCol + dc;
      if (nextCol < 0 || nextCol >= 8) continue;
      const piece = state.board[sq(pawnFromRow, nextCol)];
      if (piece && piece.type === 'p' && piece.color === byColor) return true;
    }
  }

  for (const [dr, dc] of KNIGHT_DELTAS) {
    const nextRow = targetRow + dr;
    const nextCol = targetCol + dc;
    if (!inBounds(nextRow, nextCol)) continue;
    const piece = state.board[sq(nextRow, nextCol)];
    if (piece && piece.type === 'n' && piece.color === byColor) return true;
  }

  for (const [dr, dc] of BISHOP_DIRS) {
    let nextRow = targetRow + dr;
    let nextCol = targetCol + dc;
    while (inBounds(nextRow, nextCol)) {
      const piece = state.board[sq(nextRow, nextCol)];
      if (piece) {
        if (piece.color === byColor && (piece.type === 'b' || piece.type === 'q')) return true;
        break;
      }
      nextRow += dr;
      nextCol += dc;
    }
  }

  for (const [dr, dc] of ROOK_DIRS) {
    let nextRow = targetRow + dr;
    let nextCol = targetCol + dc;
    while (inBounds(nextRow, nextCol)) {
      const piece = state.board[sq(nextRow, nextCol)];
      if (piece) {
        if (piece.color === byColor && (piece.type === 'r' || piece.type === 'q')) return true;
        break;
      }
      nextRow += dr;
      nextCol += dc;
    }
  }

  for (const [dr, dc] of KING_DIRS) {
    const nextRow = targetRow + dr;
    const nextCol = targetCol + dc;
    if (!inBounds(nextRow, nextCol)) continue;
    const piece = state.board[sq(nextRow, nextCol)];
    if (piece && piece.type === 'k' && piece.color === byColor) return true;
  }

  return false;
}

function findKing(state: BoardState, color: Color): Square {
  for (let index = 0; index < 64; index++) {
    const piece = state.board[index];
    if (piece && piece.type === 'k' && piece.color === color) return index;
  }
  return -1;
}

export function isInCheck(state: BoardState, color: Color): boolean {
  const kingSquare = findKing(state, color);
  if (kingSquare < 0) return false;
  return isSquareAttacked(state, kingSquare, opposite(color));
}

export function applyMove(state: BoardState, move: Move): BoardState {
  const board = state.board.slice();
  const piece = board[move.from];
  if (!piece) return { ...state, board };

  let captured = move.captured ?? board[move.to] ?? null;
  board[move.to] = piece;
  board[move.from] = null;

  if (move.isEnPassant) {
    const enPassantRow = rowOf(move.from);
    const enPassantCol = colOf(move.to);
    captured = board[sq(enPassantRow, enPassantCol)] ?? captured;
    board[sq(enPassantRow, enPassantCol)] = null;
  }

  if (move.isCastle) {
    const homeRow = rowOf(move.to);
    if (move.isCastle === 'k') {
      board[sq(homeRow, 5)] = board[sq(homeRow, 7)];
      board[sq(homeRow, 7)] = null;
    } else {
      board[sq(homeRow, 3)] = board[sq(homeRow, 0)];
      board[sq(homeRow, 0)] = null;
    }
  }

  if (move.promotion) {
    board[move.to] = { type: move.promotion, color: piece.color };
  }

  const castling: CastlingRights = { ...state.castling };
  if (piece.type === 'k') {
    if (piece.color === 'w') {
      castling.wk = false;
      castling.wq = false;
    } else {
      castling.bk = false;
      castling.bq = false;
    }
  }
  if (piece.type === 'r') {
    if (piece.color === 'w') {
      if (move.from === sq(7, 0)) castling.wq = false;
      if (move.from === sq(7, 7)) castling.wk = false;
    } else {
      if (move.from === sq(0, 0)) castling.bq = false;
      if (move.from === sq(0, 7)) castling.bk = false;
    }
  }
  if (move.to === sq(7, 0)) castling.wq = false;
  if (move.to === sq(7, 7)) castling.wk = false;
  if (move.to === sq(0, 0)) castling.bq = false;
  if (move.to === sq(0, 7)) castling.bk = false;

  let enPassantTarget: Square | null = null;
  if (piece.type === 'p' && Math.abs(rowOf(move.to) - rowOf(move.from)) === 2) {
    const midRow = (rowOf(move.from) + rowOf(move.to)) / 2;
    enPassantTarget = sq(midRow, colOf(move.from));
  }

  const halfmoveClock = piece.type === 'p' || captured ? 0 : state.halfmoveClock + 1;
  const fullmoveNumber = state.turn === 'b' ? state.fullmoveNumber + 1 : state.fullmoveNumber;

  const next: BoardState = {
    board,
    turn: opposite(state.turn),
    castling,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
    status: 'playing',
    winner: null,
    lastMove: { ...move, captured },
  };

  const statusInfo = getGameStatus(next);
  next.status = statusInfo.status;
  next.winner = statusInfo.winner;
  return next;
}

export function getLegalMoves(state: BoardState, from: Square): Move[] {
  const piece = state.board[from];
  if (!piece || piece.color !== state.turn) return [];
  const pseudoMoves = pseudoMovesFor(state, from);
  const legalMoves: Move[] = [];
  for (const move of pseudoMoves) {
    const trial = applyMoveRaw(state, move);
    if (!isInCheck(trial, piece.color)) legalMoves.push(move);
  }
  return legalMoves;
}

export function getAllLegalMoves(state: BoardState, color: Color): Move[] {
  const out: Move[] = [];
  for (let index = 0; index < 64; index++) {
    const piece = state.board[index];
    if (!piece || piece.color !== color) continue;
    const pseudoMoves = pseudoMovesFor(state, index);
    for (const move of pseudoMoves) {
      const trial = applyMoveRaw(state, move);
      if (!isInCheck(trial, color)) out.push(move);
    }
  }
  return out;
}

function applyMoveRaw(state: BoardState, move: Move): BoardState {
  const board = state.board.slice();
  const piece = board[move.from];
  if (!piece) return { ...state, board };

  board[move.to] = piece;
  board[move.from] = null;

  if (move.isEnPassant) {
    const enPassantRow = rowOf(move.from);
    const enPassantCol = colOf(move.to);
    board[sq(enPassantRow, enPassantCol)] = null;
  }
  if (move.isCastle) {
    const homeRow = rowOf(move.to);
    if (move.isCastle === 'k') {
      board[sq(homeRow, 5)] = board[sq(homeRow, 7)];
      board[sq(homeRow, 7)] = null;
    } else {
      board[sq(homeRow, 3)] = board[sq(homeRow, 0)];
      board[sq(homeRow, 0)] = null;
    }
  }
  if (move.promotion) {
    board[move.to] = { type: move.promotion, color: piece.color };
  }

  return {
    ...state,
    board,
    turn: opposite(state.turn),
  };
}

export function getGameStatus(state: BoardState): {
  status: BoardState['status'];
  winner: BoardState['winner'];
} {
  const moves = getAllLegalMoves(state, state.turn);
  const inCheck = isInCheck(state, state.turn);

  if (moves.length === 0) {
    if (inCheck) {
      return { status: 'checkmate', winner: opposite(state.turn) };
    }
    return { status: 'stalemate', winner: 'draw' };
  }

  if (inCheck) return { status: 'check', winner: null };
  return { status: 'playing', winner: null };
}
