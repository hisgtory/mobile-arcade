import Phaser from 'phaser';
import {
  CELL_WALL,
  CELL_START,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  getStageConfig,
  type BoardState,
  type GameConfig,
} from '../types';
import { createBoard, canMove, executeMove, undoMove, isWon, getNeighbors } from '../logic/board';

const GRID_PAD = 30;
const CELL_RADIUS = 6;
const PATH_COLOR = 0x2563eb;
const START_COLOR = 0xf97316;
const WALL_COLOR = 0x374151;
const CELL_COLOR = 0xffffff;
const CELL_BORDER = 0xd1d5db;
const BG_COLOR = 0xf0f2f5;

type GamePhase = 'idle' | 'drawing' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  private cellSize = 0;
  private gridOffsetX = 0;
  private gridOffsetY = 0;

  private phase: GamePhase = 'idle';
  private score = 0;
  private moves = 0;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private cellGraphics!: Phaser.GameObjects.Graphics;
  private isPointerDown = false;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    const stage = this.config.stage ?? 1;
    const stageConfig = getStageConfig(stage);
    this.board = createBoard(stageConfig);
    this.phase = 'idle';
    this.score = 0;
    this.moves = 0;
    this.isPointerDown = false;

    this.calculateLayout();

    this.cellGraphics = this.add.graphics();
    this.pathGraphics = this.add.graphics();

    this.drawBoard();
    this.emitState();

    // Input handlers
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerup', () => this.onPointerUp());
  }

  // ─── Layout ───────────────────────────────────────────

  private calculateLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const pad = GRID_PAD * this.dpr;

    const availW = w - pad * 2;
    const availH = h - pad * 2;

    this.cellSize = Math.floor(Math.min(availW / this.board.cols, availH / this.board.rows));
    const gridW = this.cellSize * this.board.cols;
    const gridH = this.cellSize * this.board.rows;
    this.gridOffsetX = (w - gridW) / 2;
    this.gridOffsetY = (h - gridH) / 2;
  }

  private getCellCenter(idx: number): { x: number; y: number } {
    const col = idx % this.board.cols;
    const row = Math.floor(idx / this.board.cols);
    return {
      x: this.gridOffsetX + col * this.cellSize + this.cellSize / 2,
      y: this.gridOffsetY + row * this.cellSize + this.cellSize / 2,
    };
  }

  private getCellFromPointer(px: number, py: number): number | null {
    const col = Math.floor((px - this.gridOffsetX) / this.cellSize);
    const row = Math.floor((py - this.gridOffsetY) / this.cellSize);
    if (col < 0 || col >= this.board.cols || row < 0 || row >= this.board.rows) return null;
    return row * this.board.cols + col;
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    this.cellGraphics.clear();
    this.pathGraphics.clear();

    const scale = this.dpr;
    const radius = CELL_RADIUS * scale;
    const gap = 2 * scale;

    // Draw cells
    for (let i = 0; i < this.board.grid.length; i++) {
      const cell = this.board.grid[i];
      const center = this.getCellCenter(i);
      const x = center.x - this.cellSize / 2 + gap;
      const y = center.y - this.cellSize / 2 + gap;
      const size = this.cellSize - gap * 2;

      if (cell === CELL_WALL) {
        this.cellGraphics.fillStyle(WALL_COLOR, 1);
        this.cellGraphics.fillRoundedRect(x, y, size, size, radius);
      } else {
        // Check if cell is in path
        const pathIdx = this.board.path.indexOf(i);
        if (pathIdx >= 0) {
          // Visited cell
          const alpha = 0.3 + 0.7 * (pathIdx / Math.max(this.board.totalOpen - 1, 1));
          this.cellGraphics.fillStyle(PATH_COLOR, alpha);
          this.cellGraphics.fillRoundedRect(x, y, size, size, radius);
        } else {
          // Unvisited cell
          this.cellGraphics.fillStyle(CELL_COLOR, 1);
          this.cellGraphics.fillRoundedRect(x, y, size, size, radius);
          this.cellGraphics.lineStyle(1.5 * scale, CELL_BORDER, 1);
          this.cellGraphics.strokeRoundedRect(x, y, size, size, radius);
        }

        // Start marker
        if (cell === CELL_START) {
          const starSize = this.cellSize * 0.2;
          this.cellGraphics.fillStyle(START_COLOR, 1);
          this.cellGraphics.fillCircle(center.x, center.y, starSize);
        }
      }
    }

    // Draw path lines
    if (this.board.path.length > 1) {
      this.pathGraphics.lineStyle(4 * scale, PATH_COLOR, 0.8);
      this.pathGraphics.beginPath();
      const first = this.getCellCenter(this.board.path[0]);
      this.pathGraphics.moveTo(first.x, first.y);
      for (let i = 1; i < this.board.path.length; i++) {
        const c = this.getCellCenter(this.board.path[i]);
        this.pathGraphics.lineTo(c.x, c.y);
      }
      this.pathGraphics.strokePath();
    }

    // Draw current position indicator
    if (this.board.path.length > 0) {
      const current = this.getCellCenter(this.board.path[this.board.path.length - 1]);
      this.cellGraphics.fillStyle(PATH_COLOR, 1);
      this.cellGraphics.fillCircle(current.x, current.y, this.cellSize * 0.15);
    }

    // Show available moves hint
    if (this.phase === 'drawing' && this.board.path.length > 0) {
      const currentIdx = this.board.path[this.board.path.length - 1];
      const neighbors = getNeighbors(currentIdx, this.board.cols, this.board.rows);
      for (const n of neighbors) {
        if (canMove(this.board, n)) {
          const c = this.getCellCenter(n);
          this.cellGraphics.fillStyle(PATH_COLOR, 0.15);
          const hGap = 2 * scale;
          const hSize = this.cellSize - hGap * 2;
          this.cellGraphics.fillRoundedRect(
            c.x - this.cellSize / 2 + hGap,
            c.y - this.cellSize / 2 + hGap,
            hSize,
            hSize,
            radius,
          );
        }
      }
    }
  }

  // ─── Input ────────────────────────────────────────────

  private onPointerDown(p: Phaser.Input.Pointer) {
    if (this.phase === 'celebrating') return;

    const idx = this.getCellFromPointer(p.x, p.y);
    if (idx === null) return;

    if (this.phase === 'idle') {
      // Must tap on start cell
      if (idx === this.board.start) {
        this.phase = 'drawing';
        this.isPointerDown = true;
        this.drawBoard();
      }
    } else if (this.phase === 'drawing') {
      this.isPointerDown = true;
      this.tryMove(idx);
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer) {
    if (!this.isPointerDown || this.phase !== 'drawing') return;

    const idx = this.getCellFromPointer(p.x, p.y);
    if (idx === null) return;

    this.tryMove(idx);
  }

  private onPointerUp() {
    this.isPointerDown = false;
  }

  private tryMove(targetIdx: number) {
    // Allow moving back to previous cell (undo via drag)
    if (this.board.path.length >= 2) {
      const prevIdx = this.board.path[this.board.path.length - 2];
      if (targetIdx === prevIdx) {
        this.board = undoMove(this.board);
        this.moves++;
        this.drawBoard();
        this.emitState();
        return;
      }
    }

    if (!canMove(this.board, targetIdx)) return;

    this.board = executeMove(this.board, targetIdx);
    this.moves++;
    this.score += 10;
    this.drawBoard();
    this.emitState();

    // Check win
    if (isWon(this.board)) {
      this.phase = 'celebrating';
      this.score += 500;
      this.emitState();
      this.time.delayedCall(400, () => this.celebrateWin());
    }
  }

  // ─── Celebrations ─────────────────────────────────────

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    // Confetti burst
    for (let i = 0; i < 30; i++) {
      const colors = [0x2563eb, 0xf97316, 0x22c55e, 0xeab308, 0xa855f7, 0xef4444];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (4 + Math.random() * 6) * this.dpr;
      const p = this.add.rectangle(
        w / 2 + (Math.random() - 0.5) * 60 * this.dpr,
        h / 2,
        size,
        size * 1.5,
        color,
      );
      p.setDepth(300);
      p.setRotation(Math.random() * Math.PI);

      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * w * 0.8,
        y: p.y + (Math.random() - 0.5) * h * 0.6,
        rotation: p.rotation + (Math.random() - 0.5) * 4,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    // Emit stage clear
    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        moves: this.moves,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Public API ───────────────────────────────────────

  public undo() {
    if (this.phase !== 'drawing' || this.board.path.length <= 1) return;
    this.board = undoMove(this.board);
    this.moves++;
    this.drawBoard();
    this.emitState();
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
  }
}
