import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  type BoardState,
  type GameConfig,
  type Player,
  getGridConfig,
} from '../types';
import { createBoard, makeMove, getAIMove } from '../logic/board';

const BASE_CELL_SIZE = 100;
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
  private winStreak = 0;
  private currentGridSize = 3;
  private currentMatchLength = 3;

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
    const prev = this.currentGridSize;
    const gridConfig = getGridConfig(this.winStreak);
    this.currentGridSize = gridConfig.gridSize;
    this.currentMatchLength = gridConfig.matchLength;

    // Emit grid-upgrade if grid grew
    if (this.currentGridSize > prev) {
      this.game.events.emit('grid-upgrade', {
        gridSize: this.currentGridSize,
        matchLength: this.currentMatchLength,
      });
      // Show upgrade text briefly before starting
      this.showUpgradeText(`${this.currentGridSize}x${this.currentGridSize}!`, () => {
        this.board = createBoard(this.currentGridSize, this.currentMatchLength);
        this.phase = 'player_turn';
        this.drawBoard();
        this.emitState();
      });
      return;
    }

    this.board = createBoard(this.currentGridSize, this.currentMatchLength);
    this.phase = 'player_turn';
    this.drawBoard();
    this.emitState();
  }

  private showUpgradeText(text: string, onComplete: () => void) {
    this.children.removeAll(true);
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;

    this.add.rectangle(w / 2, h / 2, w, h, 0xf0f2f5);

    const upgradeText = this.add.text(w / 2, h / 2, text, {
      fontSize: `${48 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#2563EB',
      fontStyle: 'bold',
    });
    upgradeText.setOrigin(0.5);
    upgradeText.setScale(0);

    this.tweens.add({
      targets: upgradeText,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(600, () => {
          this.tweens.add({
            targets: upgradeText,
            alpha: 0,
            duration: 200,
            onComplete: () => onComplete(),
          });
        });
      },
    });
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard(animateIndex?: number) {
    this.children.removeAll(true);

    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;
    const gs = this.currentGridSize;

    // Scale cell size down for bigger grids
    this.cellSize = (BASE_CELL_SIZE * (3 / gs)) * scale;
    const gridPixelSize = this.cellSize * gs;
    this.gridOriginX = (w - gridPixelSize) / 2;
    this.gridOriginY = (h - gridPixelSize) / 2 - 20 * scale;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0xf0f2f5);

    // Grid lines
    const g = this.add.graphics();
    g.lineStyle(LINE_WIDTH * scale, GRID_COLOR, 1);

    for (let i = 1; i < gs; i++) {
      const vx = this.gridOriginX + i * this.cellSize;
      g.moveTo(vx, this.gridOriginY);
      g.lineTo(vx, this.gridOriginY + gridPixelSize);
      const hy = this.gridOriginY + i * this.cellSize;
      g.moveTo(this.gridOriginX, hy);
      g.lineTo(this.gridOriginX + gridPixelSize, hy);
    }
    g.strokePath();

    // Draw marks
    const totalCells = gs * gs;
    for (let i = 0; i < totalCells; i++) {
      const cell = this.board.cells[i];
      if (cell) {
        const { cx, cy } = this.cellCenter(i);
        this.drawMark(cx, cy, cell, i === animateIndex);
      }
    }

    // Win line
    if (this.board.winLine) {
      this.drawWinLine(this.board.winLine);
    }

    // Hit areas
    if (!this.board.winner && this.phase === 'player_turn') {
      for (let i = 0; i < totalCells; i++) {
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
    const gs = this.currentGridSize;
    const row = Math.floor(index / gs);
    const col = index % gs;
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
    const end = this.cellCenter(line[line.length - 1]);

    const g = this.add.graphics();
    g.lineStyle(8 * scale, WIN_LINE_COLOR, 0.8);
    g.moveTo(start.cx, start.cy);
    g.lineTo(end.cx, end.cy);
    g.strokePath();
    g.setDepth(100);

    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 300, ease: 'Cubic.easeIn' });
  }

  private drawStatus() {
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const gs = this.currentGridSize;
    const gridBottom = this.gridOriginY + gs * this.cellSize;

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

    // Show grid size indicator if not 3x3
    if (gs > 3 && !this.board.winner) {
      text += ` [${gs}x${gs}]`;
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
        this.startNewRound();
      });
    }
  }

  // ─── Interaction ──────────────────────────────────────

  private onCellTap(index: number) {
    if (this.phase !== 'player_turn') return;
    this.game.events.emit('cell-tapped');

    const next = makeMove(this.board, index);
    if (!next) return;

    this.board = next;

    if (this.board.winner) {
      if (this.board.winner === 'X') {
        this.playerScore++;
        this.winStreak++;
      } else {
        // draw doesn't reset streak
      }
      this.drawBoard(index);
      this.onGameEnd();
      return;
    }

    // AI turn
    this.phase = 'ai_turn';
    this.drawBoard(index);

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
      if (this.board.winner === 'O') {
        this.aiScore++;
        // On AI win, streak stays (don't downgrade)
      }
      this.drawBoard(aiIndex);
      this.onGameEnd();
      return;
    }

    this.phase = 'player_turn';
    this.drawBoard(aiIndex);
    this.emitState();
  }

  private onGameEnd() {
    this.phase = 'game_over';
    this.roundsPlayed++;
    this.emitState();

    this.time.delayedCall(800, () => {
      this.game.events.emit('round-end', {
        winner: this.board.winner,
        playerScore: this.playerScore,
        aiScore: this.aiScore,
        roundsPlayed: this.roundsPlayed,
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
