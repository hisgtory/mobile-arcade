import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  CELL_SIZE,
  CAR_COLORS,
  getStageConfig,
  type BoardState,
  type Car,
  type GameConfig,
} from '../types';
import {
  createBoard,
  canCarMove,
  executeMove,
  getExitTarget,
  getCarCells,
  isWon,
  remainingCars,
} from '../logic/board';

const CAR_RADIUS = 8;
const ARROW_SIZE = 10;

type GamePhase = 'idle' | 'animating' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  private carContainers: Map<number, Phaser.GameObjects.Container> = new Map();
  private phase: GamePhase = 'idle';
  private moveHistory: BoardState[] = [];
  private score = 0;
  private moves = 0;

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
    this.moveHistory = [];
    this.score = 0;
    this.moves = 0;

    this.drawBoard();
    this.emitState();

    this.events.on('shutdown', this.shutdown, this);
  }

  // ─── Layout ───────────────────────────────────────────

  private getGridOrigin(): { x: number; y: number } {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const scale = this.dpr;
    const gridW = this.board.cols * CELL_SIZE * scale;
    const gridH = this.board.rows * CELL_SIZE * scale;
    return {
      x: (w - gridW) / 2,
      y: (h - gridH) / 2,
    };
  }

  private cellToPixel(row: number, col: number): { x: number; y: number } {
    const origin = this.getGridOrigin();
    const scale = this.dpr;
    const cellS = CELL_SIZE * scale;
    return {
      x: origin.x + col * cellS + cellS / 2,
      y: origin.y + row * cellS + cellS / 2,
    };
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear previous
    this.carContainers.forEach((c) => c.destroy());
    this.carContainers.clear();

    this.drawGrid();
    this.drawExitArrows();

    for (const car of this.board.cars) {
      if (!car.exited) {
        this.drawCar(car);
      }
    }
  }

  private drawGrid() {
    const origin = this.getGridOrigin();
    const scale = this.dpr;
    const cellS = CELL_SIZE * scale;
    const g = this.add.graphics();

    // Grid background
    g.fillStyle(0xf3f4f6, 1);
    g.fillRoundedRect(
      origin.x - 4 * scale,
      origin.y - 4 * scale,
      this.board.cols * cellS + 8 * scale,
      this.board.rows * cellS + 8 * scale,
      12 * scale,
    );

    // Grid lines
    g.lineStyle(1, 0xe5e7eb, 0.5);
    for (let r = 0; r <= this.board.rows; r++) {
      const y = origin.y + r * cellS;
      g.lineBetween(origin.x, y, origin.x + this.board.cols * cellS, y);
    }
    for (let c = 0; c <= this.board.cols; c++) {
      const x = origin.x + c * cellS;
      g.lineBetween(x, origin.y, x, origin.y + this.board.rows * cellS);
    }
  }

  private drawExitArrows() {
    const origin = this.getGridOrigin();
    const scale = this.dpr;
    const cellS = CELL_SIZE * scale;
    const g = this.add.graphics();
    g.fillStyle(0x9ca3af, 0.4);

    // Draw small triangles at edges to indicate exit direction
    // Top edge arrows (for 'up')
    for (let c = 0; c < this.board.cols; c++) {
      const x = origin.x + c * cellS + cellS / 2;
      const y = origin.y - 8 * scale;
      g.fillTriangle(
        x, y - ARROW_SIZE * scale,
        x - 6 * scale, y,
        x + 6 * scale, y,
      );
    }
    // Bottom edge arrows (for 'down')
    for (let c = 0; c < this.board.cols; c++) {
      const x = origin.x + c * cellS + cellS / 2;
      const y = origin.y + this.board.rows * cellS + 8 * scale;
      g.fillTriangle(
        x, y + ARROW_SIZE * scale,
        x - 6 * scale, y,
        x + 6 * scale, y,
      );
    }
    // Left edge arrows (for 'left')
    for (let r = 0; r < this.board.rows; r++) {
      const x = origin.x - 8 * scale;
      const y = origin.y + r * cellS + cellS / 2;
      g.fillTriangle(
        x - ARROW_SIZE * scale, y,
        x, y - 6 * scale,
        x, y + 6 * scale,
      );
    }
    // Right edge arrows (for 'right')
    for (let r = 0; r < this.board.rows; r++) {
      const x = origin.x + this.board.cols * cellS + 8 * scale;
      const y = origin.y + r * cellS + cellS / 2;
      g.fillTriangle(
        x + ARROW_SIZE * scale, y,
        x, y - 6 * scale,
        x, y + 6 * scale,
      );
    }
  }

  private drawCar(car: Car) {
    const scale = this.dpr;
    const cellS = CELL_SIZE * scale;
    const isHorizontal = car.direction === 'left' || car.direction === 'right';
    const color = CAR_COLORS[car.colorIndex % CAR_COLORS.length];
    const hex = parseInt(color.replace('#', ''), 16);

    // Calculate container position (center of the car)
    const cells = getCarCells(car);
    const firstCell = this.cellToPixel(cells[0][0], cells[0][1]);
    const lastCell = this.cellToPixel(cells[cells.length - 1][0], cells[cells.length - 1][1]);
    const centerX = (firstCell.x + lastCell.x) / 2;
    const centerY = (firstCell.y + lastCell.y) / 2;

    const container = this.add.container(centerX, centerY);

    // Car body
    const bodyW = isHorizontal ? car.length * cellS - 8 * scale : cellS - 8 * scale;
    const bodyH = isHorizontal ? cellS - 8 * scale : car.length * cellS - 8 * scale;
    const radius = CAR_RADIUS * scale;

    const body = this.add.graphics();
    body.fillStyle(hex, 1);
    body.fillRoundedRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, radius);

    // Darker border
    body.lineStyle(2 * scale, this.darkenColor(hex, 0.2), 1);
    body.strokeRoundedRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, radius);
    container.add(body);

    // Direction arrow on car
    const arrow = this.add.graphics();
    arrow.fillStyle(0xffffff, 0.8);
    const arrowS = 8 * scale;
    switch (car.direction) {
      case 'right':
        arrow.fillTriangle(arrowS, 0, -arrowS / 2, -arrowS / 2, -arrowS / 2, arrowS / 2);
        break;
      case 'left':
        arrow.fillTriangle(-arrowS, 0, arrowS / 2, -arrowS / 2, arrowS / 2, arrowS / 2);
        break;
      case 'down':
        arrow.fillTriangle(0, arrowS, -arrowS / 2, -arrowS / 2, arrowS / 2, -arrowS / 2);
        break;
      case 'up':
        arrow.fillTriangle(0, -arrowS, -arrowS / 2, arrowS / 2, arrowS / 2, arrowS / 2);
        break;
    }
    container.add(arrow);

    // Highlight if can move
    if (canCarMove(this.board, car.id)) {
      const glow = this.add.graphics();
      glow.fillStyle(0xffffff, 0.15);
      glow.fillRoundedRect(-bodyW / 2 - 2 * scale, -bodyH / 2 - 2 * scale, bodyW + 4 * scale, bodyH + 4 * scale, radius + 2 * scale);
      container.addAt(glow, 0);
    }

    // Hit area
    const hitArea = this.add
      .rectangle(0, 0, bodyW + 12 * scale, bodyH + 12 * scale)
      .setInteractive()
      .setAlpha(0.001);
    hitArea.on('pointerdown', () => this.onCarTap(car.id));
    container.add(hitArea);

    this.carContainers.set(car.id, container);
  }

  private darkenColor(hex: number, amount: number): number {
    const r = Math.max(0, ((hex >> 16) & 0xff) * (1 - amount)) | 0;
    const g = Math.max(0, ((hex >> 8) & 0xff) * (1 - amount)) | 0;
    const b = Math.max(0, (hex & 0xff) * (1 - amount)) | 0;
    return (r << 16) | (g << 8) | b;
  }

  // ─── Interaction ──────────────────────────────────────

  private onCarTap(carId: number) {
    if (this.phase !== 'idle') return;

    if (canCarMove(this.board, carId)) {
      this.animateCarExit(carId);
    } else {
      this.shakeCar(carId);
    }
  }

  private shakeCar(carId: number) {
    const container = this.carContainers.get(carId);
    if (!container) return;
    const origX = container.x;

    this.tweens.add({
      targets: container,
      x: origX + 6 * this.dpr,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        container.x = origX;
      },
    });
  }

  // ─── Car Exit Animation ───────────────────────────────

  private animateCarExit(carId: number) {
    this.phase = 'animating';

    // Save state for undo
    this.moveHistory.push({
      cars: this.board.cars.map((c) => ({ ...c })),
      cols: this.board.cols,
      rows: this.board.rows,
    });

    const car = this.board.cars.find((c) => c.id === carId)!;
    const container = this.carContainers.get(carId);
    if (!container) return;

    const target = getExitTarget(car, this.board);
    const targetPixel = this.cellToPixel(target.row, target.col);

    // Execute move on data
    this.board = executeMove(this.board, carId);
    this.moves++;
    this.score += 100;

    // Animate car driving off
    this.tweens.add({
      targets: container,
      x: targetPixel.x,
      y: targetPixel.y,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Explicit cleanup will be handled by drawBoard() in onMoveComplete()
        this.onMoveComplete();
      },
    });
  }

  private onMoveComplete() {
    this.drawBoard();
    this.emitState();

    if (isWon(this.board)) {
      this.phase = 'celebrating';
      this.time.delayedCall(400, () => {
        this.celebrateWin();
      });
    } else {
      this.phase = 'idle';
    }
  }

  // ─── Juice Effects ────────────────────────────────────

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
    this.board = prev;
    this.moves = Math.max(0, this.moves - 1);
    this.score = Math.max(0, this.score - 100);

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
    this.game.events.emit('cars-update', { remaining: remainingCars(this.board), total: this.board.cars.length });
  }

  shutdown() {
    this.tweens.killAll();
    this.carContainers.forEach((c) => {
      if (c && c.active) c.destroy();
    });
    this.carContainers.clear();
  }
}
