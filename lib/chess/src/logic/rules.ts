import type {
  BoardState,
  CastlingRights,
  Color,
  Move,
  Piece,
  PieceType,
  Square,
} from '../types';

// ─── Coordinate helpers ────────────────────────────────────
// Square index 0..63. row 0 = rank 8, row 7 = rank 1. col 0 = a, col 7 = h.

export function sq(row: number, col: number): Square {
  return row * 8 + col;
}
export function rowOf(s: Square): number {
  return s >> 3;
}
export function colOf(s: Square): number {
  return s & 7;
}
export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

const opposite = (c: Color): Color => (c === 'w' ? 'b' : 'w');

// ─── Initial position ──────────────────────────────────────

export function createInitialBoard(): BoardState {
  const board: (Piece | null)[] = new Array(64).fill(null);

  const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    board[sq(0, c)] = { type: backRank[c], color: 'b' };
    board[sq(1, c)] = { type: 'p', color: 'b' };
    board[sq(6, c)] = { type: 'p', color: 'w' };
    board[sq(7, c)] = { type: backRank[c], color: 'w' };
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

// ─── Pseudo-legal move generation ──────────────────────────
// Generates all moves following piece movement rules, but doesn't filter
// for own-king-in-check. The caller filters via isInCheck.

const KNIGHT_DELTAS: [number, number][] = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1],
];
const BISHOP_DIRS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const KING_DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
];

