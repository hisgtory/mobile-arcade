import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  GRID_SIZE,
  type BoardState,
  type GameConfig,
  type Player,
} from '../types';
import { createBoard, makeMove, getAIMove } from '../logic/board';

const CELL_SIZE = 100;
const LINE_WIDTH = 4;
const GRID_COLOR = 0xd1d5db;
const X_COLOR = 0xef4444;
const O_COLOR = 0x3b82f6;
const WIN_LINE_COLOR = 0x22c55e;

type Phase = 'player_turn' | 'ai_turn' | 'game_over';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;
  private phase: Phase = 'player_turn';
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cellSize = 0;
  private roundsPlayed = 0;
  private playerScore = 0;
  private aiScore = 0;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    this.startNewRound();
  }

  private startNewRound() {
    this.board = createBoard();
    this.phase = 'player_turn';
    this.drawBoard();
    this.emitState();
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear everything
    this.children.removeAll(true);

    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;
    this.cellSize = CELL_SIZE * scale;
    const gridSize = this.cellSize * GRID_SIZE;
    this.gridOriginX = (w - gridSize) / 2;
    this.gridOriginY = (h - gridSize) / 2 - 20 * scale;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0xf0f2f5);

    // Grid lines
    const g = this.add.graphics();
    g.lineStyle(LINE_WIDTH * scale, GRID_COLOR, 1);

    for (let i = 1; i < GRID_SIZE; i++) {
      // Vertical
      const vx = this.gridOriginX + i * this.cellSize;
      g.moveTo(vx, this.gridOriginY);
      g.lineTo(vx, this.gridOriginY + gridSize);
      // Horizontal
      const hy = this.gridOriginY + i * this.cellSize;
      g.moveTo(this.gridOriginX, hy);
      g.lineTo(this.gridOriginX + gridSize, hy);
    }
    g.strokePath();

    // Draw marks
    for (let i = 0; i < 9; i++) {
      const cell = this.board.cells[i];
      if (cell) {
        const { cx, cy } = this.cellCenter(i);
        this.drawMark(cx, cy, cell, false);
      }
    }

    // Win line
    if (this.board.winLine) {
      this.drawWinLine(this.board.winLine);
    }

    // Hit areas (only if game not over)
    if (!this.board.winner && this.phase === 'player_turn') {
      for (let i = 0; i < 9; i++) {
        if (this.board.cells[i] !== null) continue;
        const { cx, cy } = this.cellCenter(i);
        const hit = this.add
          .rectangle(cx, cy, this.cellSize - 4, this.cellSize - 4)
          .setInteractive()
          .setAlpha(0.001);
        hit.on('pointerdown', () => this.onCellTap(i));
      }
    }

    // Status text
    this.drawStatus();
  }

  private cellCenter(index: number): { cx: number; cy: number } {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return {
      cx: this.gridOriginX + col * this.cellSize + this.cellSize / 2,
      cy: this.gridOriginY + row * this.cellSize + this.cellSize / 2,
    };
  }

  private drawMark(cx: number, cy: number, mark: Player, animate: boolean) {
    const scale = this.dpr;
    const size = this.cellSize * 0.3;

    if (mark === 'X') {
      const g = this.add.graphics();
      g.lineStyle(6 * scale, X_COLOR, 1);
      g.moveTo(cx - size, cy - size);
      g.lineTo(cx + size, cy + size);
      g.moveTo(cx + size, cy - size);
      g.lineTo(cx - size, cy + size);
      g.strokePath();

      if (animate) {
        g.setScale(0);
        this.tweens.add({ targets: g, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
      }
    } else {
      const g = this.add.graphics();
      g.lineStyle(6 * scale, O_COLOR, 1);
      g.strokeCircle(cx, cy, size);

      if (animate) {
        g.setScale(0);
        this.tweens.add({ targets: g, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
      }
    }
  }

  private drawWinLine(line: number[]) {
    const scale = this.dpr;
    const start = this.cellCenter(line[0]);
    const end = this.cellCenter(line[2]);

    const g = this.add.graphics();
    g.lineStyle(8 * scale, WIN_LINE_COLOR, 0.8);
    g.moveTo(start.cx, start.cy);
    g.lineTo(end.cx, end.cy);
    g.strokePath();
    g.setDepth(100);

    // Animate
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 300, ease: 'Cubic.easeIn' });
  }

  private drawStatus() {
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const gridBottom = this.gridOriginY + GRID_SIZE * this.cellSize;

    let text = '';
    let color = '#6B7280';

    if (this.board.winner === 'X') {
      text = 'You Win!';
      color = '#22C55E';
    } else if (this.board.winner === 'O') {
      text = 'AI Wins!';
      color = '#EF4444';
    } else if (this.board.winner === 'draw') {
      text = 'Draw!';
      color = '#EAB308';
    } else if (this.phase === 'player_turn') {
      text = 'Your turn (X)';
    } else {
      text = 'AI thinking...';
    }

    const statusText = this.add.text(w / 2, gridBottom + 30 * scale, text, {
      fontSize: `${20 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color,
      fontStyle: 'bold',
    });
    statusText.setOrigin(0.5);

    // Play Again button if game over
    if (this.board.winner) {
      const btnY = gridBottom + 80 * scale;
      const btn = this.add.graphics();
      btn.fillStyle(0x2563eb, 1);
      btn.fillRoundedRect(w / 2 - 80 * scale, btnY - 20 * scale, 160 * scale, 44 * scale, 12 * scale);

      const btnText = this.add.text(w / 2, btnY + 2 * scale, 'Play Again', {
        fontSize: `${16 * scale}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      btnText.setOrigin(0.5);

      const hitArea = this.add
        .rectangle(w / 2, btnY, 160 * scale, 44 * scale)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => {
        this.roundsPlayed++;
        this.startNewRound();
      });
    }
  }

  // ─── Interaction ──────────────────────────────────────

  private onCellTap(index: number) {
    if (this.phase !== 'player_turn') return;

    const next = makeMove(this.board, index);
    if (!next) return;

    this.board = next;

    // Animate player mark
    const { cx, cy } = this.cellCenter(index);
    this.drawMark(cx, cy, 'X', true);

    if (this.board.winner) {
      if (this.board.winner === 'X') this.playerScore++;
      this.onGameEnd();
      return;
    }

    // AI turn
    this.phase = 'ai_turn';
    this.drawBoard();

    this.time.delayedCall(400 + Math.random() * 300, () => {
      this.doAIMove();
    });
  }

  private doAIMove() {
    const difficulty = this.config.difficulty ?? 'medium';
    const aiIndex = getAIMove(this.board, difficulty);
    if (aiIndex < 0) return;

    const next = makeMove(this.board, aiIndex);
    if (!next) return;

    this.board = next;

    if (this.board.winner) {
      if (this.board.winner === 'O') this.aiScore++;
      this.drawBoard();
      this.onGameEnd();
      return;
    }

    this.phase = 'player_turn';
    this.drawBoard();
    this.emitState();
  }

  private onGameEnd() {
    this.phase = 'game_over';
    this.drawBoard();
    this.emitState();

    // Emit game result
    this.time.delayedCall(800, () => {
      this.game.events.emit('round-end', {
        winner: this.board.winner,
        playerScore: this.playerScore,
        aiScore: this.aiScore,
        roundsPlayed: this.roundsPlayed + 1,
      });
    });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', {
      playerScore: this.playerScore,
      aiScore: this.aiScore,
      roundsPlayed: this.roundsPlayed,
    });
  }
}
