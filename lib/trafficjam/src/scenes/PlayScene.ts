import Phaser from 'phaser';
import {
  GRID_COLS,
  GRID_ROWS,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  VEHICLE_EMOJIS,
  getStageConfig,
  type BoardState,
  type Vehicle,
  type GameConfig,
} from '../types';
import { createBoard, canExit, removeVehicle, isWon, getVehicleCells } from '../logic/board';

type GamePhase = 'idle' | 'moving' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Layout
  private gridX = 0;
  private gridY = 0;
  private cellSize = 0;

  // Visual
  private vehicleObjects = new Map<string, Phaser.GameObjects.Container>();
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private phase: GamePhase = 'idle';
  private moveHistory: Vehicle[][] = [];
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

    this.calculateLayout();
    this.drawGrid();
    this.drawVehicles();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private calculateLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    const padding = 20 * this.dpr;
    const availW = w - padding * 2;
    const availH = h - padding * 2;

    this.cellSize = Math.floor(Math.min(availW / GRID_COLS, availH / GRID_ROWS));
    const gridW = this.cellSize * GRID_COLS;
    const gridH = this.cellSize * GRID_ROWS;

    this.gridX = (w - gridW) / 2;
    this.gridY = (h - gridH) / 2;
  }

  // ─── Grid Drawing ─────────────────────────────────────

  private drawGrid() {
    if (this.gridGraphics) this.gridGraphics.destroy();
    this.gridGraphics = this.add.graphics();

    const g = this.gridGraphics;
    const gridW = this.cellSize * GRID_COLS;
    const gridH = this.cellSize * GRID_ROWS;

    // Background
    g.fillStyle(0xe8ecf1, 1);
    g.fillRoundedRect(this.gridX - 4, this.gridY - 4, gridW + 8, gridH + 8, 8 * this.dpr);

    // Grid lines
    g.lineStyle(1, 0xd1d5db, 0.5);
    for (let r = 0; r <= GRID_ROWS; r++) {
      const y = this.gridY + r * this.cellSize;
      g.lineBetween(this.gridX, y, this.gridX + gridW, y);
    }
    for (let c = 0; c <= GRID_COLS; c++) {
      const x = this.gridX + c * this.cellSize;
      g.lineBetween(x, this.gridY, x, this.gridY + gridH);
    }
  }

  // ─── Vehicle Drawing ──────────────────────────────────

  private drawVehicles() {
    // Clear existing
    this.vehicleObjects.forEach((c) => c.destroy());
    this.vehicleObjects.clear();

    this.board.vehicles.forEach((vehicle, idx) => {
      const container = this.createVehicleVisual(vehicle, idx);
      this.vehicleObjects.set(vehicle.id, container);
    });
  }

  private createVehicleVisual(vehicle: Vehicle, idx: number): Phaser.GameObjects.Container {
    const isHorizontal = vehicle.direction === 'left' || vehicle.direction === 'right';
    const vw = isHorizontal ? this.cellSize * vehicle.length : this.cellSize;
    const vh = isHorizontal ? this.cellSize : this.cellSize * vehicle.length;

    const cx = this.gridX + vehicle.col * this.cellSize + vw / 2;
    const cy = this.gridY + vehicle.row * this.cellSize + vh / 2;

    const container = this.add.container(cx, cy);

    // Vehicle body (rounded rectangle)
    const hex = parseInt(vehicle.color.replace('#', ''), 16);
    const pad = 3 * this.dpr;
    const radius = 6 * this.dpr;

    const body = this.add.graphics();
    body.fillStyle(hex, 1);
    body.fillRoundedRect(-vw / 2 + pad, -vh / 2 + pad, vw - pad * 2, vh - pad * 2, radius);
    body.lineStyle(2 * this.dpr, 0xffffff, 0.4);
    body.strokeRoundedRect(-vw / 2 + pad, -vh / 2 + pad, vw - pad * 2, vh - pad * 2, radius);
    container.add(body);

    // Direction indicator (small arrow)
    const arrow = this.add.graphics();
    arrow.fillStyle(0xffffff, 0.6);
    const arrowSize = 5 * this.dpr;
    const offsetX = isHorizontal ? (vehicle.direction === 'right' ? vw / 2 - pad - arrowSize * 2 : -vw / 2 + pad + arrowSize) : 0;
    const offsetY = isHorizontal ? 0 : (vehicle.direction === 'down' ? vh / 2 - pad - arrowSize * 2 : -vh / 2 + pad + arrowSize);
    arrow.fillTriangle(
      offsetX, offsetY - arrowSize,
      offsetX + arrowSize, offsetY + arrowSize,
      offsetX - arrowSize, offsetY + arrowSize,
    );

    // Rotate arrow to point in direction
    switch (vehicle.direction) {
      case 'right': arrow.setRotation(Math.PI / 2); break;
      case 'left': arrow.setRotation(-Math.PI / 2); break;
      case 'down': arrow.setRotation(Math.PI); break;
      case 'up': arrow.setRotation(0); break;
    }
    container.add(arrow);

    // Emoji label
    const emoji = VEHICLE_EMOJIS[idx % VEHICLE_EMOJIS.length];
    const fontSize = Math.floor(this.cellSize * 0.45);
    const label = this.add.text(0, 0, emoji, {
      fontSize: `${fontSize}px`,
    }).setOrigin(0.5, 0.5);
    container.add(label);

    // Hit area
    const hitArea = this.add
      .rectangle(0, 0, vw, vh)
      .setInteractive()
      .setAlpha(0.001);
    hitArea.on('pointerdown', () => this.onVehicleTap(vehicle.id));
    container.add(hitArea);

    return container;
  }

  // ─── Interaction ──────────────────────────────────────

  private onVehicleTap(vehicleId: string) {
    if (this.phase !== 'idle') return;

    if (canExit(this.board, vehicleId)) {
      this.animateExit(vehicleId);
    } else {
      this.shakeVehicle(vehicleId);
    }
  }

  private shakeVehicle(vehicleId: string) {
    const container = this.vehicleObjects.get(vehicleId);
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

  // ─── Exit Animation ───────────────────────────────────

  private animateExit(vehicleId: string) {
    this.phase = 'moving';

    // Save state for undo
    this.moveHistory.push(this.board.vehicles.map((v) => ({ ...v })));

    const vehicle = this.board.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) { this.phase = 'idle'; return; }

    const container = this.vehicleObjects.get(vehicleId);
    if (!container) { this.phase = 'idle'; return; }

    // Calculate exit position (off-grid)
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const overshoot = this.cellSize * 2;

    let targetX = container.x;
    let targetY = container.y;

    switch (vehicle.direction) {
      case 'right': targetX = w + overshoot; break;
      case 'left': targetX = -overshoot; break;
      case 'down': targetY = h + overshoot; break;
      case 'up': targetY = -overshoot; break;
    }

    container.setDepth(100);

    this.tweens.add({
      targets: container,
      x: targetX,
      y: targetY,
      duration: 400,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        container.destroy();
        this.vehicleObjects.delete(vehicleId);
        this.onExitComplete(vehicleId);
      },
    });
  }

  private onExitComplete(vehicleId: string) {
    this.board = removeVehicle(this.board, vehicleId);
    this.moves++;
    this.score += 50;
    this.emitState();

    if (isWon(this.board)) {
      this.phase = 'celebrating';
      this.time.delayedCall(300, () => {
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
    const prevVehicles = this.moveHistory.pop()!;
    this.board = {
      ...this.board,
      vehicles: prevVehicles,
    };
    this.moves = Math.max(0, this.moves - 1);
    this.score = Math.max(0, this.score - 50);

    this.drawVehicles();
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
