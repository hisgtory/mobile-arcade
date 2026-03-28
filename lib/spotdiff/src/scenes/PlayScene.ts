import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  PANEL_GAP,
  getStageConfig,
  type BoardState,
  type GameConfig,
  type StageConfig,
  type ShapeItem,
  type DiffType,
} from '../types';
import { createBoard, checkTap, markFound, isAllFound, loseLife, isGameOver } from '../logic/board';

const HUD_OFFSET = 60;
const PANEL_HEIGHT = 280;
const PANEL_PADDING = 8;
const PANEL_RADIUS = 12;
const HIT_RADIUS = 28;
const DIVIDER_HEIGHT = 2;
const CELEBRATION_PARTICLE_COUNT = 30;

type GamePhase = 'playing' | 'gameover' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;
  private score = 0;
  private combo = 0;
  private elapsedMs = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private stageConfig!: StageConfig;
  private phase: GamePhase = 'playing';

  private panelA!: Phaser.GameObjects.Container;
  private panelB!: Phaser.GameObjects.Container;
  private foundMarkers: Phaser.GameObjects.Graphics[] = [];

  // Cached layout values (canvas px)
  private hudY = 0;
  private panelHeight = 0;
  private panelBY = 0;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    const stage = this.config.stage ?? 1;
    this.stageConfig = getStageConfig(stage);
    this.board = createBoard(this.stageConfig);
    this.score = 0;
    this.combo = 0;
    this.elapsedMs = 0;
    this.phase = 'playing';
    this.foundMarkers = [];

    const s = this.dpr;
    const w = DEFAULT_WIDTH * s;
    const gap = PANEL_GAP * s;

    this.hudY = HUD_OFFSET * s;
    this.panelHeight = PANEL_HEIGHT * s;
    this.panelBY = this.hudY + this.panelHeight + gap;

    // ── Panel A (original) ──────────────────────────────
    this.panelA = this.add.container(0, this.hudY);
    const bgA = this.add.graphics();
    bgA.fillStyle(0xffffff, 1);
    bgA.fillRoundedRect(PANEL_PADDING * s, 0, w - PANEL_PADDING * 2 * s, this.panelHeight, PANEL_RADIUS * s);
    bgA.lineStyle(1 * s, 0xd1d5db, 1);
    bgA.strokeRoundedRect(PANEL_PADDING * s, 0, w - PANEL_PADDING * 2 * s, this.panelHeight, PANEL_RADIUS * s);
    this.panelA.add(bgA);

    // ── Divider ─────────────────────────────────────────
    const dividerY = this.hudY + this.panelHeight + gap / 2;
    const divider = this.add.graphics();
    divider.fillStyle(0xd1d5db, 1);
    divider.fillRect(20 * s, dividerY - (DIVIDER_HEIGHT * s) / 2, w - 40 * s, DIVIDER_HEIGHT * s);

    // ── Panel B (modified) ──────────────────────────────
    this.panelB = this.add.container(0, this.panelBY);
    const bgB = this.add.graphics();
    bgB.fillStyle(0xffffff, 1);
    bgB.fillRoundedRect(PANEL_PADDING * s, 0, w - PANEL_PADDING * 2 * s, this.panelHeight, PANEL_RADIUS * s);
    bgB.lineStyle(1 * s, 0xd1d5db, 1);
    bgB.strokeRoundedRect(PANEL_PADDING * s, 0, w - PANEL_PADDING * 2 * s, this.panelHeight, PANEL_RADIUS * s);
    this.panelB.add(bgB);

    // ── Draw shapes ─────────────────────────────────────
    this.drawPanelA();
    this.drawPanelB();

    // ── Input hit areas ─────────────────────────────────
    const hitA = this.add
      .rectangle(w / 2, this.hudY + this.panelHeight / 2, w, this.panelHeight)
      .setInteractive()
      .setAlpha(0.001);
    hitA.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const panelLocalX = pointer.x;
      const panelLocalY = pointer.y - this.hudY;
      this.onPanelTap(panelLocalX / s, panelLocalY / s, pointer.x, pointer.y);
    });

    const hitB = this.add
      .rectangle(w / 2, this.panelBY + this.panelHeight / 2, w, this.panelHeight)
      .setInteractive()
      .setAlpha(0.001);
    hitB.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const panelLocalX = pointer.x;
      const panelLocalY = pointer.y - this.panelBY;
      this.onPanelTap(panelLocalX / s, panelLocalY / s, pointer.x, pointer.y);
    });

    // ── Timer ───────────────────────────────────────────
    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (this.phase === 'playing') {
          this.elapsedMs += 100;
          this.emitState();
        }
      },
    });

    this.emitState();
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawPanelA() {
    const s = this.dpr;
    for (const shape of this.board.shapes) {
      this.drawShape(this.panelA, shape, s);
    }
  }

  private drawPanelB() {
    const s = this.dpr;
    const diffMap = new Map<number, { type: DiffType; diffValue: unknown }>();
    for (const diff of this.board.differences) {
      diffMap.set(diff.shapeId, { type: diff.type, diffValue: diff.diffValue });
    }

    for (const shape of this.board.shapes) {
      const diff = diffMap.get(shape.id);
      if (diff) {
        if (diff.type === 'missing') continue;

        let overridden = { ...shape };
        switch (diff.type) {
          case 'color':
            overridden = { ...overridden, color: diff.diffValue as number };
            break;
          case 'shape':
            overridden = { ...overridden, type: diff.diffValue as ShapeItem['type'] };
            break;
          case 'position': {
            const pos = diff.diffValue as { x: number; y: number };
            overridden = { ...overridden, x: pos.x, y: pos.y };
            break;
          }
          case 'size':
            overridden = { ...overridden, size: diff.diffValue as number };
            break;
        }
        this.drawShape(this.panelB, overridden, s);
      } else {
        this.drawShape(this.panelB, shape, s);
      }
    }
  }

  private drawShape(container: Phaser.GameObjects.Container, shape: ShapeItem, scale: number) {
    const g = this.add.graphics();
    const x = shape.x * scale;
    const y = shape.y * scale;
    const sz = shape.size * scale;

    g.fillStyle(shape.color, 1);

    switch (shape.type) {
      case 'circle':
        g.fillCircle(x, y, sz);
        break;
      case 'rect':
        g.setPosition(x, y);
        g.setRotation(shape.rotation);
        g.fillRect(-sz, -sz, sz * 2, sz * 2);
        container.add(g);
        return;
      case 'triangle': {
        const points = [
          { x: x, y: y - sz },
          { x: x - sz * 0.866, y: y + sz * 0.5 },
          { x: x + sz * 0.866, y: y + sz * 0.5 },
        ];
        g.fillTriangle(
          points[0].x, points[0].y,
          points[1].x, points[1].y,
          points[2].x, points[2].y,
        );
        break;
      }
      case 'star': {
        const spikes = 5;
        const outerR = sz;
        const innerR = sz * 0.4;
        g.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = -Math.PI / 2 + (i * Math.PI) / spikes;
          const px = x + Math.cos(angle) * r;
          const py = y + Math.sin(angle) * r;
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.closePath();
        g.fillPath();
        break;
      }
    }

    container.add(g);
  }

  // ─── Interaction ──────────────────────────────────────

  private onPanelTap(logicalX: number, logicalY: number, globalCanvasX: number, globalCanvasY: number) {
    if (this.phase !== 'playing') return;

    const hitRadius = HIT_RADIUS;
    const diffId = checkTap(this.board, logicalX, logicalY, hitRadius);

    if (diffId !== null) {
      this.board = markFound(this.board, diffId);
      this.combo++;
      this.score += 100 * this.combo;

      const diff = this.board.differences.find((d) => d.id === diffId)!;
      this.showFoundEffect(diff.x, diff.y);

      if (isAllFound(this.board)) {
        this.score += 500;
        if (this.board.lives === this.board.maxLives) {
          this.score += 300;
        }
        this.phase = 'celebrating';
        this.time.delayedCall(600, () => this.celebrateWin());
      }
      this.emitState();
    } else {
      this.combo = 0;
      this.board = loseLife(this.board);
      this.showMissEffect(globalCanvasX, globalCanvasY);

      if (isGameOver(this.board)) {
        this.phase = 'gameover';
        this.game.events.emit('game-over', {
          score: this.score,
          stage: this.config.stage ?? 1,
          elapsedMs: this.elapsedMs,
        });
      }
      this.emitState();
    }
  }

  // ─── Effects ──────────────────────────────────────────

  private showFoundEffect(logicalX: number, logicalY: number) {
    const s = this.dpr;
    const canvasX = logicalX * s;
    const panelAGlobalY = this.hudY + logicalY * s;
    const panelBGlobalY = this.panelBY + logicalY * s;

    for (const globalY of [panelAGlobalY, panelBGlobalY]) {
      const circle = this.add.graphics();
      circle.lineStyle(3 * s, 0x22c55e, 1);
      circle.strokeCircle(canvasX, globalY, 5 * s);
      circle.setDepth(200);

      this.tweens.add({
        targets: circle,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => circle.destroy(),
      });

      const marker = this.add.graphics();
      marker.lineStyle(2 * s, 0x22c55e, 0.8);
      marker.strokeCircle(canvasX, globalY, 18 * s);
      marker.setDepth(150);
      this.foundMarkers.push(marker);
    }
  }

  private showMissEffect(canvasX: number, canvasY: number) {
    const s = this.dpr;
    const sz = 12 * s;
    const xMark = this.add.graphics();
    xMark.lineStyle(3 * s, 0xef4444, 1);
    xMark.lineBetween(canvasX - sz, canvasY - sz, canvasX + sz, canvasY + sz);
    xMark.lineBetween(canvasX - sz, canvasY + sz, canvasX + sz, canvasY - sz);
    xMark.setDepth(200);

    this.tweens.add({
      targets: xMark,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => xMark.destroy(),
    });
  }

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    for (let i = 0; i < CELEBRATION_PARTICLE_COUNT; i++) {
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
        stage: this.config.stage ?? 1,
        elapsedMs: this.elapsedMs,
        foundCount: this.board.foundCount,
        totalDiffs: this.board.differences.length,
      });
    });
  }

  // ─── State ────────────────────────────────────────────

  private emitState() {
    this.game.events.emit('state-update', {
      score: this.score,
      lives: this.board.lives,
      maxLives: this.board.maxLives,
      foundCount: this.board.foundCount,
      totalDiffs: this.board.differences.length,
      elapsedMs: this.elapsedMs,
      combo: this.combo,
    });
  }

  public restart() {
    this.foundMarkers.forEach((m) => m.destroy());
    this.foundMarkers = [];
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = null;
    }
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }
}
