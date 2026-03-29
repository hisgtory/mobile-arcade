import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  PIN_COLORS,
  ROPE_COLORS,
  getStageConfig,
  type BoardState,
  type GameConfig,
  type Pin,
} from '../types';
import { createBoard, countIntersections, isWon } from '../logic/board';

const PIN_RADIUS = 14;
const PIN_STROKE = 3;

type GamePhase = 'idle' | 'dragging' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private pinGraphics: Phaser.GameObjects.Container[] = [];
  private ropeGraphics!: Phaser.GameObjects.Graphics;
  private dragPin: number | null = null;
  private phase: GamePhase = 'idle';
  private moves = 0;
  private intersections = 0;
  private moveHistory: { pinId: number; x: number; y: number }[] = [];

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
    this.board = createBoard(stageConfig, this.dpr);
    this.phase = 'idle';
    this.moves = 0;
    this.moveHistory = [];
    this.dragPin = null;

    // Rope graphics layer (drawn behind pins)
    this.ropeGraphics = this.add.graphics();
    this.ropeGraphics.setDepth(0);

    this.drawRopes();
    this.createPins();
    this.updateIntersections();
    this.emitState();
  }

  // ─── Drawing ──────────────────────────────────────────

  private createPins() {
    // Clear previous
    this.pinGraphics.forEach(c => c.destroy());
    this.pinGraphics = [];

    const scale = this.dpr;
    const r = PIN_RADIUS * scale;
    const stroke = PIN_STROKE * scale;

    this.board.pins.forEach((pin) => {
      const container = this.add.container(pin.x, pin.y);
      container.setDepth(10);

      // Outer circle (shadow)
      const shadow = this.add.circle(0, 2 * scale, r + 2 * scale, 0x000000, 0.1);
      container.add(shadow);

      // Main circle
      const color = PIN_COLORS[pin.colorIndex % PIN_COLORS.length];
      const hex = parseInt(color.replace('#', ''), 16);
      const circle = this.add.circle(0, 0, r, hex, 1);
      circle.setStrokeStyle(stroke, 0xffffff, 0.9);
      container.add(circle);

      // Inner highlight
      const highlight = this.add.circle(-r * 0.25, -r * 0.25, r * 0.3, 0xffffff, 0.4);
      container.add(highlight);

      // Hit area - larger than visual for easier dragging
      const hitArea = this.add
        .circle(0, 0, r * 2.2, 0x000000, 0.001)
        .setInteractive({ draggable: true, useHandCursor: true });

      hitArea.on('dragstart', () => this.onDragStart(pin.id));
      hitArea.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        this.onDrag(pin.id, dragX, dragY);
      });
      hitArea.on('dragend', () => this.onDragEnd(pin.id));

      container.add(hitArea);

      // Enable container drag
      this.input.setDraggable(hitArea);

      this.pinGraphics.push(container);
    });
  }

  private drawRopes() {
    this.ropeGraphics.clear();

    const scale = this.dpr;
    const lineWidth = 3 * scale;

    this.board.ropes.forEach(rope => {
      const pinA = this.board.pins.find(p => p.id === rope.pinA)!;
      const pinB = this.board.pins.find(p => p.id === rope.pinB)!;

      const color = ROPE_COLORS[rope.colorIndex % ROPE_COLORS.length];
      const hex = parseInt(color.replace('#', ''), 16);

      // Draw rope shadow
      this.ropeGraphics.lineStyle(lineWidth + 2 * scale, 0x000000, 0.08);
      this.ropeGraphics.lineBetween(pinA.x, pinA.y + 2 * scale, pinB.x, pinB.y + 2 * scale);

      // Draw rope
      this.ropeGraphics.lineStyle(lineWidth, hex, 0.85);
      this.ropeGraphics.lineBetween(pinA.x, pinA.y, pinB.x, pinB.y);
    });
  }

  // ─── Interaction ──────────────────────────────────────

  private onDragStart(pinId: number) {
    if (this.phase === 'celebrating') return;

    this.dragPin = pinId;
    this.phase = 'dragging';

    const pin = this.board.pins.find(p => p.id === pinId)!;
    // Save position for undo
    this.moveHistory.push({ pinId, x: pin.x, y: pin.y });

    // Scale up the dragged pin
    const container = this.pinGraphics[pinId];
    if (container) {
      this.tweens.add({
        targets: container,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        ease: 'Back.easeOut',
      });
      container.setDepth(20);
    }
  }

  private onDrag(pinId: number, dragX: number, dragY: number) {
    if (this.phase !== 'dragging' || this.dragPin !== pinId) return;

    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const pad = 20 * this.dpr;

    // Clamp position within bounds
    const x = Math.max(pad, Math.min(w - pad, dragX));
    const y = Math.max(pad, Math.min(h - pad, dragY));

    // Update pin position in data
    const pin = this.board.pins.find(p => p.id === pinId)!;
    pin.x = x;
    pin.y = y;

    // Update visual position
    const container = this.pinGraphics[pinId];
    if (container) {
      container.setPosition(x, y);
    }

    // Redraw ropes
    this.drawRopes();
  }

  private onDragEnd(pinId: number) {
    if (this.dragPin !== pinId) return;

    this.dragPin = null;
    this.moves++;

    // Scale back down
    const container = this.pinGraphics[pinId];
    if (container) {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut',
      });
      container.setDepth(10);
    }

    this.updateIntersections();
    this.emitState();

    // Check win
    if (isWon(this.board.pins, this.board.ropes)) {
      this.phase = 'celebrating';
      this.celebrateWin();
    } else {
      this.phase = 'idle';
    }
  }

  private updateIntersections() {
    this.intersections = countIntersections(this.board.pins, this.board.ropes);
  }

  // ─── Juice Effects ────────────────────────────────────

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const scale = this.dpr;

    // Flash all ropes green
    this.ropeGraphics.clear();
    const lineWidth = 3 * scale;
    this.board.ropes.forEach(rope => {
      const pinA = this.board.pins.find(p => p.id === rope.pinA)!;
      const pinB = this.board.pins.find(p => p.id === rope.pinB)!;
      this.ropeGraphics.lineStyle(lineWidth + 1 * scale, 0x22c55e, 1);
      this.ropeGraphics.lineBetween(pinA.x, pinA.y, pinB.x, pinB.y);
    });

    // Bounce all pins
    this.pinGraphics.forEach((container, idx) => {
      this.tweens.add({
        targets: container,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        delay: idx * 50,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    });

    // Confetti
    for (let i = 0; i < 30; i++) {
      const colors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316];
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
    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.calculateScore(),
        moves: this.moves,
        stage: this.config.stage ?? 1,
      });
    });
  }

  private calculateScore(): number {
    // Base score per stage, bonus for fewer moves
    const stage = this.config.stage ?? 1;
    const base = 100 * stage;
    const stageConfig = getStageConfig(stage);
    const idealMoves = stageConfig.ropeCount;
    const efficiency = Math.max(0.3, 1 - (this.moves - idealMoves) / (idealMoves * 3));
    return Math.round(base * efficiency);
  }

  // ─── Undo ─────────────────────────────────────────────

  public undo() {
    if (this.phase !== 'idle' || this.moveHistory.length === 0) return;
    const prev = this.moveHistory.pop()!;
    const pin = this.board.pins.find(p => p.id === prev.pinId)!;
    pin.x = prev.x;
    pin.y = prev.y;

    const container = this.pinGraphics[prev.pinId];
    if (container) {
      this.tweens.add({
        targets: container,
        x: prev.x,
        y: prev.y,
        duration: 200,
        ease: 'Cubic.easeOut',
      });
    }

    this.moves = Math.max(0, this.moves - 1);

    this.time.delayedCall(220, () => {
      this.drawRopes();
      this.updateIntersections();
      this.emitState();
    });
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('moves-update', { moves: this.moves });
    this.game.events.emit('intersections-update', { intersections: this.intersections });
  }
}
