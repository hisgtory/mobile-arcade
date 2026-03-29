import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  COLS,
  ROWS,
  TOTAL_CELLS,
  type Cell,
  type GameConfig,
} from '../types';
import { createGrid, getCellsInRect, checkSum, clearCells, remainingCount, hasValidMove } from '../logic/board';

const VALID_COLOR = 0xef4444;   // red
const INVALID_COLOR = 0x9ca3af; // gray
const CELL_BG = 0xffffff;
const CELL_BORDER = 0xe5e7eb;
const NUM_COLORS = [
  0x000000, // unused (0)
  0x3b82f6, // 1 blue
  0x22c55e, // 2 green
  0xf97316, // 3 orange
  0xa855f7, // 4 purple
  0xef4444, // 5 red
  0x06b6d4, // 6 cyan
  0xeab308, // 7 yellow
  0xec4899, // 8 pink
  0x111827, // 9 dark
];

export class PlayScene extends Phaser.Scene {
  private cells: Cell[] = [];
  private config!: GameConfig;
  private dpr = 1;

  private cellSize = 0;
  private gridX = 0;
  private gridY = 0;

  private score = 0;
  private gameOver = false;
  private checkingEnd = false;

  // Drag state
  private isDragging = false;
  private dragStartCol = 0;
  private dragStartRow = 0;
  private selectionRect?: Phaser.GameObjects.Graphics;
  private cellTexts: Phaser.GameObjects.Text[] = [];
  private cellBgs: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;

