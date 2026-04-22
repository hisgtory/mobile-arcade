/**
 * PlayScene for Minesweeper
 *
 * Grid of cells with tap-to-reveal, long-press-to-flag.
 * First click is always safe. Timer starts on first click.
 *
 * Events emitted:
 *   'state-update' — { minesRemaining, elapsed, phase }
 *   'game-over'    — { won, elapsed }
 *   'cell-tapped'  — (haptic: cell reveal)
 *   'flag-toggled' — (haptic: flag toggle)
 *   'mine-hit'     — (haptic: mine explosion)
 *   'game-clear'   — (haptic: win celebration)
 */

import Phaser from 'phaser';
import {
  createBoard,
  placeMines,
  revealCell,
  toggleFlag,
  getMinesRemaining,
  checkWin,
  revealAllMines,
  type Board,
} from '../logic/board';
import {
  DIFFICULTIES,
  type Difficulty,
  type DifficultyConfig,
  type GameConfig,
  type GamePhase,
} from '../types';

// Colors
const HIDDEN_COLOR = 0xd1d5db;
const REVEALED_COLOR = 0xf9fafb;
const MINE_HIT_COLOR = 0xef4444;
const GRID_LINE_COLOR = 0x9ca3af;

const NUMBER_COLORS: Record<number, number> = {
  1: 0x2563eb, // blue
  2: 0x059669, // green
  3: 0xef4444, // red
  4: 0x7c3aed, // purple
  5: 0xb91c1c, // dark red
  6: 0x0891b2, // teal
  7: 0x1f2937, // dark
  8: 0x6b7280, // gray
};

const LONG_PRESS_MS = 300;

export class PlayScene extends Phaser.Scene {
  private gameConfig!: GameConfig;
  private difficulty!: Difficulty;
  private diffConfig!: DifficultyConfig;
  private dpr = 1;

  private board!: Board;
  private phase: GamePhase = 'ready';
  private startTime = 0;
  private elapsed = 0;
  private timerEvent?: Phaser.Time.TimerEvent;

  // Visual
  private cellSize = 0;
  private gridStartX = 0;
  private gridStartY = 0;
  private cellGraphics: Phaser.GameObjects.Rectangle[][] = [];
  private cellTexts: (Phaser.GameObjects.Text | null)[][] = [];

