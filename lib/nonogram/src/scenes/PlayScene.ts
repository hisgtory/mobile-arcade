import Phaser from 'phaser';
import {
  CellState,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  type BoardState,
  type GameConfig,
} from '../types';
import { createBoard, toggleCell, isWon, hasErrors, isRowComplete, isColComplete } from '../logic/board';
import { getStageConfig } from '../logic/stage';

const GRID_LINE_COLOR = 0xd1d5db;
const FILLED_COLOR = 0x1f2937;
const MARKED_COLOR = 0xd1d5db;
const CLUE_COLOR = '#6B7280';
const CLUE_DONE_COLOR = '#D1D5DB';

type GamePhase = 'idle' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  private phase: GamePhase = 'idle';
  private moves = 0;
  private cellSize = 0;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  private clueAreaWidth = 0;
  private clueAreaHeight = 0;

  // Graphics layers
  private gridGfx!: Phaser.GameObjects.Graphics;
  private cellsGfx!: Phaser.GameObjects.Graphics;
  private clueTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data?: { config?: GameConfig; dpr?: number }) {
    this.config = data?.config ?? this.game.registry.get('config') ?? {};
    this.dpr = data?.dpr ?? this.game.registry.get('dpr') ?? 1;
  }

  create() {
    const stage = this.config.stage ?? 1;
    const stageConfig = getStageConfig(stage);
    this.board = createBoard(stageConfig.puzzle);
    this.phase = 'idle';
    this.moves = 0;
    this.clueTexts = [];

    this.computeLayout();
    this.drawGrid();
    this.drawCells();
    this.drawClues();
    this.setupInput();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private computeLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const { rows, cols } = this.board.puzzle;
    const scale = this.dpr;

    // Calculate max clue lengths for sizing
    const maxRowClueLen = Math.max(...this.board.clues.rowClues.map((c) => c.length));
    const maxColClueLen = Math.max(...this.board.clues.colClues.map((c) => c.length));

    // Cell size based on available space
    const clueFontSize = Math.max(10, 14 - Math.floor(Math.max(rows, cols) / 3)) * scale;
    this.clueAreaWidth = maxRowClueLen * clueFontSize * 1.2;
    this.clueAreaHeight = maxColClueLen * clueFontSize * 1.2;

    const availW = w - this.clueAreaWidth - 20 * scale;
    const availH = h - this.clueAreaHeight - 20 * scale;
    this.cellSize = Math.floor(Math.min(availW / cols, availH / rows));

    const gridW = this.cellSize * cols;
    const gridH = this.cellSize * rows;
    this.gridOffsetX = this.clueAreaWidth + (w - this.clueAreaWidth - gridW) / 2;
    this.gridOffsetY = this.clueAreaHeight + (h - this.clueAreaHeight - gridH) / 2;
  }

  // ─── Grid Drawing ─────────────────────────────────────

  private drawGrid() {
    if (this.gridGfx) this.gridGfx.destroy();
    this.gridGfx = this.add.graphics();

    const { rows, cols } = this.board.puzzle;
    const gx = this.gridOffsetX;
    const gy = this.gridOffsetY;
    const cs = this.cellSize;

    // Background
    this.gridGfx.fillStyle(0xffffff, 1);
    this.gridGfx.fillRect(gx, gy, cs * cols, cs * rows);

    // Grid lines
    for (let r = 0; r <= rows; r++) {
      const lw = r % 5 === 0 ? 2 : 1;
      this.gridGfx.lineStyle(lw, r % 5 === 0 ? 0x9ca3af : GRID_LINE_COLOR, 1);
      this.gridGfx.beginPath();
      this.gridGfx.moveTo(gx, gy + r * cs);
      this.gridGfx.lineTo(gx + cols * cs, gy + r * cs);
      this.gridGfx.strokePath();
    }
    for (let c = 0; c <= cols; c++) {
      const lw = c % 5 === 0 ? 2 : 1;
      this.gridGfx.lineStyle(lw, c % 5 === 0 ? 0x9ca3af : GRID_LINE_COLOR, 1);
      this.gridGfx.beginPath();
      this.gridGfx.moveTo(gx + c * cs, gy);
      this.gridGfx.lineTo(gx + c * cs, gy + rows * cs);
      this.gridGfx.strokePath();
    }
  }

  // ─── Cell Drawing ─────────────────────────────────────

  private drawCells() {
    if (this.cellsGfx) this.cellsGfx.destroy();
    this.cellsGfx = this.add.graphics();

    const { rows, cols } = this.board.puzzle;
    const gx = this.gridOffsetX;
    const gy = this.gridOffsetY;
    const cs = this.cellSize;
    const pad = Math.max(1, cs * 0.08);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const state = this.board.grid[r][c];
        const x = gx + c * cs;
        const y = gy + r * cs;

        if (state === CellState.FILLED) {
          this.cellsGfx.fillStyle(FILLED_COLOR, 1);
          this.cellsGfx.fillRoundedRect(x + pad, y + pad, cs - pad * 2, cs - pad * 2, 2);
        } else if (state === CellState.MARKED) {
          // Draw X
          this.cellsGfx.lineStyle(2, MARKED_COLOR, 1);
          const m = cs * 0.3;
          this.cellsGfx.beginPath();
          this.cellsGfx.moveTo(x + m, y + m);
          this.cellsGfx.lineTo(x + cs - m, y + cs - m);
          this.cellsGfx.strokePath();
          this.cellsGfx.beginPath();
          this.cellsGfx.moveTo(x + cs - m, y + m);
          this.cellsGfx.lineTo(x + m, y + cs - m);
          this.cellsGfx.strokePath();
        }
      }
    }
  }

  // ─── Clue Drawing ─────────────────────────────────────

  private drawClues() {
    this.clueTexts.forEach((t) => t.destroy());
    this.clueTexts = [];

    const { rows, cols } = this.board.puzzle;
    const { rowClues, colClues } = this.board.clues;
    const gx = this.gridOffsetX;
    const gy = this.gridOffsetY;
    const cs = this.cellSize;
    const fontSize = Math.max(10, Math.min(14, cs * 0.4)); // min 10px for mobile readability

    // Row clues (left of grid)
    for (let r = 0; r < rows; r++) {
      const done = isRowComplete(this.board.grid, r, rowClues[r]);
      const clueStr = rowClues[r].join(' ');
      const text = this.add.text(
        gx - 8,
        gy + r * cs + cs / 2,
        clueStr,
        {
          fontSize: `${fontSize}px`,
          fontFamily: 'monospace',
          color: done ? CLUE_DONE_COLOR : CLUE_COLOR,
          fontStyle: done ? 'normal' : 'bold',
        },
      );
      text.setOrigin(1, 0.5);
      this.clueTexts.push(text);
    }

    // Column clues (top of grid)
    for (let c = 0; c < cols; c++) {
      const done = isColComplete(this.board.grid, c, colClues[c]);
      const clueStr = colClues[c].join('\n');
      const text = this.add.text(
        gx + c * cs + cs / 2,
        gy - 8,
        clueStr,
        {
          fontSize: `${fontSize}px`,
          fontFamily: 'monospace',
          color: done ? CLUE_DONE_COLOR : CLUE_COLOR,
          fontStyle: done ? 'normal' : 'bold',
          align: 'center',
        },
      );
      text.setOrigin(0.5, 1);
      this.clueTexts.push(text);
    }
  }

  // ─── Input ────────────────────────────────────────────

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'idle') return;
      const { row, col } = this.pointerToCell(pointer.x, pointer.y);
      if (row < 0 || col < 0) return;
      this.onCellTap(row, col);
    });
  }

  private pointerToCell(px: number, py: number): { row: number; col: number } {
    const gx = this.gridOffsetX;
    const gy = this.gridOffsetY;
    const cs = this.cellSize;
    const { rows, cols } = this.board.puzzle;

    const col = Math.floor((px - gx) / cs);
    const row = Math.floor((py - gy) / cs);

    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return { row: -1, col: -1 };
    }
    return { row, col };
  }

  private onCellTap(row: number, col: number) {
    this.board.grid = toggleCell(this.board.grid, row, col);
    this.moves++;

    this.drawCells();
    this.drawClues();
    this.emitState();

    // Check win
    if (isWon(this.board)) {
      this.phase = 'celebrating';
      this.time.delayedCall(300, () => {
        this.celebrateWin();
      });
    }
  }

  // ─── Celebrate ────────────────────────────────────────

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    // Reveal pixel art with color
    const { rows, cols } = this.board.puzzle;
    const gx = this.gridOffsetX;
    const gy = this.gridOffsetY;
    const cs = this.cellSize;
    const artColors = [0x3b82f6, 0x22c55e, 0xeab308, 0xef4444, 0xa855f7, 0xf97316];
    const artColor = artColors[((this.config.stage ?? 1) - 1) % artColors.length];

    // Animate each filled cell with color
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.board.puzzle.solution[r][c] === 1) {
          const x = gx + c * cs;
          const y = gy + r * cs;
          const pad = Math.max(1, cs * 0.08);

          const rect = this.add.rectangle(
            x + cs / 2,
            y + cs / 2,
            cs - pad * 2,
            cs - pad * 2,
            artColor,
          );
          rect.setAlpha(0);
          rect.setDepth(50);

          this.tweens.add({
            targets: rect,
            alpha: 1,
            duration: 300,
            delay: (r * cols + c) * 30,
            ease: 'Cubic.easeOut',
          });
        }
      }
    }

    // Confetti
    const totalCells = rows * cols;
    const revealTime = totalCells * 30 + 300;
    this.time.delayedCall(revealTime, () => {
      for (let i = 0; i < 30; i++) {
        const colors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316];
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
      this.time.delayedCall(800, () => {
        this.game.events.emit('stage-clear', {
          score: this.calculateScore(),
          moves: this.moves,
          stage: this.config.stage ?? 1,
        });
      });
    });
  }

  private calculateScore(): number {
    const { rows, cols } = this.board.puzzle;
    const totalCells = rows * cols;
    const filledCells = this.board.puzzle.solution.flat().filter((v) => v === 1).length;
    // Score based on puzzle size and efficiency
    const baseScore = filledCells * 10;
    const efficiencyBonus = Math.max(0, (totalCells * 2 - this.moves) * 5);
    return baseScore + efficiencyBonus;
  }

  // ─── Public Methods ───────────────────────────────────

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    const { rows, cols } = this.board.puzzle;
    const totalFilled = this.board.puzzle.solution.flat().filter((v) => v === 1).length;
    let correctFilled = 0;
    const errors = hasErrors(this.board);
    const errorCount = errors.length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.board.grid[r][c] === CellState.FILLED && this.board.puzzle.solution[r][c] === 1) {
          correctFilled++;
        }
      }
    }
    const progress = Math.min(100, Math.max(0, Math.floor(((correctFilled - errorCount) / totalFilled) * 100)));

    this.game.events.emit('moves-update', { moves: this.moves });
    this.game.events.emit('progress-update', { progress });
    this.game.events.emit('errors-update', { errors: errorCount });
  }
}
