import Phaser from 'phaser';
import {
  Dir,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  ARROW_COLORS,
  getStageConfig,
  type BoardState,
  type GameConfig,
} from '../types';
import { createBoard, tracePath, isSolved, rotateArrow } from '../logic/board';

const CELL_GAP = 4;
const ARROW_SIZE_RATIO = 0.45; // Arrow size relative to cell

type GamePhase = 'idle' | 'tracing' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private cellContainers: Phaser.GameObjects.Container[][] = [];
  private pathGraphics: Phaser.GameObjects.Graphics | null = null;
  private phase: GamePhase = 'idle';
  private moves = 0;
  private score = 0;
  private moveHistory: { row: number; col: number; prevDir: Dir }[] = [];

  // Layout
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cellSize = 0;

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
    this.moves = 0;
    this.score = 0;
    this.moveHistory = [];

    this.calculateLayout();
    this.drawBoard();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private calculateLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const { rows, cols } = this.board;
    const scale = this.dpr;
    const gap = CELL_GAP * scale;

    const padding = 24 * scale;
    const availW = w - padding * 2;
    const availH = h - padding * 2;

    this.cellSize = Math.min(
      (availW - (cols - 1) * gap) / cols,
      (availH - (rows - 1) * gap) / rows,
      80 * scale,
    );

    const gridW = cols * this.cellSize + (cols - 1) * gap;
    const gridH = rows * this.cellSize + (rows - 1) * gap;

    this.gridOriginX = (w - gridW) / 2;
    this.gridOriginY = (h - gridH) / 2;
  }

  private getCellCenter(row: number, col: number): { x: number; y: number } {
    const gap = CELL_GAP * this.dpr;
    return {
      x: this.gridOriginX + col * (this.cellSize + gap) + this.cellSize / 2,
      y: this.gridOriginY + row * (this.cellSize + gap) + this.cellSize / 2,
    };
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear previous
    this.cellContainers.forEach((row) => row.forEach((c) => c.destroy()));
    this.cellContainers = [];
    if (this.pathGraphics) {
      this.pathGraphics.destroy();
      this.pathGraphics = null;
    }

    const { rows, cols, cells, startRow, startCol } = this.board;
    const scale = this.dpr;
    const radius = 8 * scale;

    for (let r = 0; r < rows; r++) {
      const rowContainers: Phaser.GameObjects.Container[] = [];
      for (let c = 0; c < cols; c++) {
        const cell = cells[r][c];
        const { x, y } = this.getCellCenter(r, c);
        const container = this.add.container(x, y);

        const isStart = r === startRow && c === startCol;

        // Cell background
        const bg = this.add.graphics();
        const bgColor = isStart ? 0xfef3c7 : (cell.fixed ? 0xf0f0ff : 0xffffff);
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(
          -this.cellSize / 2,
          -this.cellSize / 2,
          this.cellSize,
          this.cellSize,
          radius,
        );

        // Border
        const borderColor = isStart ? 0xf59e0b : (cell.fixed ? 0x8b8bff : 0xd1d5db);
        bg.lineStyle(2 * scale, borderColor, 1);
        bg.strokeRoundedRect(
          -this.cellSize / 2,
          -this.cellSize / 2,
          this.cellSize,
          this.cellSize,
          radius,
        );
        container.add(bg);

        // Arrow
        const arrowSize = this.cellSize * ARROW_SIZE_RATIO;
        const arrow = this.drawArrow(
          cell.dir,
          arrowSize,
          cell.fixed ? ARROW_COLORS.fixed : ARROW_COLORS.normal,
        );
        container.add(arrow);

        // Fixed indicator (lock icon - small dot)
        if (cell.fixed) {
          const lock = this.add.circle(
            this.cellSize / 2 - 6 * scale,
            -this.cellSize / 2 + 6 * scale,
            3 * scale,
            0x8b8bff,
            0.6,
          );
          container.add(lock);
        }

        // Start indicator
        if (isStart) {
          const startDot = this.add.circle(
            -this.cellSize / 2 + 8 * scale,
            -this.cellSize / 2 + 8 * scale,
            4 * scale,
            ARROW_COLORS.start,
            1,
          );
          container.add(startDot);
        }

        // Hit area
        const hitArea = this.add
          .rectangle(0, 0, this.cellSize, this.cellSize)
          .setInteractive()
          .setAlpha(0.001);
        hitArea.on('pointerdown', () => this.onCellTap(r, c));
        container.add(hitArea);

        rowContainers.push(container);
      }
      this.cellContainers.push(rowContainers);
    }
  }

  private drawArrow(dir: Dir, size: number, color: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(color, 1);

    // Draw arrow shape pointing right, then rotate
    const hw = size / 2;
    const hh = size / 3;
    const stemW = size * 0.3;
    const stemH = hh * 0.6;

    // Arrow pointing RIGHT by default
    // Stem
    g.fillRect(-hw, -stemH / 2, stemW, stemH);
    // Head (triangle)
    g.fillTriangle(
      -hw + stemW, -hh,
      size / 2, 0,
      -hw + stemW, hh,
    );

    // Rotate based on direction
    const angles: Record<Dir, number> = {
      [Dir.UP]: -Math.PI / 2,
      [Dir.RIGHT]: 0,
      [Dir.DOWN]: Math.PI / 2,
      [Dir.LEFT]: Math.PI,
    };
    g.setRotation(angles[dir]);

    return g;
  }

  // ─── Interaction ──────────────────────────────────────

  private onCellTap(row: number, col: number) {
    if (this.phase !== 'idle') return;

    const cell = this.board.cells[row][col];
    if (cell.fixed) {
      this.shakeCell(row, col);
      return;
    }

    // Save for undo
    this.moveHistory.push({ row, col, prevDir: cell.dir });

    // Rotate arrow
    rotateArrow(this.board, row, col);
    this.moves++;

    // Animate rotation
    this.animateRotation(row, col);

    this.emitState();

    // Auto-check if solved after rotation
    this.time.delayedCall(200, () => {
      if (isSolved(this.board)) {
        this.phase = 'tracing';
        this.animatePath();
      }
    });
  }

  private shakeCell(row: number, col: number) {
    const container = this.cellContainers[row]?.[col];
    if (!container) return;
    const origX = container.x;

    this.tweens.add({
      targets: container,
      x: origX + 4 * this.dpr,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        container.x = origX;
      },
    });
  }

  private animateRotation(row: number, col: number) {
    const container = this.cellContainers[row]?.[col];
    if (!container) return;

    // Quick scale bounce
    this.tweens.add({
      targets: container,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.drawBoard();
      },
    });
  }

  // ─── Path Animation ───────────────────────────────────

  private animatePath() {
    const path = tracePath(this.board);
    const total = this.board.rows * this.board.cols;
    const isComplete = path.length === total;

    this.pathGraphics = this.add.graphics();
    this.pathGraphics.setDepth(50);

    const scale = this.dpr;
    const lineWidth = 3 * scale;
    const dotRadius = 5 * scale;
    const stepDelay = 150;

    // Animate step by step
    let stepIdx = 0;

    const animateStep = () => {
      if (stepIdx >= path.length) {
        if (isComplete) {
          this.phase = 'celebrating';
          this.time.delayedCall(300, () => this.celebrateWin());
        } else {
          this.phase = 'idle';
        }
        return;
      }

      const [r, c] = path[stepIdx];
      const { x, y } = this.getCellCenter(r, c);

      // Draw dot at current position
      this.pathGraphics!.fillStyle(ARROW_COLORS.path, 0.8);
      this.pathGraphics!.fillCircle(x, y, dotRadius);

      // Highlight cell
      const container = this.cellContainers[r]?.[c];
      if (container) {
        this.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 80,
          yoyo: true,
          ease: 'Sine.easeInOut',
        });
      }

      // Draw line from previous
      if (stepIdx > 0) {
        const [pr, pc] = path[stepIdx - 1];
        const prev = this.getCellCenter(pr, pc);
        this.pathGraphics!.lineStyle(lineWidth, ARROW_COLORS.path, 0.6);
        this.pathGraphics!.beginPath();
        this.pathGraphics!.moveTo(prev.x, prev.y);
        this.pathGraphics!.lineTo(x, y);
        this.pathGraphics!.strokePath();
      }

      stepIdx++;
      this.time.delayedCall(stepDelay, animateStep);
    };

    animateStep();
  }

  // ─── Celebration ──────────────────────────────────────

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const scale = this.dpr;

    // Score based on moves (fewer = better)
    const total = this.board.rows * this.board.cols;
    this.score = Math.max(100, 1000 - this.moves * 10) + total * 50;

    // Confetti burst
    const colors = [0x3b82f6, 0x22c55e, 0xf59e0b, 0xef4444, 0xa855f7, 0xf97316];
    for (let i = 0; i < 30; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (4 + Math.random() * 6) * scale;
      const p = this.add.rectangle(
        w / 2 + (Math.random() - 0.5) * 60 * scale,
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
    this.emitState();
    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        moves: this.moves,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Undo ─────────────────────────────────────────────

  public undo() {
    if (this.phase !== 'idle' || this.moveHistory.length === 0) return;
    const prev = this.moveHistory.pop()!;
    this.board.cells[prev.row][prev.col].dir = prev.prevDir;
    this.moves = Math.max(0, this.moves - 1);
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