function pushSlider(
  state: BoardState,
  from: Square,
  color: Color,
  dirs: [number, number][],
  out: Move[],
): void {
  const r = rowOf(from);
  const c = colOf(from);
  for (const [dr, dc] of dirs) {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const to = sq(nr, nc);
      const target = state.board[to];
      if (!target) {
        out.push({ from, to });
      } else {
        if (target.color !== color) out.push({ from, to, captured: target });
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
}

function pawnMoves(state: BoardState, from: Square, color: Color, out: Move[]): void {
  const r = rowOf(from);
  const c = colOf(from);
  const dir = color === 'w' ? -1 : 1; // white moves up (decreasing row)
  const startRow = color === 'w' ? 6 : 1;
  const promoRow = color === 'w' ? 0 : 7;

  // Forward 1
  const fwd = r + dir;
  if (inBounds(fwd, c) && !state.board[sq(fwd, c)]) {
    if (fwd === promoRow) {
      for (const p of ['q', 'r', 'b', 'n'] as PieceType[]) {
        out.push({ from, to: sq(fwd, c), promotion: p });
      }
    } else {
      out.push({ from, to: sq(fwd, c) });
      // Forward 2 from start
      const fwd2 = r + 2 * dir;
      if (r === startRow && !state.board[sq(fwd2, c)]) {
        out.push({ from, to: sq(fwd2, c) });
      }
    }
  }

  // Diagonal captures + en passant
  for (const dc of [-1, 1]) {
    const nc = c + dc;
    if (!inBounds(fwd, nc)) continue;
    const to = sq(fwd, nc);
    const target = state.board[to];
    if (target && target.color !== color) {
      if (fwd === promoRow) {
        for (const p of ['q', 'r', 'b', 'n'] as PieceType[]) {
          out.push({ from, to, promotion: p, captured: target });
        }
      } else {
        out.push({ from, to, captured: target });
      }
    } else if (!target && state.enPassantTarget === to) {
      // En passant: the captured pawn sits on the same row as `from`,
      // on column `nc`.
      const capturedPawn = state.board[sq(r, nc)];
      out.push({ from, to, isEnPassant: true, captured: capturedPawn ?? null });
    }
  }
}

function knightMoves(state: BoardState, from: Square, color: Color, out: Move[]): void {
  const r = rowOf(from);
  const c = colOf(from);
  for (const [dr, dc] of KNIGHT_DELTAS) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const to = sq(nr, nc);
    const target = state.board[to];
    if (!target) out.push({ from, to });
    else if (target.color !== color) out.push({ from, to, captured: target });
  }
}

function kingMoves(state: BoardState, from: Square, color: Color, out: Move[]): void {
  const r = rowOf(from);
  const c = colOf(from);
  for (const [dr, dc] of KING_DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const to = sq(nr, nc);
    const target = state.board[to];
    if (!target) out.push({ from, to });
    else if (target.color !== color) out.push({ from, to, captured: target });
  }

  // Castling — only generated as a candidate; legality of "passing through
  // attacked squares" is checked here too because filtering by isInCheck
  // alone doesn't catch the intermediate square.
  const homeRow = color === 'w' ? 7 : 0;
  if (r !== homeRow || c !== 4) return;
  const rights = state.castling;
  const kingSide = color === 'w' ? rights.wk : rights.bk;
  const queenSide = color === 'w' ? rights.wq : rights.bq;

  if (kingSide || queenSide) {
    // King must not currently be in check.
    if (isSquareAttacked(state, sq(homeRow, 4), opposite(color))) return;

    if (kingSide) {
      const f1 = sq(homeRow, 5);
      const g1 = sq(homeRow, 6);
      const rookSq = sq(homeRow, 7);
      const rook = state.board[rookSq];
      if (
        !state.board[f1] &&
        !state.board[g1] &&
        rook && rook.type === 'r' && rook.color === color &&
        !isSquareAttacked(state, f1, opposite(color)) &&
        !isSquareAttacked(state, g1, opposite(color))
      ) {
        out.push({ from, to: g1, isCastle: 'k' });
      }
    }
    if (queenSide) {
      const d1 = sq(homeRow, 3);
      const c1 = sq(homeRow, 2);
      const b1 = sq(homeRow, 1);
      const rookSq = sq(homeRow, 0);
      const rook = state.board[rookSq];
      if (
        !state.board[d1] &&
        !state.board[c1] &&
        !state.board[b1] &&
        rook && rook.type === 'r' && rook.color === color &&
        !isSquareAttacked(state, d1, opposite(color)) &&
        !isSquareAttacked(state, c1, opposite(color))
      ) {
        out.push({ from, to: c1, isCastle: 'q' });
      }
    }
  }
}

function pseudoMovesFor(state: BoardState, from: Square): Move[] {
  const piece = state.board[from];
  if (!piece) return [];
  const out: Move[] = [];
  switch (piece.type) {
    case 'p': pawnMoves(state, from, piece.color, out); break;
    case 'n': knightMoves(state, from, piece.color, out); break;
    case 'b': pushSlider(state, from, piece.color, BISHOP_DIRS, out); break;
    case 'r': pushSlider(state, from, piece.color, ROOK_DIRS, out); break;
    case 'q':
      pushSlider(state, from, piece.color, BISHOP_DIRS, out);
      pushSlider(state, from, piece.color, ROOK_DIRS, out);
      break;
    case 'k': kingMoves(state, from, piece.color, out); break;
  }
  return out;
}

// ─── Attack detection ──────────────────────────────────────
// Returns true if the given square is attacked by any piece of `byColor`.
// This is intentionally separate from move generation to avoid recursion
// (kings checking castling check kings...).

export function isSquareAttacked(state: BoardState, target: Square, byColor: Color): boolean {
  const tr = rowOf(target);
  const tc = colOf(target);

  // Pawn attacks: a pawn of `byColor` attacks diagonally forward.
  // For byColor='w', white pawns attack from row tr+1 to row tr (i.e. they
  // sit one row below the target in screen terms — row index tr+1).
  const pawnFromRow = byColor === 'w' ? tr + 1 : tr - 1;
  if (pawnFromRow >= 0 && pawnFromRow < 8) {
    for (const dc of [-1, 1]) {
      const nc = tc + dc;
      if (nc < 0 || nc >= 8) continue;
      const p = state.board[sq(pawnFromRow, nc)];
      if (p && p.type === 'p' && p.color === byColor) return true;
    }
  }

  // Knight
  for (const [dr, dc] of KNIGHT_DELTAS) {
    const nr = tr + dr;
    const nc = tc + dc;
    if (!inBounds(nr, nc)) continue;
    const p = state.board[sq(nr, nc)];
    if (p && p.type === 'n' && p.color === byColor) return true;
  }

  // Bishop / Queen (diagonals)
  for (const [dr, dc] of BISHOP_DIRS) {
    let nr = tr + dr, nc = tc + dc;
    while (inBounds(nr, nc)) {
      const p = state.board[sq(nr, nc)];
      if (p) {
        if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }

  // Rook / Queen (orthogonal)
  for (const [dr, dc] of ROOK_DIRS) {
    let nr = tr + dr, nc = tc + dc;
    while (inBounds(nr, nc)) {
      const p = state.board[sq(nr, nc)];
      if (p) {
        if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }

  // King (adjacent)
  for (const [dr, dc] of KING_DIRS) {
    const nr = tr + dr, nc = tc + dc;
    if (!inBounds(nr, nc)) continue;
    const p = state.board[sq(nr, nc)];
    if (p && p.type === 'k' && p.color === byColor) return true;
  }

  return false;
}

function findKing(state: BoardState, color: Color): Square {
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p && p.type === 'k' && p.color === color) return i;
  }
  return -1;
}

export function isInCheck(state: BoardState, color: Color): boolean {
  const k = findKing(state, color);
  if (k < 0) return false;
  return isSquareAttacked(state, k, opposite(color));
}

// ─── Apply move ────────────────────────────────────────────
// Pure: returns a new BoardState.

export function applyMove(state: BoardState, move: Move): BoardState {
  const board = state.board.slice();
  const piece = board[move.from];
  if (!piece) return { ...state, board };

  let captured = move.captured ?? board[move.to] ?? null;

  // Move piece
  board[move.to] = piece;
  board[move.from] = null;

  // En passant capture: remove the pawn sitting beside `from` on column of `to`.
  if (move.isEnPassant) {
    const epRow = rowOf(move.from);
    const epCol = colOf(move.to);
    captured = board[sq(epRow, epCol)] ?? captured;
    board[sq(epRow, epCol)] = null;
  }

  // Castling: also move the rook.
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

  // Promotion (auto-queen for MVP).
  if (move.promotion) {
    board[move.to] = { type: move.promotion, color: piece.color };
  }

  // Update castling rights.
  const castling: CastlingRights = { ...state.castling };
  if (piece.type === 'k') {
    if (piece.color === 'w') { castling.wk = false; castling.wq = false; }
    else { castling.bk = false; castling.bq = false; }
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
  // If a rook was captured on its starting square, lose corresponding right.
  if (move.to === sq(7, 0)) castling.wq = false;
  if (move.to === sq(7, 7)) castling.wk = false;
  if (move.to === sq(0, 0)) castling.bq = false;
  if (move.to === sq(0, 7)) castling.bk = false;

  // En-passant target: set if pawn moved 2 squares.
  let enPassantTarget: Square | null = null;
  if (piece.type === 'p' && Math.abs(rowOf(move.to) - rowOf(move.from)) === 2) {
    const midRow = (rowOf(move.from) + rowOf(move.to)) / 2;
    enPassantTarget = sq(midRow, colOf(move.from));
  }

  // Halfmove clock: reset on pawn move or capture.
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

// ─── Legal move generation (filters self-check) ────────────

export function getLegalMoves(state: BoardState, from: Square): Move[] {
  const piece = state.board[from];
  if (!piece || piece.color !== state.turn) return [];
  const pseudo = pseudoMovesFor(state, from);
  const legal: Move[] = [];
  for (const m of pseudo) {
    const trial = applyMoveRaw(state, m);
    if (!isInCheck(trial, piece.color)) legal.push(m);
  }
  return legal;
}

export function getAllLegalMoves(state: BoardState, color: Color): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (!p || p.color !== color) continue;
    const pseudo = pseudoMovesFor(state, i);
    for (const m of pseudo) {
      const trial = applyMoveRaw(state, m);
      if (!isInCheck(trial, color)) out.push(m);
    }
  }
  return out;
}

// applyMoveRaw: same as applyMove but does NOT recompute status (avoids
// recursion when called from getAllLegalMoves -> getGameStatus).
function applyMoveRaw(state: BoardState, move: Move): BoardState {
  const board = state.board.slice();
  const piece = board[move.from];
  if (!piece) return state;

  board[move.to] = piece;
  board[move.from] = null;

  if (move.isEnPassant) {
    const epRow = rowOf(move.from);
    const epCol = colOf(move.to);
    board[sq(epRow, epCol)] = null;
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

// ─── Game status ───────────────────────────────────────────

export function getGameStatus(state: BoardState): { status: BoardState['status']; winner: BoardState['winner'] } {
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
