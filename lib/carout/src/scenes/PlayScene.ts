import Phaser from 'phaser';
import {
  GRID_COLS,
  GRID_ROWS,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  CAR_COLORS,
  getStageConfig,
  type BoardState,
  type CarDef,
  type GameConfig,
} from '../types';
import { createBoard, getMovementRange, moveCar, canPlayerExit } from '../logic/board';

const CELL_SIZE = 50;
const GRID_PAD = 4;
const CAR_RADIUS = 6;
const CAR_PAD = 3;

type GamePhase = 'idle' | 'dragging' | 'animating' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private carSprites: Map<number, Phaser.GameObjects.Container> = new Map();
  private gridContainer!: Phaser.GameObjects.Container;
  private phase: GamePhase = 'idle';
  private moves = 0;
  private moveHistory: { carId: number; fromRow: number; fromCol: number }[] = [];

  // Drag state
  private dragCarId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOrigPos = 0;
  private dragRange = { min: 0, max: 0 };

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
    this.moveHistory = [];
    this.carSprites.clear();

    this.drawBoard();
    this.setupInput();
    this.emitState();
  }

  // ─── Input Setup (once) ───────────────────────────────

  private setupInput() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.onDragMove(pointer);
    });

    this.input.on('pointerup', () => {
      this.onDragEnd();
    });
  }

  // ─── Layout ───────────────────────────────────────────

  private getGridOrigin(): { x: number; y: number; cellSize: number } {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const scale = this.dpr;
    const cellSize = CELL_SIZE * scale;
    const gridW = GRID_COLS * cellSize;
    const gridH = GRID_ROWS * cellSize;
    const x = (w - gridW) / 2;
    const y = (h - gridH) / 2;
    return { x, y, cellSize };
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear previous
    if (this.gridContainer) this.gridContainer.destroy();
    this.carSprites.forEach((s) => s.destroy());
    this.carSprites.clear();

    const { x: gx, y: gy, cellSize } = this.getGridOrigin();
    const scale = this.dpr;
    const gridW = GRID_COLS * cellSize;
    const gridH = GRID_ROWS * cellSize;

    this.gridContainer = this.add.container(0, 0);

    // Grid background
    const bg = this.add.graphics();
    bg.fillStyle(0xe5e7eb, 1);
    bg.fillRoundedRect(gx - GRID_PAD * scale, gy - GRID_PAD * scale,
      gridW + GRID_PAD * 2 * scale, gridH + GRID_PAD * 2 * scale,
      8 * scale);
    this.gridContainer.add(bg);

    // Grid cells
    const cellGfx = this.add.graphics();
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cx = gx + c * cellSize;
        const cy = gy + r * cellSize;
        cellGfx.fillStyle(0xf9fafb, 1);
        cellGfx.fillRoundedRect(cx + 2 * scale, cy + 2 * scale,
          cellSize - 4 * scale, cellSize - 4 * scale, 4 * scale);
      }
    }
    this.gridContainer.add(cellGfx);

    // Exit marker
    this.drawExit(gx, gy, cellSize, scale);

    // Cars
    this.board.cars.forEach((car) => {
      this.drawCar(car, gx, gy, cellSize, scale);
    });
  }

  private drawExit(gx: number, gy: number, cellSize: number, scale: number) {
    const exit = this.board.exit;
    const gfx = this.add.graphics();
    const arrowSize = 16 * scale;

    if (exit.side === 'right') {
      const ex = gx + GRID_COLS * cellSize + GRID_PAD * scale;
      const ey = gy + exit.row * cellSize + cellSize / 2;

      // Exit opening
      gfx.fillStyle(0x22c55e, 0.5);
      gfx.fillRect(gx + GRID_COLS * cellSize - 2 * scale,
        gy + exit.row * cellSize + 2 * scale,
        6 * scale, cellSize - 4 * scale);

      // Arrow
      gfx.fillStyle(0x22c55e, 1);
      gfx.fillTriangle(
        ex + 4 * scale, ey - arrowSize / 2,
        ex + 4 * scale, ey + arrowSize / 2,
        ex + 4 * scale + arrowSize, ey,
      );
    } else if (exit.side === 'bottom') {
      const ex = gx + exit.col * cellSize + cellSize / 2;
      const ey = gy + GRID_ROWS * cellSize + GRID_PAD * scale;

      gfx.fillStyle(0x22c55e, 0.5);
      gfx.fillRect(gx + exit.col * cellSize + 2 * scale,
        gy + GRID_ROWS * cellSize - 2 * scale,
        cellSize - 4 * scale, 6 * scale);

      gfx.fillStyle(0x22c55e, 1);
      gfx.fillTriangle(
        ex - arrowSize / 2, ey + 4 * scale,
        ex + arrowSize / 2, ey + 4 * scale,
        ex, ey + 4 * scale + arrowSize,
      );
    }

    this.gridContainer.add(gfx);
  }

  private drawCar(car: CarDef, gx: number, gy: number, cellSize: number, scale: number) {
    const container = this.add.container(0, 0);
    const pad = CAR_PAD * scale;
    const radius = CAR_RADIUS * scale;

    const w = car.dir === 'H' ? car.length * cellSize - pad * 2 : cellSize - pad * 2;
    const h = car.dir === 'V' ? car.length * cellSize - pad * 2 : cellSize - pad * 2;

    const x = gx + car.col * cellSize + pad;
    const y = gy + car.row * cellSize + pad;

    // Car body
    const colorIdx = car.isPlayer ? 0 : ((car.id % (CAR_COLORS.length - 1)) + 1);
    const colorStr = CAR_COLORS[colorIdx];
    const colorHex = parseInt(colorStr.replace('#', ''), 16);

    const body = this.add.graphics();
    body.fillStyle(colorHex, 1);
    body.fillRoundedRect(0, 0, w, h, radius);

    // Highlight strip (top/left light reflection)
    const hl = this.add.graphics();
    hl.fillStyle(0xffffff, 0.3);
    if (car.dir === 'H') {
      hl.fillRoundedRect(4 * scale, 2 * scale, w - 8 * scale, h * 0.3, radius / 2);
    } else {
      hl.fillRoundedRect(2 * scale, 4 * scale, w * 0.3, h - 8 * scale, radius / 2);
    }

    // Windows for player car
    if (car.isPlayer) {
      const win = this.add.graphics();
      win.fillStyle(0xffffff, 0.4);
      if (car.dir === 'H') {
        // Front windshield
        const winW = cellSize * 0.3;
        win.fillRoundedRect(w - winW - 6 * scale, 6 * scale, winW, h - 12 * scale, 3 * scale);
      } else {
        const winH = cellSize * 0.3;
        win.fillRoundedRect(6 * scale, h - winH - 6 * scale, w - 12 * scale, winH, 3 * scale);
      }
      container.add(win);
    }

    container.add(body);
    container.add(hl);
    container.setPosition(x, y);
    container.setSize(w, h);

    // Interactive hit area
    const hitArea = this.add.rectangle(w / 2, h / 2, w, h).setInteractive().setAlpha(0.001);
    container.add(hitArea);

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.onDragStart(car.id, pointer);
    });

    this.carSprites.set(car.id, container);
  }

  // ─── Drag Interaction ─────────────────────────────────

  private onDragStart(carId: number, pointer: Phaser.Input.Pointer) {
    if (this.phase !== 'idle') return;

    const car = this.board.cars.find((c) => c.id === carId);
    if (!car) return;

    this.phase = 'dragging';
    this.dragCarId = carId;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
    this.dragOrigPos = car.dir === 'H' ? car.col : car.row;
    this.dragRange = getMovementRange(car, this.board.cars, this.board.rows, this.board.cols);
  }

  private onDragMove(pointer: Phaser.Input.Pointer) {
    if (this.phase !== 'dragging' || this.dragCarId === null) return;

    const car = this.board.cars.find((c) => c.id === this.dragCarId);
    if (!car) return;

    const { cellSize } = this.getGridOrigin();
    const container = this.carSprites.get(this.dragCarId);
    if (!container) return;

    const { x: gx, y: gy } = this.getGridOrigin();
    const pad = CAR_PAD * this.dpr;

    if (car.dir === 'H') {
      const dx = pointer.x - this.dragStartX;
      const cellDelta = dx / cellSize;
      let newCol = this.dragOrigPos + cellDelta;
      newCol = Math.max(this.dragRange.min, Math.min(this.dragRange.max, newCol));
      container.setPosition(gx + newCol * cellSize + pad, container.y);
    } else {
      const dy = pointer.y - this.dragStartY;
      const cellDelta = dy / cellSize;
      let newRow = this.dragOrigPos + cellDelta;
      newRow = Math.max(this.dragRange.min, Math.min(this.dragRange.max, newRow));
      container.setPosition(container.x, gy + newRow * cellSize + pad);
    }
  }

  private onDragEnd() {
    if (this.phase !== 'dragging' || this.dragCarId === null) return;

    const car = this.board.cars.find((c) => c.id === this.dragCarId);
    if (!car) return;

    const { cellSize } = this.getGridOrigin();
    const { x: gx, y: gy } = this.getGridOrigin();
    const pad = CAR_PAD * this.dpr;
    const container = this.carSprites.get(this.dragCarId);

    if (!container) {
      this.phase = 'idle';
      this.dragCarId = null;
      return;
    }

    // Snap to nearest cell
    let newPos: number;
    if (car.dir === 'H') {
      newPos = Math.round((container.x - pad - gx) / cellSize);
      newPos = Math.max(this.dragRange.min, Math.min(this.dragRange.max, newPos));
    } else {
      newPos = Math.round((container.y - pad - gy) / cellSize);
      newPos = Math.max(this.dragRange.min, Math.min(this.dragRange.max, newPos));
    }

    const origPos = this.dragOrigPos;
    const carId = this.dragCarId;

    this.dragCarId = null;

    if (newPos !== origPos) {
      // Save undo state
      this.moveHistory.push({
        carId: car.id,
        fromRow: car.row,
        fromCol: car.col,
      });

      // Apply movement
      this.board.cars = moveCar(this.board.cars, carId, newPos);
      this.moves++;
      this.emitState();

      // Animate snap
      this.phase = 'animating';
      this.drawBoard();
      this.phase = 'idle';

      // Check if player can exit
      if (car.isPlayer && canPlayerExit(this.board.cars, this.board.exit, this.board.rows, this.board.cols)) {
        this.animatePlayerExit();
      }
    } else {
      // Snap back
      this.phase = 'animating';
      this.drawBoard();
      this.phase = 'idle';
    }
  }

  // ─── Player Exit Animation ────────────────────────────

  private animatePlayerExit() {
    this.phase = 'celebrating';
    const player = this.board.cars.find((c) => c.isPlayer);
    if (!player) return;

    const container = this.carSprites.get(player.id);
    if (!container) return;

    const { x: gx, y: gy, cellSize } = this.getGridOrigin();
    const pad = CAR_PAD * this.dpr;
    const scale = this.dpr;

    let targetX = container.x;
    let targetY = container.y;

    if (this.board.exit.side === 'right') {
      targetX = gx + (GRID_COLS + 2) * cellSize;
    } else if (this.board.exit.side === 'bottom') {
      targetY = gy + (GRID_ROWS + 2) * cellSize;
    }

    this.tweens.add({
      targets: container,
      x: targetX,
      y: targetY,
      duration: 500,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.celebrateWin();
      },
    });
  }

  // ─── Celebration ──────────────────────────────────────

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

    // Emit stage clear
    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: Math.max(100, 1000 - this.moves * 50),
        moves: this.moves,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Undo ─────────────────────────────────────────────

  public undo() {
    if (this.phase !== 'idle' || this.moveHistory.length === 0) return;
    const prev = this.moveHistory.pop()!;
    this.board.cars = this.board.cars.map((c) => {
      if (c.id !== prev.carId) return c;
      return { ...c, row: prev.fromRow, col: prev.fromCol };
    });
    this.moves = Math.max(0, this.moves - 1);
    this.drawBoard();
    this.emitState();
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: Math.max(0, 1000 - this.moves * 50) });
    this.game.events.emit('moves-update', { moves: this.moves });
  }
}
