import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  CELL_SIZE,
  GRID_GAP,
  type BoardState,
  type Vehicle,
  type GameConfig,
  type MoveRecord,
  getStageConfig,
} from '../types';
import {
  createBoard,
  canMoveVehicle,
  moveVehicle,
  getVehicleCells,
  canTargetExit,
} from '../logic/board';

const VEHICLE_RADIUS = 6;

function getVehicleLabel(vehicle: Vehicle): string {
  return vehicle.isTarget ? '🚌' : '🚗';
}

type GamePhase = 'idle' | 'dragging' | 'animating' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private vehicleSprites: Map<number, Phaser.GameObjects.Container> = new Map();
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cellSize = CELL_SIZE;

  // Interaction
  private phase: GamePhase = 'idle';
  private dragVehicleId: number | null = null;
  private dragStartPointer = { x: 0, y: 0 };
  private dragStartPos = { row: 0, col: 0 };
  private moveHistory: MoveRecord[] = [];
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
    this.dragVehicleId = null;

    this.calculateLayout();
    this.drawGrid();
    this.drawVehicles();
    this.drawExitArrow();
    this.setupInput();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private calculateLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const { gridRows, gridCols } = this.board;

    // Calculate cell size to fit the grid
    const maxGridW = w * 0.85;
    const maxGridH = h * 0.75;
    const cellFromW = (maxGridW - (gridCols - 1) * GRID_GAP * this.dpr) / gridCols;
    const cellFromH = (maxGridH - (gridRows - 1) * GRID_GAP * this.dpr) / gridRows;
    this.cellSize = Math.floor(Math.min(cellFromW, cellFromH, CELL_SIZE * this.dpr));

    const totalW = gridCols * this.cellSize + (gridCols - 1) * GRID_GAP * this.dpr;
    const totalH = gridRows * this.cellSize + (gridRows - 1) * GRID_GAP * this.dpr;
    this.gridOriginX = (w - totalW) / 2;
    this.gridOriginY = (h - totalH) / 2 + 10 * this.dpr;
  }

  private cellToPixel(row: number, col: number): { x: number; y: number } {
    const gap = GRID_GAP * this.dpr;
    return {
      x: this.gridOriginX + col * (this.cellSize + gap),
      y: this.gridOriginY + row * (this.cellSize + gap),
    };
  }

  private pixelToGridDelta(dx: number, dy: number): { deltaCol: number; deltaRow: number } {
    const step = this.cellSize + GRID_GAP * this.dpr;
    return {
      deltaCol: Math.round(dx / step),
      deltaRow: Math.round(dy / step),
    };
  }

  /** Clamp a raw grid delta to the max valid distance from the drag start position. */
  private clampDragDelta(vehicle: Vehicle, rawDR: number, rawDC: number): { finalDR: number; finalDC: number } {
    let finalDR = vehicle.direction === 'vertical' ? rawDR : 0;
    let finalDC = vehicle.direction === 'horizontal' ? rawDC : 0;
    const offsetR = vehicle.row - this.dragStartPos.row;
    const offsetC = vehicle.col - this.dragStartPos.col;

    if (finalDR !== 0) {
      const dir = finalDR > 0 ? 1 : -1;
      let maxDist = 0;
      for (let d = 1; d <= Math.abs(finalDR); d++) {
        if (canMoveVehicle(this.board, vehicle.id, dir * d - offsetR, 0)) {
          maxDist = d;
        } else break;
      }
      finalDR = dir * maxDist;
    }
    if (finalDC !== 0) {
      const dir = finalDC > 0 ? 1 : -1;
      let maxDist = 0;
      for (let d = 1; d <= Math.abs(finalDC); d++) {
        if (canMoveVehicle(this.board, vehicle.id, 0, dir * d - offsetC)) {
          maxDist = d;
        } else break;
      }
      finalDC = dir * maxDist;
    }

    return { finalDR, finalDC };
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawGrid() {
    const { gridRows, gridCols } = this.board;
    const gap = GRID_GAP * this.dpr;
    const radius = 4 * this.dpr;

    // Background grid
    const bg = this.add.graphics();
    const totalW = gridCols * this.cellSize + (gridCols - 1) * gap;
    const totalH = gridRows * this.cellSize + (gridRows - 1) * gap;
    const pad = 8 * this.dpr;
    bg.fillStyle(0xe5e7eb, 1);
    bg.fillRoundedRect(
      this.gridOriginX - pad,
      this.gridOriginY - pad,
      totalW + pad * 2,
      totalH + pad * 2,
      12 * this.dpr,
    );

    // Individual cells
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const { x, y } = this.cellToPixel(r, c);
        const cell = this.add.graphics();
        cell.fillStyle(0xf9fafb, 1);
        cell.fillRoundedRect(x, y, this.cellSize, this.cellSize, radius);
      }
    }

    // Exit opening (notch on the right side at exit row)
    const exitRow = this.board.exitRow;
    const exitY = this.cellToPixel(exitRow, 0).y;
    const exitX = this.gridOriginX + totalW + pad;
    const exit = this.add.graphics();
    exit.fillStyle(0xfbbf24, 0.4);
    exit.fillRoundedRect(exitX - 4 * this.dpr, exitY - 2 * this.dpr, 20 * this.dpr, this.cellSize + 4 * this.dpr, radius);
  }

  private drawExitArrow() {
    const { gridCols } = this.board;
    const gap = GRID_GAP * this.dpr;
    const totalW = gridCols * this.cellSize + (gridCols - 1) * gap;
    const pad = 8 * this.dpr;
    const exitY = this.cellToPixel(this.board.exitRow, 0).y + this.cellSize / 2;
    const arrowX = this.gridOriginX + totalW + pad + 14 * this.dpr;

    const arrow = this.add.text(arrowX, exitY, '→', {
      fontSize: `${20 * this.dpr}px`,
      color: '#EAB308',
      fontStyle: 'bold',
    });
    arrow.setOrigin(0.5, 0.5);

    // Pulse animation
    this.tweens.add({
      targets: arrow,
      x: arrowX + 6 * this.dpr,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawVehicles() {
    // Clear previous
    this.vehicleSprites.forEach(c => c.destroy());
    this.vehicleSprites.clear();

    const gap = GRID_GAP * this.dpr;
    const radius = VEHICLE_RADIUS * this.dpr;

    for (const vehicle of this.board.vehicles) {
      const { x, y } = this.cellToPixel(vehicle.row, vehicle.col);
      const container = this.add.container(0, 0);

      let vw: number;
      let vh: number;
      if (vehicle.direction === 'horizontal') {
        vw = vehicle.length * this.cellSize + (vehicle.length - 1) * gap;
        vh = this.cellSize;
      } else {
        vw = this.cellSize;
        vh = vehicle.length * this.cellSize + (vehicle.length - 1) * gap;
      }

      // Vehicle body
      const body = this.add.graphics();
      const hex = parseInt(vehicle.color.replace('#', ''), 16);
      body.fillStyle(hex, 1);
      body.fillRoundedRect(x, y, vw, vh, radius);

      // Slight 3D effect - lighter top strip
      const highlight = this.add.graphics();
      highlight.fillStyle(0xffffff, 0.2);
      highlight.fillRoundedRect(x + 2 * this.dpr, y + 2 * this.dpr, vw - 4 * this.dpr, vh * 0.35, { tl: radius, tr: radius, bl: 0, br: 0 });

      // Vehicle icon/label
      const text = this.add.text(
        x + vw / 2,
        y + vh / 2,
        getVehicleLabel(vehicle),
        { fontSize: `${Math.floor(this.cellSize * 0.5)}px` },
      );
      text.setOrigin(0.5, 0.5);

      container.add([body, highlight, text]);
      container.setDepth(vehicle.isTarget ? 10 : 5);

      this.vehicleSprites.set(vehicle.id, container);
    }
  }

  private updateVehiclePosition(vehicleId: number) {
    const vehicle = this.board.vehicles.find(v => v.id === vehicleId);
    const sprite = this.vehicleSprites.get(vehicleId);
    if (!vehicle || !sprite) return;

    const gap = GRID_GAP * this.dpr;
    const radius = VEHICLE_RADIUS * this.dpr;
    const { x, y } = this.cellToPixel(vehicle.row, vehicle.col);

    let vw: number;
    let vh: number;
    if (vehicle.direction === 'horizontal') {
      vw = vehicle.length * this.cellSize + (vehicle.length - 1) * gap;
      vh = this.cellSize;
    } else {
      vw = this.cellSize;
      vh = vehicle.length * this.cellSize + (vehicle.length - 1) * gap;
    }

    // Recreate the container's children at new position
    sprite.removeAll(true);

    const body = this.add.graphics();
    const hex = parseInt(vehicle.color.replace('#', ''), 16);
    body.fillStyle(hex, 1);
    body.fillRoundedRect(x, y, vw, vh, radius);

    const highlight = this.add.graphics();
    highlight.fillStyle(0xffffff, 0.2);
    highlight.fillRoundedRect(x + 2 * this.dpr, y + 2 * this.dpr, vw - 4 * this.dpr, vh * 0.35, { tl: radius, tr: radius, bl: 0, br: 0 });

    const text = this.add.text(x + vw / 2, y + vh / 2, getVehicleLabel(vehicle), {
      fontSize: `${Math.floor(this.cellSize * 0.5)}px`,
    });
    text.setOrigin(0.5, 0.5);

    sprite.add([body, highlight, text]);
  }

  // ─── Input Handling ───────────────────────────────────

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'idle') return;
      const vehicle = this.findVehicleAt(pointer.x, pointer.y);
      if (!vehicle) return;

      this.dragVehicleId = vehicle.id;
      this.dragStartPointer = { x: pointer.x, y: pointer.y };
      this.dragStartPos = { row: vehicle.row, col: vehicle.col };
      this.phase = 'dragging';

      // Lift effect
      const sprite = this.vehicleSprites.get(vehicle.id);
      if (sprite) {
        this.tweens.add({ targets: sprite, scaleX: 1.03, scaleY: 1.03, duration: 100 });
        sprite.setDepth(50);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'dragging' || this.dragVehicleId === null) return;

      const vehicle = this.board.vehicles.find(v => v.id === this.dragVehicleId);
      if (!vehicle) return;

      const dx = pointer.x - this.dragStartPointer.x;
      const dy = pointer.y - this.dragStartPointer.y;
      const { deltaCol, deltaRow } = this.pixelToGridDelta(dx, dy);
      const { finalDR, finalDC } = this.clampDragDelta(vehicle, deltaRow, deltaCol);

      // Preview position - move from the drag start position
      const previewRow = this.dragStartPos.row + finalDR;
      const previewCol = this.dragStartPos.col + finalDC;

      // Update visual only (don't modify board state yet)
      const sprite = this.vehicleSprites.get(vehicle.id);
      if (sprite) {
        const gap = GRID_GAP * this.dpr;
        const radius = VEHICLE_RADIUS * this.dpr;
        const { x, y } = this.cellToPixel(previewRow, previewCol);

        let vw: number;
        let vh: number;
        if (vehicle.direction === 'horizontal') {
          vw = vehicle.length * this.cellSize + (vehicle.length - 1) * gap;
          vh = this.cellSize;
        } else {
          vw = this.cellSize;
          vh = vehicle.length * this.cellSize + (vehicle.length - 1) * gap;
        }

        sprite.removeAll(true);
        const body = this.add.graphics();
        const hex = parseInt(vehicle.color.replace('#', ''), 16);
        body.fillStyle(hex, 1);
        body.fillRoundedRect(x, y, vw, vh, radius);

        const hl = this.add.graphics();
        hl.fillStyle(0xffffff, 0.2);
        hl.fillRoundedRect(x + 2 * this.dpr, y + 2 * this.dpr, vw - 4 * this.dpr, vh * 0.35, { tl: radius, tr: radius, bl: 0, br: 0 });

        const text = this.add.text(x + vw / 2, y + vh / 2, getVehicleLabel(vehicle), {
          fontSize: `${Math.floor(this.cellSize * 0.5)}px`,
        });
        text.setOrigin(0.5, 0.5);
        sprite.add([body, hl, text]);
      }
    });

    this.input.on('pointerup', () => {
      if (this.phase !== 'dragging' || this.dragVehicleId === null) return;

      const vehicle = this.board.vehicles.find(v => v.id === this.dragVehicleId);
      if (!vehicle) {
        this.phase = 'idle';
        this.dragVehicleId = null;
        return;
      }

      // Calculate final snapped position
      const sprite = this.vehicleSprites.get(vehicle.id);
      if (sprite) {
        this.tweens.add({ targets: sprite, scaleX: 1, scaleY: 1, duration: 100 });
        sprite.setDepth(vehicle.isTarget ? 10 : 5);
      }

      // Determine actual move from start pos
      const pointer = this.input.activePointer;
      const dx = pointer.x - this.dragStartPointer.x;
      const dy = pointer.y - this.dragStartPointer.y;
      const { deltaCol, deltaRow } = this.pixelToGridDelta(dx, dy);
      const { finalDR, finalDC } = this.clampDragDelta(vehicle, deltaRow, deltaCol);

      // Apply the actual board delta from current position
      const actualDR = this.dragStartPos.row + finalDR - vehicle.row;
      const actualDC = this.dragStartPos.col + finalDC - vehicle.col;

      if (actualDR !== 0 || actualDC !== 0) {
        // Record move
        this.moveHistory.push({
          vehicleId: vehicle.id,
          fromRow: vehicle.row,
          fromCol: vehicle.col,
          toRow: vehicle.row + actualDR,
          toCol: vehicle.col + actualDC,
        });

        // Apply move
        this.board = moveVehicle(this.board, vehicle.id, actualDR, actualDC);
        this.moves++;
        this.emitState();
      }

      // Redraw vehicle at final position
      this.updateVehiclePosition(vehicle.id);

      this.dragVehicleId = null;
      this.phase = 'idle';

      // Check win
      if (canTargetExit(this.board)) {
        this.animateTargetExit();
      }
    });
  }

  private findVehicleAt(px: number, py: number): Vehicle | null {
    for (const vehicle of this.board.vehicles) {
      const { x, y } = this.cellToPixel(vehicle.row, vehicle.col);
      const gap = GRID_GAP * this.dpr;
      let vw: number;
      let vh: number;
      if (vehicle.direction === 'horizontal') {
        vw = vehicle.length * this.cellSize + (vehicle.length - 1) * gap;
        vh = this.cellSize;
      } else {
        vw = this.cellSize;
        vh = vehicle.length * this.cellSize + (vehicle.length - 1) * gap;
      }

      if (px >= x && px <= x + vw && py >= y && py <= y + vh) {
        return vehicle;
      }
    }
    return null;
  }

  // ─── Win Animation ────────────────────────────────────

  private animateTargetExit() {
    this.phase = 'celebrating';
    const target = this.board.vehicles.find(v => v.isTarget);
    if (!target) return;

    const sprite = this.vehicleSprites.get(target.id);
    if (!sprite) return;

    this.score += 100 + Math.max(0, 50 - this.moves) * 10;

    // Animate the bus driving off to the right
    const exitX = DEFAULT_WIDTH * this.dpr + 100 * this.dpr;
    const { y } = this.cellToPixel(target.row, target.col);
    const gap = GRID_GAP * this.dpr;
    const vw = target.length * this.cellSize + (target.length - 1) * gap;
    const radius = VEHICLE_RADIUS * this.dpr;

    // Create an animated version
    const anim = this.add.container(0, 0);
    const body = this.add.graphics();
    const hex = parseInt(target.color.replace('#', ''), 16);
    body.fillStyle(hex, 1);
    body.fillRoundedRect(0, 0, vw, this.cellSize, radius);
    const text = this.add.text(vw / 2, this.cellSize / 2, '🚌', {
      fontSize: `${Math.floor(this.cellSize * 0.5)}px`,
    });
    text.setOrigin(0.5, 0.5);
    anim.add([body, text]);
    anim.setPosition(this.cellToPixel(target.row, target.col).x, y);
    anim.setDepth(100);

    // Hide the sprite
    sprite.setVisible(false);

    this.tweens.add({
      targets: anim,
      x: exitX,
      duration: 800,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        anim.destroy();
        this.celebrateWin();
      },
    });
  }

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

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
    const vehicle = this.board.vehicles.find(v => v.id === prev.vehicleId);
    if (!vehicle) return;

    const dr = prev.fromRow - vehicle.row;
    const dc = prev.fromCol - vehicle.col;
    this.board = moveVehicle(this.board, prev.vehicleId, dr, dc);
    this.moves = Math.max(0, this.moves - 1);
    this.updateVehiclePosition(prev.vehicleId);
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
