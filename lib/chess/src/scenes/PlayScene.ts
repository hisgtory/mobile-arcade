import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  type BoardState,
  type Color,
  type GameConfig,
  type Move,
  type Piece,
  type Square,
} from '../types';
import {
  applyMove,
  createInitialBoard,
  getLegalMoves,
} from '../logic/rules';
import { createAI, type ChessAI } from '../logic/ai';

const LIGHT_SQUARE = 0xf0d9b5;
const DARK_SQUARE = 0xb58863;
const SELECTED_SQUARE = 0xf7ec74;
const LAST_MOVE_TINT = 0xf7ec74;
const LEGAL_DOT_COLOR = 0x646f40;
const BG_COLOR = 0x312e2b;

const PIECE_GLYPH: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

type Phase = 'player_turn' | 'ai_turn' | 'game_over';

export class PlayScene extends Phaser.Scene {
  private state!: BoardState;
  private config!: GameConfig;
  private dpr = 1;
  private phase: Phase = 'player_turn';
  private playerColor: Color = 'w';
  private ai!: ChessAI;

  private boardOriginX = 0;
  private boardOriginY = 0;
  private cellSize = 0;

  private selected: Square | null = null;
  private legalForSelected: Move[] = [];

  private playerWins = 0;
  private aiWins = 0;
  private draws = 0;
  private aiMoveTimer: Phaser.Time.TimerEvent | null = null;
  private roundEndTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
    this.playerColor = this.config.playerColor ?? 'w';
    this.ai = createAI(this.config.difficulty ?? 'medium');
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearTimers();
    });
    this.startNewGame();
  }

  private startNewGame() {
    this.clearTimers();
    this.state = createInitialBoard();
    this.selected = null;
    this.legalForSelected = [];
    this.phase = this.state.turn === this.playerColor ? 'player_turn' : 'ai_turn';
    this.draw();
    this.emitState();
    if (this.phase === 'ai_turn') {
      this.scheduleAI();
    }
  }

  // ─── Drawing ──────────────────────────────────────────

  private draw() {
    this.children.removeAll(true);

    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;

    this.add.rectangle(w / 2, h / 2, w, h, BG_COLOR);

    const boardSize = Math.min(w - 16 * scale, h - 140 * scale);
    this.cellSize = boardSize / 8;
    this.boardOriginX = (w - boardSize) / 2;
    this.boardOriginY = (h - boardSize) / 2 + 10 * scale;

    // Squares
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        const baseColor = isLight ? LIGHT_SQUARE : DARK_SQUARE;
        const x = this.boardOriginX + c * this.cellSize + this.cellSize / 2;
        const y = this.boardOriginY + r * this.cellSize + this.cellSize / 2;
        this.add.rectangle(x, y, this.cellSize, this.cellSize, baseColor);
      }
    }

    // Last-move tint
    if (this.state.lastMove) {
      this.tintSquare(this.state.lastMove.from, LAST_MOVE_TINT, 0.35);
      this.tintSquare(this.state.lastMove.to, LAST_MOVE_TINT, 0.35);
    }

    // Selected highlight
    if (this.selected !== null) {
      this.tintSquare(this.selected, SELECTED_SQUARE, 0.55);
    }

    // Pieces
    for (let i = 0; i < 64; i++) {
      const p = this.state.board[i];
      if (p) this.drawPiece(i, p);
    }

    // Legal-move dots
    for (const m of this.legalForSelected) {
      const { cx, cy } = this.squareCenter(m.to);
      const isCapture = !!m.captured || !!m.isEnPassant;
      const dot = this.add.graphics();
      if (isCapture) {
        dot.lineStyle(3 * scale, LEGAL_DOT_COLOR, 0.85);
        dot.strokeCircle(cx, cy, this.cellSize * 0.45);
      } else {
        dot.fillStyle(LEGAL_DOT_COLOR, 0.55);
        dot.fillCircle(cx, cy, this.cellSize * 0.14);
      }
    }

    // Hit areas (entire board, both for piece selection and target moves)
    if (this.phase === 'player_turn') {
      for (let i = 0; i < 64; i++) {
        const { cx, cy } = this.squareCenter(i);
        const hit = this.add
          .rectangle(cx, cy, this.cellSize, this.cellSize)
          .setInteractive()
          .setAlpha(0.001);
        const sqIndex = i;
        hit.on('pointerdown', () => this.onSquareTap(sqIndex));
      }
    }

    this.drawStatus();
  }

  private tintSquare(s: Square, color: number, alpha: number) {
    const { cx, cy } = this.squareCenter(s);
    this.add.rectangle(cx, cy, this.cellSize, this.cellSize, color, alpha);
  }

  private squareCenter(s: Square): { cx: number; cy: number } {
    const r = s >> 3;
    const c = s & 7;
    return {
      cx: this.boardOriginX + c * this.cellSize + this.cellSize / 2,
      cy: this.boardOriginY + r * this.cellSize + this.cellSize / 2,
    };
  }

  private drawPiece(s: Square, piece: Piece) {
    const { cx, cy } = this.squareCenter(s);
    const glyph = PIECE_GLYPH[`${piece.color}${piece.type}`];
    const fontSize = Math.floor(this.cellSize * 0.82);
    const isWhite = piece.color === 'w';

    const t = this.add.text(cx, cy, glyph, {
      fontSize: `${fontSize}px`,
      fontFamily: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Sans Symbols2", system-ui, sans-serif',
      color: isWhite ? '#FFFFFF' : '#1A1A1A',
      stroke: isWhite ? '#1A1A1A' : '#FFFFFF',
      strokeThickness: Math.max(1, Math.floor(this.cellSize * 0.025)),
    });
    t.setOrigin(0.5, 0.55);
  }

  private drawStatus() {
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;

    let text = '';
    let color = '#E5E7EB';

    if (this.state.status === 'checkmate') {
      const youWon = this.state.winner === this.playerColor;
      text = youWon ? 'Checkmate — You Win!' : 'Checkmate — AI Wins';
      color = youWon ? '#22C55E' : '#EF4444';
    } else if (this.state.status === 'stalemate') {
      text = 'Stalemate — Draw';
      color = '#EAB308';
    } else if (this.state.status === 'check') {
      text = this.state.turn === this.playerColor ? 'Check!' : 'AI in Check';
      color = '#F97316';
    } else if (this.phase === 'player_turn') {
      text = 'Your turn';
    } else if (this.phase === 'ai_turn') {
      text = 'AI thinking...';
    }

    const topY = this.boardOriginY - 28 * scale;
    const status = this.add.text(w / 2, topY, text, {
      fontSize: `${18 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color,
      fontStyle: 'bold',
    });
    status.setOrigin(0.5);

    if (this.phase === 'game_over') {
      const btnY = this.boardOriginY + 8 * this.cellSize + 36 * scale;
      const btn = this.add.graphics();
      btn.fillStyle(0x2563eb, 1);
      btn.fillRoundedRect(w / 2 - 80 * scale, btnY - 22 * scale, 160 * scale, 44 * scale, 12 * scale);

      const btnText = this.add.text(w / 2, btnY, 'Play Again', {
        fontSize: `${16 * scale}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      btnText.setOrigin(0.5);

      const hit = this.add
        .rectangle(w / 2, btnY, 160 * scale, 44 * scale)
        .setInteractive()
        .setAlpha(0.001);
      hit.on('pointerdown', () => this.startNewGame());
    }
  }

  // ─── Interaction ──────────────────────────────────────

  private onSquareTap(s: Square) {
    if (this.phase !== 'player_turn') return;

    // If a piece is selected and the tap matches a legal move, execute it.
    if (this.selected !== null) {
      const move = this.legalForSelected.find((m) => m.to === s);
      if (move) {
        this.executeMove(move);
        return;
      }
    }

    // Otherwise, attempt to (re)select.
    const piece = this.state.board[s];
    if (piece && piece.color === this.playerColor) {
      this.selected = s;
      this.legalForSelected = getLegalMoves(this.state, s);
      this.game.events.emit('piece-tapped');
      this.draw();
      return;
    }

    // Tap on empty/enemy with nothing selected: clear selection.
    if (this.selected !== null) {
      this.selected = null;
      this.legalForSelected = [];
      this.draw();
    }
  }

  private executeMove(move: Move) {
    const isCapture = !!move.captured || !!move.isEnPassant;
    const next = applyMove(this.state, move);
    this.state = next;
    this.selected = null;
    this.legalForSelected = [];

    this.game.events.emit('piece-moved');
    if (isCapture) this.game.events.emit('piece-captured');

    if (next.status === 'check') this.game.events.emit('check');

    if (this.isTerminal(next)) {
      this.handleGameEnd();
      return;
    }

    this.phase = 'ai_turn';
    this.draw();
    this.scheduleAI();
  }

  private scheduleAI() {
    this.aiMoveTimer?.remove(false);
    this.aiMoveTimer = this.time.delayedCall(400 + Math.random() * 250, () => {
      this.aiMoveTimer = null;
      this.doAIMove();
    });
  }

  private doAIMove() {
    if (this.phase !== 'ai_turn') return;
    const move = this.ai.selectMove(this.state);
    if (!move) {
      // No legal moves — game should already be over; recompute status.
      this.phase = 'game_over';
      this.draw();
      return;
    }
    const isCapture = !!move.captured || !!move.isEnPassant;
    const next = applyMove(this.state, move);
    this.state = next;

    this.game.events.emit('piece-moved');
    if (isCapture) this.game.events.emit('piece-captured');
    if (next.status === 'check') this.game.events.emit('check');

    if (this.isTerminal(next)) {
      this.handleGameEnd();
      return;
    }

    this.phase = 'player_turn';
    this.draw();
    this.emitState();
  }

  private isTerminal(s: BoardState): boolean {
    return s.status === 'checkmate' || s.status === 'stalemate';
  }

  private handleGameEnd() {
    this.phase = 'game_over';
    if (this.state.status === 'checkmate') {
      this.game.events.emit('checkmate');
      if (this.state.winner === this.playerColor) this.playerWins++;
      else this.aiWins++;
    } else {
      this.draws++;
    }

    this.draw();
    this.emitState();

    const winner =
      this.state.winner === this.playerColor
        ? 'player'
        : this.state.winner === 'draw'
          ? 'draw'
          : 'ai';
    const playerWins = this.playerWins;
    const aiWins = this.aiWins;
    const draws = this.draws;

    this.roundEndTimer?.remove(false);
    this.roundEndTimer = this.time.delayedCall(600, () => {
      this.roundEndTimer = null;
      this.game.events.emit('round-end', {
        winner,
        playerWins,
        aiWins,
        draws,
      });
    });
  }

  private clearTimers() {
    this.aiMoveTimer?.remove(false);
    this.aiMoveTimer = null;
    this.roundEndTimer?.remove(false);
    this.roundEndTimer = null;
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    const { whiteMaterial, blackMaterial } = this.computeMaterial();
    this.game.events.emit('score-update', {
      turn: this.state.turn,
      status: this.state.status,
      playerWins: this.playerWins,
      aiWins: this.aiWins,
      draws: this.draws,
      whiteMaterial,
      blackMaterial,
    });
  }

  private computeMaterial(): { whiteMaterial: number; blackMaterial: number } {
    const value: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let w = 0, b = 0;
    for (const p of this.state.board) {
      if (!p) continue;
      if (p.color === 'w') w += value[p.type];
      else b += value[p.type];
    }
    return { whiteMaterial: w, blackMaterial: b };
  }
}