    // Calculate cell size to fill screen
    const padX = 4 * scale;
    const padY = 4 * scale;
    const availW = w - padX * 2;
    const availH = h - padY * 2;
    this.cellSize = Math.floor(Math.min(availW / COLS, availH / ROWS));
    const gridW = this.cellSize * COLS;
    const gridH = this.cellSize * ROWS;
    this.gridX = (w - gridW) / 2;
    this.gridY = (h - gridH) / 2;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0xf0f2f5);

    // Init game state — ensure board has at least one valid move
    this.score = 0;
    this.gameOver = false;
    this.checkingEnd = false;
    do {
      this.cells = createGrid();
    } while (!hasValidMove(this.cells));

    this.drawGrid();
    this.setupInput();
    this.emitState();
  }

  // ─── Grid Drawing ─────────────────────────────────────

  private drawGrid() {
    // Clear old
    this.cellBgs.forEach((b) => b.destroy());
    this.cellTexts.forEach((t) => t.destroy());
    this.cellBgs = [];
    this.cellTexts = [];

    const cs = this.cellSize;
    const fontSize = Math.floor(cs * 0.55);

    for (const cell of this.cells) {
      const x = this.gridX + cell.col * cs;
      const y = this.gridY + cell.row * cs;

      if (cell.value > 0) {
        const bg = this.add.rectangle(x + cs / 2, y + cs / 2, cs - 1, cs - 1, CELL_BG);
        bg.setStrokeStyle(1, CELL_BORDER);
        this.cellBgs.push(bg);

        const color = NUM_COLORS[cell.value] ?? 0x111827;
        const txt = this.add.text(x + cs / 2, y + cs / 2, String(cell.value), {
          fontSize: `${fontSize}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: `#${color.toString(16).padStart(6, '0')}`,
          fontStyle: 'bold',
        });
        txt.setOrigin(0.5);
        this.cellTexts.push(txt);
      }
    }
  }

  // ─── Input ────────────────────────────────────────────

  private setupInput() {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.gameOver || this.checkingEnd) return;
      const { col, row } = this.pointerToCell(p.x, p.y);
      if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;
      this.game.events.emit('drag-start');
      this.isDragging = true;
      this.dragStartCol = col;
      this.dragStartRow = row;
      this.updateSelection(col, row);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const { col, row } = this.pointerToCell(p.x, p.y);
      const cCol = Math.max(0, Math.min(COLS - 1, col));
      const cRow = Math.max(0, Math.min(ROWS - 1, row));
      this.updateSelection(cCol, cRow);
    });

    this.input.on('pointerup', () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.tryMatch();
      this.clearSelection();
    });
  }

  private pointerToCell(px: number, py: number): { col: number; row: number } {
    const col = Math.floor((px - this.gridX) / this.cellSize);
    const row = Math.floor((py - this.gridY) / this.cellSize);
    return { col, row };
  }

  private updateSelection(endCol: number, endRow: number) {
    this.lastEndCol = endCol;
    this.lastEndRow = endRow;
    if (this.selectionRect) this.selectionRect.destroy();

    const selected = getCellsInRect(this.cells, this.dragStartCol, this.dragStartRow, endCol, endRow);
    const isValid = checkSum(selected);

    const cs = this.cellSize;
    const minC = Math.min(this.dragStartCol, endCol);
    const maxC = Math.max(this.dragStartCol, endCol);
    const minR = Math.min(this.dragStartRow, endRow);
    const maxR = Math.max(this.dragStartRow, endRow);

    const rx = this.gridX + minC * cs;
    const ry = this.gridY + minR * cs;
    const rw = (maxC - minC + 1) * cs;
    const rh = (maxR - minR + 1) * cs;

    const g = this.add.graphics();
    const color = isValid ? VALID_COLOR : INVALID_COLOR;
    g.fillStyle(color, 0.15);
    g.fillRect(rx, ry, rw, rh);
    g.lineStyle(2 * this.dpr, color, 0.6);
    g.strokeRect(rx, ry, rw, rh);
    g.setDepth(50);
    this.selectionRect = g;
  }

  private clearSelection() {
    if (this.selectionRect) {
      this.selectionRect.destroy();
      this.selectionRect = undefined;
    }
  }

  // ─── Match Logic ──────────────────────────────────────

  private tryMatch() {
    // Find current selection bounds from last known drag
    const selected = getCellsInRect(
      this.cells,
      this.dragStartCol,
      this.dragStartRow,
      // We need to store the last end col/row
      this.lastEndCol,
      this.lastEndRow,
    );

    if (!checkSum(selected)) return;

    this.game.events.emit('cells-cleared');

    // Clear matched cells
    const cleared = clearCells(this.cells, selected);
    this.score += cleared;

    // Animate: flash then remove
    this.animateClear(selected);
    this.emitState();

    // Check end conditions after animation
    this.checkingEnd = true;
    this.time.delayedCall(150, () => {
      if (remainingCount(this.cells) === 0) {
        this.endGame(true);
      } else if (!hasValidMove(this.cells)) {
        this.endGame(false);
      } else {
        this.checkingEnd = false;
      }
    });
  }

  private lastEndCol = 0;
  private lastEndRow = 0;

  private animateClear(cleared: Cell[]) {
    const cs = this.cellSize;

    for (const cell of cleared) {
      const x = this.gridX + cell.col * cs + cs / 2;
      const y = this.gridY + cell.row * cs + cs / 2;

      const flash = this.add.rectangle(x, y, cs, cs, VALID_COLOR, 0.4);
      flash.setDepth(100);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 1.2,
        duration: 300,
        onComplete: () => flash.destroy(),
      });
    }

    // Redraw grid after animation
    this.time.delayedCall(100, () => this.drawGrid());
  }


  // ─── Game Over ─────────────────────────────────────────

  private endGame(perfect: boolean) {
    this.gameOver = true;
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;

    // Dim overlay
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5);
    overlay.setDepth(200);

    // Result card
    const cardW = 280 * scale;
    const cardH = 220 * scale;
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 1);
    card.fillRoundedRect(w / 2 - cardW / 2, h / 2 - cardH / 2, cardW, cardH, 16 * scale);
    card.setDepth(201);

    const title = perfect ? 'Perfect Clear!' : 'No More Moves';
    const titleColor = perfect ? '#22C55E' : '#EF4444';

    const titleText = this.add.text(w / 2, h / 2 - 60 * scale, title, {
      fontSize: `${22 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: titleColor,
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5).setDepth(202);

    const scoreLabel = this.add.text(w / 2, h / 2 - 20 * scale, 'Cleared', {
      fontSize: `${13 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#6B7280',
    });
    scoreLabel.setOrigin(0.5).setDepth(202);

    const scoreText = this.add.text(w / 2, h / 2 + 12 * scale, `${this.score} / ${TOTAL_CELLS}`, {
      fontSize: `${28 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#111827',
      fontStyle: 'bold',
    });
    scoreText.setOrigin(0.5).setDepth(202);

    // Play Again button
    const btnY = h / 2 + 65 * scale;
    const btnW = 180 * scale;
    const btnH = 44 * scale;
    const btn = this.add.graphics();
    btn.fillStyle(0x2563eb, 1);
    btn.fillRoundedRect(w / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 12 * scale);
    btn.setDepth(202);

    const btnText = this.add.text(w / 2, btnY, 'Play Again', {
      fontSize: `${16 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5).setDepth(203);

    const hitArea = this.add
      .rectangle(w / 2, btnY, btnW, btnH)
      .setInteractive()
      .setAlpha(0.001)
      .setDepth(204);
    hitArea.on('pointerdown', () => this.scene.restart({ config: this.config, dpr: this.dpr }));

    // Emit result
    this.game.events.emit('game-over', {
      score: this.score,
      total: TOTAL_CELLS,
      perfect,
    });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', {
      score: this.score,
      total: TOTAL_CELLS,
      remaining: remainingCount(this.cells),
    });
  }
}
