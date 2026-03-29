import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  OBJECT_SIZE_BASE,
  SHAPE_COLORS,
  getStageConfig,
  type BoardState,
  type GameConfig,
  type GameObject,
} from '../types';
import { createBoard, isInHole, isWon, remainingCount } from '../logic/board';

type GamePhase = 'idle' | 'celebrating' | 'gameover';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  private phase: GamePhase = 'idle';
  private score = 0;
  private absorbed = 0;
  private totalObjects = 0;
  private elapsedMs = 0;
  private timeLimit = 0; // ms, 0 = no limit
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  // Visual
  private holeGraphics: Phaser.GameObjects.Graphics | null = null;
  private objectSprites: Map<number, Phaser.GameObjects.Container> = new Map();
  private dragTarget: Phaser.GameObjects.Container | null = null;

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
    this.score = 0;
    this.absorbed = 0;
    this.totalObjects = stageConfig.objectCount;
    this.elapsedMs = 0;
    this.timeLimit = stageConfig.timeLimit * 1000;
    this.objectSprites.clear();

    this.drawHole();
    this.drawObjects();
    this.startTimer();
    this.emitState();
  }

  // ─── Timer ────────────────────────────────────────────

  private startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (this.phase !== 'idle') return;
        this.elapsedMs += 100;
        this.emitState();

        // Check time limit
        if (this.timeLimit > 0 && this.elapsedMs >= this.timeLimit) {
          this.onTimeUp();
        }
      },
    });
  }

  private onTimeUp() {
    if (this.phase !== 'idle') return;
    this.phase = 'gameover';
    if (this.timerEvent) this.timerEvent.destroy();

    this.time.delayedCall(500, () => {
      this.game.events.emit('game-over', {
        score: this.score,
        absorbed: this.absorbed,
        total: this.totalObjects,
        stage: this.config.stage ?? 1,
        elapsedMs: this.elapsedMs,
      });
    });
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawHole() {
    const g = this.add.graphics();
    const { holeX, holeY, holeRadius } = this.board;

    // Outer shadow
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(holeX, holeY, holeRadius + 6 * this.dpr);

    // Main hole
    g.fillStyle(0x1f2937, 1);
    g.fillCircle(holeX, holeY, holeRadius);

    // Inner gradient effect
    g.fillStyle(0x111827, 1);
    g.fillCircle(holeX, holeY, holeRadius * 0.7);

    // Highlight
    g.fillStyle(0x374151, 0.3);
    g.fillCircle(
      holeX - holeRadius * 0.2,
      holeY - holeRadius * 0.2,
      holeRadius * 0.25,
    );

    this.holeGraphics = g;
    g.setDepth(0);
  }

  private drawObjects() {
    const scale = this.dpr;
    const objSize = OBJECT_SIZE_BASE * scale;

    this.board.objects.forEach((obj) => {
      if (obj.absorbed) return;

      const container = this.add.container(obj.x, obj.y);
      const colorHex = parseInt(SHAPE_COLORS[obj.shape].replace('#', ''), 16);

      // Draw shape
      const g = this.add.graphics();

      switch (obj.shape) {
        case 'circle':
          g.fillStyle(colorHex, 1);
          g.fillCircle(0, 0, objSize * 0.5);
          g.lineStyle(2 * scale, 0xffffff, 0.3);
          g.strokeCircle(0, 0, objSize * 0.5);
          break;
        case 'square':
          g.fillStyle(colorHex, 1);
          g.fillRoundedRect(-objSize * 0.45, -objSize * 0.45, objSize * 0.9, objSize * 0.9, 4 * scale);
          g.lineStyle(2 * scale, 0xffffff, 0.3);
          g.strokeRoundedRect(-objSize * 0.45, -objSize * 0.45, objSize * 0.9, objSize * 0.9, 4 * scale);
          break;
        case 'triangle': {
          const r = objSize * 0.5;
          g.fillStyle(colorHex, 1);
          g.fillTriangle(0, -r, -r * 0.87, r * 0.5, r * 0.87, r * 0.5);
          g.lineStyle(2 * scale, 0xffffff, 0.3);
          g.strokeTriangle(0, -r, -r * 0.87, r * 0.5, r * 0.87, r * 0.5);
          break;
        }
        case 'diamond': {
          const r = objSize * 0.5;
          g.fillStyle(colorHex, 1);
          g.beginPath();
          g.moveTo(0, -r);
          g.lineTo(r * 0.7, 0);
          g.lineTo(0, r);
          g.lineTo(-r * 0.7, 0);
          g.closePath();
          g.fillPath();
          g.lineStyle(2 * scale, 0xffffff, 0.3);
          g.beginPath();
          g.moveTo(0, -r);
          g.lineTo(r * 0.7, 0);
          g.lineTo(0, r);
          g.lineTo(-r * 0.7, 0);
          g.closePath();
          g.strokePath();
          break;
        }
        case 'star': {
          const outer = objSize * 0.5;
          const inner = outer * 0.4;
          g.fillStyle(colorHex, 1);
          g.beginPath();
          for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outer : inner;
            const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
          }
          g.closePath();
          g.fillPath();
          g.lineStyle(2 * scale, 0xffffff, 0.3);
          g.beginPath();
          for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outer : inner;
            const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
          }
          g.closePath();
          g.strokePath();
          break;
        }
      }

      container.add(g);

      // Hit area for dragging
      const hitArea = this.add
        .rectangle(0, 0, objSize * 1.2, objSize * 1.2)
        .setInteractive({ draggable: true })
        .setAlpha(0.001);
      container.add(hitArea);

      container.setDepth(10);
      container.setData('objId', obj.id);

      this.objectSprites.set(obj.id, container);

      // Drag events
      hitArea.on('dragstart', () => {
        if (this.phase !== 'idle') return;
        this.dragTarget = container;
        container.setDepth(100);
        this.tweens.add({
          targets: container,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 100,
          ease: 'Back.easeOut',
        });
      });

      hitArea.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (this.phase !== 'idle') return;
        container.x = dragX;
        container.y = dragY;
      });

      hitArea.on('dragend', () => {
        if (this.phase !== 'idle') return;
        container.setDepth(10);
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
        });

        // Check if object is in hole
        const objData = this.board.objects.find((o) => o.id === obj.id);
        if (objData && !objData.absorbed) {
          objData.x = container.x;
          objData.y = container.y;

          if (isInHole(objData, this.board.holeX, this.board.holeY, this.board.holeRadius, this.dpr)) {
            this.absorbObject(objData, container);
          }
        }

        this.dragTarget = null;
      });
    });

    // Enable drag input
    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      gameObject.emit('drag', _pointer, dragX, dragY);
    });

    this.input.on('dragstart', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      gameObject.emit('dragstart');
    });

    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      gameObject.emit('dragend');
    });
  }

  // ─── Absorption ───────────────────────────────────────

  private absorbObject(obj: GameObject, container: Phaser.GameObjects.Container) {
    obj.absorbed = true;
    this.absorbed++;
    this.score += 10;

    // Animate into hole
    this.tweens.add({
      targets: container,
      x: this.board.holeX,
      y: this.board.holeY,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 250,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        container.destroy();
        this.objectSprites.delete(obj.id);
        this.pulseHole();
      },
    });

    this.emitState();

    // Check win
    if (isWon(this.board.objects)) {
      this.phase = 'celebrating';
      if (this.timerEvent) this.timerEvent.destroy();

      this.time.delayedCall(400, () => {
        this.celebrateWin();
      });
    }
  }

  private pulseHole() {
    if (!this.holeGraphics) return;
    this.tweens.add({
      targets: this.holeGraphics,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeInOut',
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

    // Time bonus
    const timeBonus = this.timeLimit > 0
      ? Math.max(0, Math.floor((this.timeLimit - this.elapsedMs) / 1000) * 5)
      : 0;
    this.score += timeBonus;

    // Emit stage clear
    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        absorbed: this.absorbed,
        total: this.totalObjects,
        stage: this.config.stage ?? 1,
        elapsedMs: this.elapsedMs,
      });
    });
  }

  // ─── Public Methods ───────────────────────────────────

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('state-update', {
      score: this.score,
      absorbed: this.absorbed,
      total: this.totalObjects,
      elapsedMs: this.elapsedMs,
      timeLimit: this.timeLimit,
      remaining: remainingCount(this.board.objects),
    });
  }
}
