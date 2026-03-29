import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  PALETTE,
  getStageConfig,
  type BoardState,
  type GameConfig,
} from '../types';
import { createBoard, fillCell, isComplete, getUsedColors, getRemainingForColor, getProgress } from '../logic/board';

type GamePhase = 'idle' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // State
  private selectedColor = 0;
  private usedColors: number[] = [];
  private phase: GamePhase = 'idle';
  private cellSize = 0;
  private gridOffsetX = 0;
  private gridOffsetY = 0;

  // Visual layers
  private gridContainer!: Phaser.GameObjects.Container;
  private cellGraphics: Phaser.GameObjects.Graphics[][] = [];
  private numberTexts: Phaser.GameObjects.Text[][] = [];
  private paletteContainer!: Phaser.GameObjects.Container;
  private paletteButtons: Phaser.GameObjects.Container[] = [];

  // Drag paint
  private isPainting = false;

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
    this.board = createBoard(stageConfig.design);
    this.usedColors = getUsedColors(this.board);
    this.selectedColor = this.usedColors[0] || 1;
    this.phase = 'idle';

    this.gridContainer = this.add.container(0, 0);
    this.paletteContainer = this.add.container(0, 0);

    this.calculateLayout();
    this.drawGrid();
    this.drawPalette();
    this.setupInput();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private calculateLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const paletteHeight = 80 * this.dpr;
    const padding = 16 * this.dpr;

    const availableW = w - padding * 2;
    const availableH = h - paletteHeight - padding * 3;

    const cellW = Math.floor(availableW / this.board.cols);
    const cellH = Math.floor(availableH / this.board.rows);
    this.cellSize = Math.min(cellW, cellH);

    const gridW = this.cellSize * this.board.cols;
    const gridH = this.cellSize * this.board.rows;
    this.gridOffsetX = (w - gridW) / 2;
    this.gridOffsetY = padding + (availableH - gridH) / 2;
  }

  // ─── Grid Drawing ─────────────────────────────────────

  private drawGrid() {
    this.gridContainer.removeAll(true);
    this.cellGraphics = [];
    this.numberTexts = [];

    const s = this.cellSize;
    const fontSize = Math.max(8, Math.floor(s * 0.4));

    for (let r = 0; r < this.board.rows; r++) {
      const gRow: Phaser.GameObjects.Graphics[] = [];
      const tRow: Phaser.GameObjects.Text[] = [];

      for (let c = 0; c < this.board.cols; c++) {
        const cell = this.board.cells[r][c];
        const x = this.gridOffsetX + c * s;
        const y = this.gridOffsetY + r * s;

        const g = this.add.graphics();

        if (cell.targetColor === 0) {
          // Empty cell — very light bg
          g.fillStyle(0xf0f2f5, 1);
          g.fillRect(x, y, s, s);
        } else if (cell.filled) {
          // Filled cell — show color
          const hex = parseInt(PALETTE[cell.targetColor - 1].replace('#', ''), 16);
          g.fillStyle(hex, 1);
          g.fillRect(x, y, s, s);
        } else {
          // Unfilled cell — show light bg with border
          g.fillStyle(0xffffff, 1);
          g.fillRect(x, y, s, s);
          g.lineStyle(1 * this.dpr, 0xe5e7eb, 1);
          g.strokeRect(x, y, s, s);

          // Highlight cells that match selected color
          if (cell.targetColor === this.selectedColor) {
            const selHex = parseInt(PALETTE[this.selectedColor - 1].replace('#', ''), 16);
            g.fillStyle(selHex, 0.12);
            g.fillRect(x, y, s, s);
          }
        }

        this.gridContainer.add(g);
        gRow.push(g);

        // Number text (only for unfilled cells)
        const txt = this.add.text(x + s / 2, y + s / 2, '', {
          fontSize: `${fontSize}px`,
          fontFamily: 'Arial, sans-serif',
          color: '#6B7280',
          fontStyle: 'bold',
        });
        txt.setOrigin(0.5, 0.5);

        if (cell.targetColor > 0 && !cell.filled) {
          txt.setText(String(cell.targetColor));
          // Color the number if it matches selected
          if (cell.targetColor === this.selectedColor) {
            txt.setColor(PALETTE[this.selectedColor - 1]);
          }
        }

        this.gridContainer.add(txt);
        tRow.push(txt);
      }

      this.cellGraphics.push(gRow);
      this.numberTexts.push(tRow);
    }
  }

  // ─── Palette Drawing ──────────────────────────────────

  private drawPalette() {
    this.paletteContainer.removeAll(true);
    this.paletteButtons = [];

    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const btnSize = 36 * this.dpr;
    const gap = 6 * this.dpr;
    const colors = this.usedColors;
    const maxPerRow = Math.min(colors.length, 8);
    const rows = Math.ceil(colors.length / maxPerRow);
    const paletteY = h - (rows * (btnSize + gap) + 10 * this.dpr);

    for (let i = 0; i < colors.length; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      const rowCount = Math.min(maxPerRow, colors.length - row * maxPerRow);
      const totalRowW = rowCount * btnSize + (rowCount - 1) * gap;
      const startX = (w - totalRowW) / 2;

      const x = startX + col * (btnSize + gap) + btnSize / 2;
      const y = paletteY + row * (btnSize + gap) + btnSize / 2;
      const colorIdx = colors[i];
      const hex = parseInt(PALETTE[colorIdx - 1].replace('#', ''), 16);

      const container = this.add.container(x, y);

      // Background circle
      const bg = this.add.graphics();
      const isSelected = colorIdx === this.selectedColor;

      if (isSelected) {
        bg.lineStyle(3 * this.dpr, hex, 1);
        bg.strokeCircle(0, 0, btnSize / 2 + 2 * this.dpr);
      }
      bg.fillStyle(hex, 1);
      bg.fillCircle(0, 0, btnSize / 2 - 2 * this.dpr);
      container.add(bg);

      // Number label
      const remaining = getRemainingForColor(this.board, colorIdx);
      const label = this.add.text(0, 0, String(colorIdx), {
        fontSize: `${Math.floor(btnSize * 0.38)}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);
      container.add(label);

      // Remaining count badge
      if (remaining > 0) {
        const badgeSize = 14 * this.dpr;
        const badgeX = btnSize / 2 - 4 * this.dpr;
        const badgeY = -btnSize / 2 + 4 * this.dpr;
        const badge = this.add.graphics();
        badge.fillStyle(0x374151, 0.9);
        badge.fillCircle(badgeX, badgeY, badgeSize / 2);
        container.add(badge);

        const badgeText = this.add.text(badgeX, badgeY, String(remaining), {
          fontSize: `${Math.floor(badgeSize * 0.7)}px`,
          fontFamily: 'Arial, sans-serif',
          color: '#ffffff',
          fontStyle: 'bold',
        });
        badgeText.setOrigin(0.5, 0.5);
        container.add(badgeText);
      }

      // Checkmark for completed colors
      if (remaining === 0) {
        const checkBg = this.add.graphics();
        checkBg.fillStyle(0x000000, 0.3);
        checkBg.fillCircle(0, 0, btnSize / 2 - 2 * this.dpr);
        container.add(checkBg);

        const check = this.add.text(0, 0, '✓', {
          fontSize: `${Math.floor(btnSize * 0.5)}px`,
          fontFamily: 'Arial, sans-serif',
          color: '#ffffff',
          fontStyle: 'bold',
        });
        check.setOrigin(0.5, 0.5);
        container.add(check);
      }

      // Hit area
      const hitArea = this.add
        .circle(0, 0, btnSize / 2 + 4 * this.dpr)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => this.onColorSelect(colorIdx));
      container.add(hitArea);

      this.paletteContainer.add(container);
      this.paletteButtons.push(container);
    }
  }

  // ─── Input ────────────────────────────────────────────

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'idle') return;
      const { row, col } = this.pointerToCell(pointer);
      if (row >= 0 && col >= 0) {
        this.isPainting = true;
        this.tryFillCell(row, col);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPainting || this.phase !== 'idle') return;
      if (!pointer.isDown) {
        this.isPainting = false;
        return;
      }
      const { row, col } = this.pointerToCell(pointer);
      if (row >= 0 && col >= 0) {
        this.tryFillCell(row, col);
      }
    });

    this.input.on('pointerup', () => {
      this.isPainting = false;
    });
  }

  private pointerToCell(pointer: Phaser.Input.Pointer): { row: number; col: number } {
    const x = pointer.x - this.gridOffsetX;
    const y = pointer.y - this.gridOffsetY;

    if (x < 0 || y < 0) return { row: -1, col: -1 };

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (row < 0 || row >= this.board.rows || col < 0 || col >= this.board.cols) {
      return { row: -1, col: -1 };
    }

    return { row, col };
  }

  private tryFillCell(row: number, col: number) {
    const result = fillCell(this.board, row, col, this.selectedColor);

    if (result.correct) {
      this.updateCell(row, col);
      this.drawPalette(); // Update remaining counts
      this.emitState();

      // Check completion
      if (isComplete(this.board)) {
        this.phase = 'celebrating';
        this.time.delayedCall(400, () => this.celebrateWin());
      }
    } else if (!result.alreadyFilled && !result.correct) {
      // Wrong color — shake feedback
      this.shakeCell(row, col);
    }
  }

  // ─── Cell Updates ─────────────────────────────────────

  private updateCell(row: number, col: number) {
    const cell = this.board.cells[row][col];
    const s = this.cellSize;
    const x = this.gridOffsetX + col * s;
    const y = this.gridOffsetY + row * s;
    const hex = parseInt(PALETTE[cell.targetColor - 1].replace('#', ''), 16);

    // Animate fill
    const g = this.cellGraphics[row][col];
    g.clear();
    g.fillStyle(hex, 1);
    g.fillRect(x, y, s, s);

    // Pop animation
    const rect = this.add.rectangle(x + s / 2, y + s / 2, s, s, hex);
    rect.setAlpha(0.6);
    rect.setScale(0.5);
    this.tweens.add({
      targets: rect,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => rect.destroy(),
    });

    // Hide number
    this.numberTexts[row][col].setText('');
  }

  private shakeCell(row: number, col: number) {
    const g = this.cellGraphics[row][col];
    if (!g) return;
    const origX = g.x;
    this.tweens.add({
      targets: g,
      x: origX + 4 * this.dpr,
      duration: 40,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        g.x = origX;
      },
    });
  }

  // ─── Color Selection ──────────────────────────────────

  private onColorSelect(colorIdx: number) {
    if (this.phase !== 'idle') return;
    this.selectedColor = colorIdx;
    this.game.events.emit('color-select', { color: colorIdx });
    this.drawGrid(); // Redraw to update highlights
    this.drawPalette(); // Redraw to update selection
  }

  // ─── Win Celebration ──────────────────────────────────

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    // Confetti burst
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

    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.board.totalCells * 10,
        stage: this.config.stage ?? 1,
        progress: 100,
      });
    });
  }

  // ─── Public Methods ───────────────────────────────────

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    const progress = getProgress(this.board);
    this.game.events.emit('progress-update', { progress });
    this.game.events.emit('score-update', {
      score: this.board.filledCells * 10,
    });
  }
}
