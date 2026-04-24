import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  type BoardState,
  type Color,
  type GameConfig,
  type Move,
  type Piece,
  type PieceType,
  type Square,
} from '../types';
import {
  applyMove,
  createInitialBoard,
  getLegalMoves,
  isInsufficientMaterial,
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

type PromotionPrompt = {
  moves: Move[];
};

export class PlayScene extends Phaser.Scene {
  private state!: BoardState;
  private gameConfig?: GameConfig;
  private dpr = 1;
  private phase: Phase = 'player_turn';
  private playerColor: Color = 'w';
  private ai!: ChessAI;
  private boardOriginX = 0;
  private boardOriginY = 0;
  private cellSize = 0;
  private selected: Square | null = null;
  private legalForSelected: Move[] = [];
  private promotionPrompt: PromotionPrompt | null = null;
  private playerWins = 0;
  private aiWins = 0;
  private draws = 0;
  private aiMoveTimer: Phaser.Time.TimerEvent | null = null;
  private roundEndTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number }): void {
    // TODO: Use Phaser registry or scene data for better type safety
    this.gameConfig = this.game.registry.get('chessConfig') as GameConfig;
    this.dpr = this.game.registry.get('dpr') || 1;
    this.playerColor = this.gameConfig?.playerColor ?? 'w';
    this.ai = createAI(this.gameConfig?.difficulty ?? 'medium');
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearScheduledCallbacks());
    this.startNewGame();
  }

  private startNewGame() {
    this.clearScheduledCallbacks();
    this.state = createInitialBoard();

    // Initialize clocks from config
    const initialTime = (this.gameConfig?.timeControl?.initialSeconds ?? 600) * 1000;
    this.state.clocks = { w: initialTime, b: initialTime };

    this.selected = null;
    this.legalForSelected = [];
    this.promotionPrompt = null;
    this.phase = this.state.turn === this.playerColor ? 'player_turn' : 'ai_turn';
    this.draw();
    this.emitState();
    if (this.phase === 'ai_turn') {
      this.scheduleAI();
    }
  }

  private clearScheduledCallbacks() {
    this.aiMoveTimer?.remove(false);
    this.roundEndTimer?.remove(false);
    this.aiMoveTimer = null;
    this.roundEndTimer = null;
  }

  // ─── Drawing ──────────────────────────────────────────

  private draw() {
    this.children.removeAll(true);

    const scale = this.dpr;
    const width = DEFAULT_WIDTH * scale;
    const height = DEFAULT_HEIGHT * scale;

    this.add.rectangle(width / 2, height / 2, width, height, BG_COLOR);

    const boardSize = Math.min(width - 16 * scale, height - 140 * scale);
    this.cellSize = boardSize / 8;
    this.boardOriginX = (width - boardSize) / 2;
    this.boardOriginY = (height - boardSize) / 2 + 10 * scale;

    // Squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        const baseColor = isLight ? LIGHT_SQUARE : DARK_SQUARE;
        const x = this.boardOriginX + col * this.cellSize + this.cellSize / 2;
        const y = this.boardOriginY + row * this.cellSize + this.cellSize / 2;
        this.add.rectangle(x, y, this.cellSize, this.cellSize, baseColor);

        // Coordinates
        const coordColor = isLight ? '#b58863' : '#f0d9b5';
        const fontSize = Math.floor(10 * scale);
        const padding = 2 * scale;

        // Rank (1-8) on the left side
        if (col === 0) {
          const rank = 8 - row;
          this.add.text(x - this.cellSize / 2 + padding, y - this.cellSize / 2 + padding, rank.toString(), {
            fontSize: `${fontSize}px`,
            fontFamily: 'system-ui, sans-serif',
            color: coordColor,
            fontStyle: 'bold',
          });
        }

        // File (a-h) on the bottom side
        if (row === 7) {
          const file = String.fromCharCode(97 + col);
          this.add.text(x + this.cellSize / 2 - padding, y + this.cellSize / 2 - padding, file, {
            fontSize: `${fontSize}px`,
            fontFamily: 'system-ui, sans-serif',
            color: coordColor,
            fontStyle: 'bold',
          }).setOrigin(1, 1);
        }
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
    for (let index = 0; index < 64; index++) {
      const piece = this.state.board[index];
      if (piece) this.drawPiece(index, piece);
    }

    // Legal-move dots
    const markerKeys = new Set<string>();
    for (const move of this.legalForSelected) {
      const markerKey = `${move.to}:${move.captured ? 'capture' : move.isEnPassant ? 'capture' : 'quiet'}`;
      if (markerKeys.has(markerKey)) continue;
      markerKeys.add(markerKey);
      
      const { cx, cy } = this.squareCenter(move.to);
      const isCapture = !!move.captured || !!move.isEnPassant;
      const marker = this.add.graphics();
      if (isCapture) {
        marker.lineStyle(3 * scale, LEGAL_DOT_COLOR, 0.85);
        marker.strokeCircle(cx, cy, this.cellSize * 0.45);
      } else {
        marker.fillStyle(LEGAL_DOT_COLOR, 0.55);
        marker.fillCircle(cx, cy, this.cellSize * 0.14);
      }
    }

    if (this.phase === 'player_turn' && !this.promotionPrompt) {
      for (let index = 0; index < 64; index++) {
        const { cx, cy } = this.squareCenter(index);
        const hitArea = this.add
          .rectangle(cx, cy, this.cellSize, this.cellSize)
          .setInteractive()
          .setAlpha(0.001);
        hitArea.on('pointerdown', () => this.onSquareTap(index));
      }
    }

    this.drawStatus();
    this.drawMoveHistory();
    this.drawPromotionPrompt();
  }

  private drawMoveHistory() {
    const scale = this.dpr;
    const width = DEFAULT_WIDTH * scale;

    let historyText = '';
    const history = this.state.history;
    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = history[i];
      const blackMove = history[i + 1] || '';
      historyText += `${moveNum}. ${whiteMove} ${blackMove}  `;
    }

    const turns = historyText.trim().split('  ');
    if (turns.length > 3) {
      historyText = '... ' + turns.slice(-3).join('  ');
    }

    const y = this.boardOriginY - 52 * scale;
    const text = this.add.text(width / 2, y, historyText.trim(), {
      fontSize: `${13 * scale}px`,
      fontFamily: 'system-ui, sans-serif',
      color: '#9CA3AF',
    });
    text.setOrigin(0.5);
  }

  private tintSquare(square: Square, color: number, alpha: number) {
    const { cx, cy } = this.squareCenter(square);
    this.add.rectangle(cx, cy, this.cellSize, this.cellSize, color, alpha);
  }

  private squareCenter(square: Square): { cx: number; cy: number } {
    const row = square >> 3;
    const col = square & 7;
    return {
      cx: this.boardOriginX + col * this.cellSize + this.cellSize / 2,
      cy: this.boardOriginY + row * this.cellSize + this.cellSize / 2,
    };
  }

  private drawPiece(square: Square, piece: Piece) {
    const { cx, cy } = this.squareCenter(square);
    const glyph = PIECE_GLYPH[`${piece.color}${piece.type}`];
    const fontSize = Math.floor(this.cellSize * 0.82);
    const isWhite = piece.color === 'w';

    const text = this.add.text(cx, cy, glyph, {
      fontSize: `${fontSize}px`,
      fontFamily: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Sans Symbols2", system-ui, sans-serif',
      color: isWhite ? '#FFFFFF' : '#1A1A1A',
      stroke: isWhite ? '#1A1A1A' : '#FFFFFF',
      strokeThickness: Math.max(1, Math.floor(this.cellSize * 0.025)),
    });
    text.setOrigin(0.5, 0.55);
  }

  private drawStatus() {
    const scale = this.dpr;
    const width = DEFAULT_WIDTH * scale;

    let text = '';
    let color = '#E5E7EB';

    if (this.state.status === 'checkmate') {
      const youWon = this.state.winner === this.playerColor;
      text = youWon ? 'Checkmate - You Win!' : 'Checkmate - AI Wins';
      color = youWon ? '#22C55E' : '#EF4444';
    } else if (this.state.status === 'stalemate') {
      text = 'Stalemate - Draw';
      color = '#EAB308';
    } else if (this.state.status === 'draw_repetition') {
      text = 'Draw - 3-fold Repetition';
      color = '#EAB308';
    } else if (this.state.status === 'draw_50move') {
      text = 'Draw - 50-Move Rule';
      color = '#EAB308';
    } else if (this.state.status === 'draw_material') {
      text = 'Draw - Insufficient Material';
      color = '#EAB308';
    } else if (this.state.status === 'timeout') {
      const youWon = this.state.winner === this.playerColor;
      text = youWon ? 'Time Out - You Win!' : 'Time Out - AI Wins';
      color = youWon ? '#22C55E' : '#EF4444';
    } else if (this.state.status === 'draw_timeout') {
      text = 'Time Out - Draw (Insufficient Material)';
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
    const status = this.add.text(width / 2, topY, text, {
      fontSize: `${18 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color,
      fontStyle: 'bold',
    });
    status.setOrigin(0.5);

    this.drawClocks();

    if (this.phase === 'game_over') {
      const buttonY = this.boardOriginY + 8 * this.cellSize + 36 * scale;
      const button = this.add.graphics();
      button.fillStyle(0x2563eb, 1);
      button.fillRoundedRect(width / 2 - 80 * scale, buttonY - 22 * scale, 160 * scale, 44 * scale, 12 * scale);

      const buttonText = this.add.text(width / 2, buttonY, 'Play Again', {
        fontSize: `${16 * scale}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      buttonText.setOrigin(0.5);

      const hitArea = this.add
        .rectangle(width / 2, buttonY, 160 * scale, 44 * scale)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => this.startNewGame());
    }
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (ms < 10000 && ms > 0) {
      const tenths = Math.floor((ms % 1000) / 100);
      return `${totalSeconds - 1}.${tenths}`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private drawClocks() {
    const scale = this.dpr;
    const width = DEFAULT_WIDTH * scale;
    const height = DEFAULT_HEIGHT * scale;

    const whiteClockStr = this.formatTime(this.state.clocks.w);
    const blackClockStr = this.formatTime(this.state.clocks.b);

    const clockWidth = 70 * scale;
    const clockHeight = 32 * scale;
    const margin = 10 * scale;

    // AI Clock (Top Right)
    const aiX = this.boardOriginX + 8 * this.cellSize - clockWidth / 2;
    const aiY = this.boardOriginY - clockHeight / 2 - 28 * scale;
    this.drawClock(aiX, aiY, blackClockStr, this.state.turn === 'b');

    // Player Clock (Bottom Right)
    const pX = this.boardOriginX + 8 * this.cellSize - clockWidth / 2;
    const pY = this.boardOriginY + 8 * this.cellSize + clockHeight / 2 + 8 * scale;
    this.drawClock(pX, pY, whiteClockStr, this.state.turn === 'w');
  }

  private drawClock(x: number, y: number, timeStr: string, isActive: boolean) {
    const scale = this.dpr;
    const width = 72 * scale;
    const height = 30 * scale;

    const bg = this.add.graphics();
    bg.fillStyle(isActive ? 0xffffff : 0x000000, isActive ? 1 : 0.4);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 4 * scale);

    const text = this.add.text(x, y, timeStr, {
      fontSize: `${18 * scale}px`,
      fontFamily: 'monospace',
      color: isActive ? '#000000' : '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
  }

  update(time: number, delta: number) {
    if (this.phase === 'game_over') return;

    // Tick the current player's clock
    this.state.clocks[this.state.turn] -= delta;

    if (this.state.clocks[this.state.turn] <= 0) {
      this.state.clocks[this.state.turn] = 0;
      this.handleTimeout();
    }

    this.drawStatus(); // This includes drawClocks()
  }

  private handleTimeout() {
    const turn = this.state.turn;
    const opponent = turn === 'w' ? 'b' : 'w';

    // FIDE rule: If opponent has no legal sequence to mate, it's a draw.
    // We simplify by using isInsufficientMaterial.
    const isOpponentInsufficient = isInsufficientMaterial(this.state.board);
    
    if (isOpponentInsufficient) {
      this.state.status = 'draw_timeout';
      this.state.winner = 'draw';
    } else {
      this.state.status = 'timeout';
      this.state.winner = opponent;
    }

    this.handleGameEnd();
  }

  private executeMove(move: Move) {
    const isCapture = !!move.captured || !!move.isEnPassant;
    
    // Add increment
    const increment = (this.gameConfig?.timeControl?.incrementSeconds ?? 0) * 1000;
    this.state.clocks[this.state.turn] += increment;

    this.state = applyMove(this.state, move);
    this.selected = null;
    this.legalForSelected = [];
    this.promotionPrompt = null;

    this.game.events.emit('piece-moved');
    if (isCapture) this.game.events.emit('piece-captured');
    if (this.state.status === 'check') this.game.events.emit('check');

    if (this.isTerminal(this.state)) {
      this.handleGameEnd();
      return;
    }

    this.phase = 'ai_turn';
    this.draw();
    this.emitState();
    this.scheduleAI();
  }

  private drawPromotionPrompt() {
    if (!this.promotionPrompt) return;

    const scale = this.dpr;
    const width = DEFAULT_WIDTH * scale;
    const height = DEFAULT_HEIGHT * scale;
    const options: PieceType[] = ['q', 'r', 'b', 'n'];
    const panelWidth = Math.min(this.cellSize * 6.2, width - 32 * scale);
    const panelHeight = this.cellSize * 1.85;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;
    const optionWidth = panelWidth / options.length;
    const optionHeight = panelHeight - 56 * scale;

    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x030712, 0.5);
    backdrop.setInteractive();
    backdrop.on('pointerdown', () => {
      this.promotionPrompt = null;
      this.draw();
    });

    const panel = this.add.graphics();
    panel.fillStyle(0x111827, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16 * scale);
    panel.lineStyle(2 * scale, 0xf9fafb, 0.12);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16 * scale);

    const title = this.add.text(width / 2, panelY + 22 * scale, 'Choose Promotion', {
      fontSize: `${16 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#F9FAFB',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    for (let index = 0; index < options.length; index++) {
      const pieceType = options[index];
      const optionX = panelX + index * optionWidth;
      const buttonX = optionX + 8 * scale;
      const buttonY = panelY + 40 * scale;
      const centerX = optionX + optionWidth / 2;
      const centerY = buttonY + optionHeight / 2;

      const button = this.add.graphics();
      button.fillStyle(0xf9fafb, 1);
      button.fillRoundedRect(buttonX, buttonY, optionWidth - 16 * scale, optionHeight, 12 * scale);

      const glyph = PIECE_GLYPH[`${this.playerColor}${pieceType}`];
      const pieceText = this.add.text(centerX, centerY, glyph, {
        fontSize: `${Math.floor(this.cellSize * 0.62)}px`,
        fontFamily: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Sans Symbols2", system-ui, sans-serif',
        color: '#111827',
        stroke: '#ffffff',
        strokeThickness: Math.max(1, Math.floor(this.cellSize * 0.02)),
      });
      pieceText.setOrigin(0.5, 0.55);

      const hitArea = this.add
        .rectangle(centerX, centerY, optionWidth - 16 * scale, optionHeight)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => this.confirmPromotion(pieceType));
    }
  }

  private onSquareTap(square: Square) {
    if (this.phase !== 'player_turn' || this.promotionPrompt) return;

    if (this.selected !== null) {
      const candidates = this.legalForSelected.filter((candidate) => candidate.to === square);
      if (candidates.length > 0) {
        const promotionMoves = candidates.filter((candidate) => candidate.promotion);
        if (promotionMoves.length > 0) {
          this.promotionPrompt = { moves: promotionMoves };
          this.draw();
          return;
        }
        this.executeMove(candidates[0]);
        return;
      }
    }

    const piece = this.state.board[square];
    if (piece && piece.color === this.playerColor) {
      this.selected = square;
      this.legalForSelected = getLegalMoves(this.state, square);
      this.game.events.emit('piece-tapped');
      this.draw();
      return;
    }

    if (this.selected !== null) {
      this.selected = null;
      this.legalForSelected = [];
      this.draw();
    }
  }

  private confirmPromotion(pieceType: PieceType) {
    if (!this.promotionPrompt) return;

    const move = this.promotionPrompt.moves.find((candidate) => candidate.promotion === pieceType);
    this.promotionPrompt = null;
    if (!move) {
      this.draw();
      return;
    }
    this.executeMove(move);
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
      this.phase = 'game_over';
      this.draw();
      return;
    }

    const isCapture = !!move.captured || !!move.isEnPassant;

    // Add increment
    const increment = (this.gameConfig?.timeControl?.incrementSeconds ?? 0) * 1000;
    this.state.clocks[this.state.turn] += increment;

    this.state = applyMove(this.state, move);

    this.game.events.emit('piece-moved');
    if (isCapture) this.game.events.emit('piece-captured');
    if (this.state.status === 'check') this.game.events.emit('check');

    if (this.isTerminal(this.state)) {
      this.handleGameEnd();
      return;
    }

    this.phase = 'player_turn';
    this.draw();
    this.emitState();
  }

  private isTerminal(state: BoardState): boolean {
    return (
      state.status === 'checkmate' ||
      state.status === 'stalemate' ||
      state.status === 'timeout' ||
      state.status === 'draw_timeout'
    );
  }

  private handleGameEnd() {
    this.phase = 'game_over';
    if (this.state.status === 'checkmate') {
      this.game.events.emit('checkmate');
      if (this.state.winner === this.playerColor) this.playerWins++;
      else this.aiWins++;
    } else if (this.state.status === 'timeout') {
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
    let whiteMaterial = 0;
    let blackMaterial = 0;

    for (const piece of this.state.board) {
      if (!piece) continue;
      if (piece.color === 'w') whiteMaterial += value[piece.type];
      else blackMaterial += value[piece.type];
    }

    return { whiteMaterial, blackMaterial };
  }

  shutdown(): void {
    this.clearScheduledCallbacks();
    this.tweens.killAll();
  }
}