  // Long-press tracking
  private pressTimer: Phaser.Time.TimerEvent | null = null;
  private pressTarget: { row: number; col: number } | null = null;
  private isLongPress = false;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.gameConfig = data.config ?? {};
    this.dpr = data.dpr ?? 1;
    this.difficulty = this.gameConfig.difficulty ?? 'easy';
    this.diffConfig = DIFFICULTIES[this.difficulty];
  }

  create(): void {
    this.phase = 'ready';
    this.elapsed = 0;
    this.board = createBoard(this.diffConfig);

    this.cameras.main.setBackgroundColor('#f0f2f5');

    this.calculateLayout();
    this.drawBoard();
    this.setupInput();
    this.emitState();
  }

  private calculateLayout(): void {
    const { width, height } = this.scale;
    const { rows, cols } = this.diffConfig;

    const padding = 12 * this.dpr;
    const topOffset = 8 * this.dpr;
    const availW = width - padding * 2;
    const availH = height - padding * 2 - topOffset;

    this.cellSize = Math.floor(Math.min(availW / cols, availH / rows));
    const gridW = this.cellSize * cols;
    const gridH = this.cellSize * rows;
    this.gridStartX = (width - gridW) / 2;
    this.gridStartY = topOffset + (availH - gridH) / 2;
  }

  private drawBoard(): void {
    // Clear all children
    this.children.removeAll(true);

    const { rows, cols } = this.diffConfig;
    this.cellGraphics = [];
    this.cellTexts = [];

    for (let r = 0; r < rows; r++) {
      this.cellGraphics[r] = [];
      this.cellTexts[r] = [];
      for (let c = 0; c < cols; c++) {
        const x = this.gridStartX + c * this.cellSize + this.cellSize / 2;
        const y = this.gridStartY + r * this.cellSize + this.cellSize / 2;
        const cell = this.board[r][c];

        let fillColor = HIDDEN_COLOR;
        if (cell.state === 'revealed') {
          fillColor = REVEALED_COLOR;
        } else if (cell.state === 'flagged') {
          fillColor = HIDDEN_COLOR;
        }

        const rect = this.add.rectangle(x, y, this.cellSize - 2, this.cellSize - 2, fillColor);
        rect.setStrokeStyle(1, GRID_LINE_COLOR, 0.4);

        // Rounded look for hidden cells
        if (cell.state === 'hidden' || cell.state === 'flagged') {
          rect.setFillStyle(HIDDEN_COLOR);
        }

        this.cellGraphics[r][c] = rect;

        // Text content
        let textContent: Phaser.GameObjects.Text | null = null;
        const fontSize = Math.floor(this.cellSize * 0.55);

        if (cell.state === 'revealed') {
          if (cell.mine) {
            // Mine
            textContent = this.add.text(x, y, '💣', {
              fontSize: `${fontSize}px`,
              fontFamily: 'system-ui, sans-serif',
            }).setOrigin(0.5);
          } else if (cell.adjacentMines > 0) {
            const numColor = NUMBER_COLORS[cell.adjacentMines] ?? 0x6b7280;
            textContent = this.add.text(x, y, `${cell.adjacentMines}`, {
              fontSize: `${fontSize}px`,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontStyle: 'bold',
              color: `#${numColor.toString(16).padStart(6, '0')}`,
            }).setOrigin(0.5);
          }
        } else if (cell.state === 'flagged') {
          textContent = this.add.text(x, y, '🚩', {
            fontSize: `${fontSize}px`,
            fontFamily: 'system-ui, sans-serif',
          }).setOrigin(0.5);
        }

        this.cellTexts[r][c] = textContent;
      }
    }
  }

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase === 'won' || this.phase === 'lost') return;

      const gridPos = this.pixelToGrid(pointer.x, pointer.y);
      if (!gridPos) return;

      this.pressTarget = gridPos;
      this.isLongPress = false;

      // Start long-press timer for flagging
      this.pressTimer = this.time.delayedCall(LONG_PRESS_MS, () => {
        this.isLongPress = true;
        if (this.pressTarget) {
          this.handleFlag(this.pressTarget.row, this.pressTarget.col);
        }
      });
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.phase === 'won' || this.phase === 'lost') return;

      // Cancel long-press timer
      if (this.pressTimer) {
        this.pressTimer.remove();
        this.pressTimer = null;
      }

      // If it was not a long press, treat as tap (reveal)
      if (!this.isLongPress && this.pressTarget) {
        const gridPos = this.pixelToGrid(pointer.x, pointer.y);
        if (gridPos && gridPos.row === this.pressTarget.row && gridPos.col === this.pressTarget.col) {
          this.handleReveal(gridPos.row, gridPos.col);
        }
      }

      this.pressTarget = null;
      this.isLongPress = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.pressTarget) return;
      const gridPos = this.pixelToGrid(pointer.x, pointer.y);
      // If moved to a different cell, cancel long press
      if (!gridPos || gridPos.row !== this.pressTarget.row || gridPos.col !== this.pressTarget.col) {
        if (this.pressTimer) {
          this.pressTimer.remove();
          this.pressTimer = null;
        }
        this.pressTarget = null;
      }
    });
  }

  private handleReveal(row: number, col: number): void {
    const cell = this.board[row][col];
    if (cell.state !== 'hidden') return;

    // First click: place mines, start timer
    if (this.phase === 'ready') {
      placeMines(this.board, this.diffConfig, row, col);
      this.phase = 'playing';
      this.startTime = Date.now();
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        callback: () => {
          this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
          this.emitState();
        },
        loop: true,
      });
    }

    // Haptic: immediate cell tap feedback (before animation)
    this.game.events.emit('cell-tapped');

    const revealed = revealCell(this.board, row, col);

    if (cell.mine) {
      // Haptic: mine explosion
      this.game.events.emit('mine-hit');

      // Hit a mine — game over
      this.phase = 'lost';
      if (this.timerEvent) this.timerEvent.remove();
      this.emitState();

      // Highlight the hit mine
      this.updateCells(revealed);
      const hitRect = this.cellGraphics[row][col];
      hitRect.setFillStyle(MINE_HIT_COLOR, 0.3);

      // Reveal all mines with staggered animation
      const allMines = revealAllMines(this.board);
      this.animateReveal(allMines, () => {
        this.drawBoard();
        this.game.events.emit('game-over', { won: false, elapsed: this.elapsed });
      });
      return;
    }

    // Animate revealed cells
    this.animateReveal(revealed, () => {
      // Check win
      if (checkWin(this.board)) {
        this.phase = 'won';
        if (this.timerEvent) this.timerEvent.remove();
        this.emitState();

        // Haptic: win celebration
        this.game.events.emit('game-clear');

        this.drawBoard();
        this.game.events.emit('game-over', { won: true, elapsed: this.elapsed });
      }
    });

    this.emitState();
  }

  private handleFlag(row: number, col: number): void {
    if (this.phase !== 'playing' && this.phase !== 'ready') return;

    const toggled = toggleFlag(this.board, row, col);
    if (toggled) {
      // Haptic: flag toggle feedback (before visual update)
      this.game.events.emit('flag-toggled');
      this.updateCell(row, col);
      this.emitState();
    }
  }

  private animateReveal(
    cells: { row: number; col: number }[],
    onComplete?: () => void,
  ): void {
    if (cells.length === 0) {
      onComplete?.();
      return;
    }

    let completed = 0;
    cells.forEach(({ row, col }, i) => {
      const delay = Math.min(i * 15, 300);
      this.time.delayedCall(delay, () => {
        this.updateCell(row, col);
        const rect = this.cellGraphics[row][col];
        rect.setScale(0.8);
        this.tweens.add({
          targets: rect,
          scaleX: 1,
          scaleY: 1,
          duration: 120,
          ease: 'Back.easeOut',
          onComplete: () => {
            completed++;
            if (completed === cells.length) {
              onComplete?.();
            }
          },
        });
      });
    });
  }

  private updateCells(cells: { row: number; col: number }[]): void {
    for (const { row, col } of cells) {
      this.updateCell(row, col);
    }
  }

  private updateCell(row: number, col: number): void {
    const cell = this.board[row][col];
    const rect = this.cellGraphics[row][col];
    const x = this.gridStartX + col * this.cellSize + this.cellSize / 2;
    const y = this.gridStartY + row * this.cellSize + this.cellSize / 2;
    const fontSize = Math.floor(this.cellSize * 0.55);

    // Remove old text
    if (this.cellTexts[row][col]) {
      this.cellTexts[row][col]!.destroy();
      this.cellTexts[row][col] = null;
    }

    if (cell.state === 'revealed') {
      rect.setFillStyle(REVEALED_COLOR);
      rect.setStrokeStyle(1, GRID_LINE_COLOR, 0.2);

      if (cell.mine) {
        this.cellTexts[row][col] = this.add.text(x, y, '💣', {
          fontSize: `${fontSize}px`,
          fontFamily: 'system-ui, sans-serif',
        }).setOrigin(0.5);
      } else if (cell.adjacentMines > 0) {
        const numColor = NUMBER_COLORS[cell.adjacentMines] ?? 0x6b7280;
        this.cellTexts[row][col] = this.add.text(x, y, `${cell.adjacentMines}`, {
          fontSize: `${fontSize}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontStyle: 'bold',
          color: `#${numColor.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5);
      }
    } else if (cell.state === 'flagged') {
      rect.setFillStyle(HIDDEN_COLOR);
      this.cellTexts[row][col] = this.add.text(x, y, '🚩', {
        fontSize: `${fontSize}px`,
        fontFamily: 'system-ui, sans-serif',
      }).setOrigin(0.5);
    } else {
      rect.setFillStyle(HIDDEN_COLOR);
      rect.setStrokeStyle(1, GRID_LINE_COLOR, 0.4);
    }
  }

  private pixelToGrid(px: number, py: number): { row: number; col: number } | null {
    const { rows, cols } = this.diffConfig;
    const col = Math.floor((px - this.gridStartX) / this.cellSize);
    const row = Math.floor((py - this.gridStartY) / this.cellSize);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    return { row, col };
  }

  private emitState(): void {
    this.game.events.emit('state-update', {
      minesRemaining: getMinesRemaining(this.board, this.diffConfig.mines),
      elapsed: this.elapsed,
      phase: this.phase,
    });
  }

  shutdown(): void {
    if (this.timerEvent) this.timerEvent.remove();
    this.cellGraphics = [];
    this.cellTexts = [];
  }
}
