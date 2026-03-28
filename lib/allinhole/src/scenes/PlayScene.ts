import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  getStageConfig,
  type GameConfig,
  type ObjDef,
} from '../types';
import { generateObjects, generateObstacles, calculateScore, type ObstacleDef } from '../logic/board';

const HOLE_COLOR = 0x1a1a2e;
const HOLE_OUTLINE = 0x16213e;
const OBSTACLE_COLOR = 0x6b7280;
const BG_COLOR = 0xf0f2f5;
const SWALLOW_DIST_FACTOR = 0.65;
const HOLE_GROW_PER_OBJ = 1.5;
const PULL_STRENGTH = 120;
const PULL_RANGE_FACTOR = 2.5;

interface LiveObject {
  def: ObjDef;
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  alive: boolean;
}

type GamePhase = 'playing' | 'celebrating' | 'gameover';

export class PlayScene extends Phaser.Scene {
  private config!: GameConfig;
  private dpr = 1;
  private phase: GamePhase = 'playing';

  // Hole
  private holeX = 0;
  private holeY = 0;
  private holeRadius = 0;
  private holeBaseRadius = 0;
  private holeGraphics!: Phaser.GameObjects.Graphics;
  private holeShadow!: Phaser.GameObjects.Graphics;

  // Objects
  private liveObjects: LiveObject[] = [];
  private swallowed = 0;
  private totalObjects = 0;

  // Obstacles
  private obstacles: ObstacleDef[] = [];
  private obstacleGraphics: Phaser.GameObjects.Graphics[] = [];

  // Timer
  private timeLimitMs = 0;
  private elapsedMs = 0;
  private score = 0;

  // Drag
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

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

    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;

    // Init state
    this.phase = 'playing';
    this.swallowed = 0;
    this.elapsedMs = 0;
    this.score = 0;
    this.holeBaseRadius = stageConfig.holeRadius * scale;
    this.holeRadius = this.holeBaseRadius;
    this.holeX = w / 2;
    this.holeY = h / 2;
    this.timeLimitMs = stageConfig.timeLimitSec * 1000;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, BG_COLOR);

    // Play area border
    const border = this.add.graphics();
    border.lineStyle(2 * scale, 0xd1d5db, 1);
    border.strokeRoundedRect(
      10 * scale,
      10 * scale,
      (DEFAULT_WIDTH - 20) * scale,
      (DEFAULT_HEIGHT - 20) * scale,
      12 * scale,
    );

    // Generate obstacles
    this.obstacles = generateObstacles(stageConfig);
    this.obstacleGraphics = [];
    for (const obs of this.obstacles) {
      const g = this.add.graphics();
      g.fillStyle(OBSTACLE_COLOR, 1);
      g.fillRoundedRect(
        obs.x * scale,
        obs.y * scale,
        obs.width * scale,
        obs.height * scale,
        4 * scale,
      );
      g.setDepth(5);
      this.obstacleGraphics.push(g);
    }

    // Generate objects
    const objDefs = generateObjects(stageConfig);
    this.totalObjects = objDefs.length;
    this.liveObjects = [];

    for (const def of objDefs) {
      const g = this.add.graphics();
      this.drawObject(g, def, scale);
      g.setDepth(10);

      this.liveObjects.push({
        def,
        graphics: g,
        x: def.x * scale,
        y: def.y * scale,
        alive: true,
      });
    }

    // Hole shadow (below hole)
    this.holeShadow = this.add.graphics();
    this.holeShadow.setDepth(15);

    // Hole
    this.holeGraphics = this.add.graphics();
    this.holeGraphics.setDepth(20);
    this.drawHole();

    // Input: drag the hole
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.holeX, this.holeY);
      if (dist < this.holeRadius * 2) {
        this.isDragging = true;
        this.dragOffsetX = this.holeX - pointer.x;
        this.dragOffsetY = this.holeY - pointer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.phase !== 'playing') return;
      this.moveHole(pointer.x + this.dragOffsetX, pointer.y + this.dragOffsetY);
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.emitState();
  }

  update(_time: number, delta: number) {
    if (this.phase !== 'playing') return;

    const scale = this.dpr;

    // Update timer
    this.elapsedMs += delta;
    const timeRemaining = Math.max(0, this.timeLimitMs - this.elapsedMs);

    this.game.events.emit('time-update', {
      timeRemainingSec: Math.ceil(timeRemaining / 1000),
      timeLimitSec: Math.ceil(this.timeLimitMs / 1000),
    });

    // Pull nearby objects toward hole
    for (const obj of this.liveObjects) {
      if (!obj.alive) continue;

      const dx = this.holeX - obj.x;
      const dy = this.holeY - obj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pullRange = this.holeRadius * PULL_RANGE_FACTOR;

      if (dist < pullRange && dist > 0) {
        // Attract objects toward the hole
        const strength = (1 - dist / pullRange) * PULL_STRENGTH * scale;
        const nx = dx / dist;
        const ny = dy / dist;
        obj.x += nx * strength * (delta / 1000);
        obj.y += ny * strength * (delta / 1000);

        // Clamp to play area
        const margin = 10 * scale;
        const maxX = (DEFAULT_WIDTH - 10) * scale;
        const maxY = (DEFAULT_HEIGHT - 10) * scale;
        obj.x = Phaser.Math.Clamp(obj.x, margin, maxX);
        obj.y = Phaser.Math.Clamp(obj.y, margin, maxY);

        obj.graphics.setPosition(obj.x - obj.def.x * scale, obj.y - obj.def.y * scale);
      }

      // Check swallow
      const swallowDist = this.holeRadius * SWALLOW_DIST_FACTOR;
      if (dist < swallowDist) {
        this.swallowObject(obj);
      }
    }

    // Check time out
    if (timeRemaining <= 0) {
      this.onTimeUp();
    }
  }

  // ─── Hole ──────────────────────────────────────────────

  private moveHole(x: number, y: number) {
    const scale = this.dpr;
    const margin = 15 * scale;
    const maxX = (DEFAULT_WIDTH - 15) * scale;
    const maxY = (DEFAULT_HEIGHT - 15) * scale;

    // Clamp hole position
    this.holeX = Phaser.Math.Clamp(x, margin, maxX);
    this.holeY = Phaser.Math.Clamp(y, margin, maxY);

    // Push away from obstacles
    for (const obs of this.obstacles) {
      const ox = obs.x * scale;
      const oy = obs.y * scale;
      const ow = obs.width * scale;
      const oh = obs.height * scale;

      // Simple AABB check - push hole out of obstacle rect
      const closestX = Phaser.Math.Clamp(this.holeX, ox, ox + ow);
      const closestY = Phaser.Math.Clamp(this.holeY, oy, oy + oh);
      const distX = this.holeX - closestX;
      const distY = this.holeY - closestY;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < this.holeRadius && dist > 0) {
        const push = this.holeRadius - dist;
        this.holeX += (distX / dist) * push;
        this.holeY += (distY / dist) * push;
      }
    }

    this.drawHole();
  }

  private drawHole() {
    const r = this.holeRadius;

    // Shadow (slightly offset)
    this.holeShadow.clear();
    this.holeShadow.fillStyle(0x000000, 0.1);
    this.holeShadow.fillCircle(this.holeX + 2, this.holeY + 2, r + 4);

    // Main hole
    this.holeGraphics.clear();
    // Outer ring
    this.holeGraphics.fillStyle(HOLE_OUTLINE, 1);
    this.holeGraphics.fillCircle(this.holeX, this.holeY, r + 3);
    // Inner hole (dark)
    this.holeGraphics.fillStyle(HOLE_COLOR, 1);
    this.holeGraphics.fillCircle(this.holeX, this.holeY, r);
    // Inner gradient effect
    this.holeGraphics.fillStyle(0x0f0f23, 0.6);
    this.holeGraphics.fillCircle(this.holeX - r * 0.15, this.holeY - r * 0.15, r * 0.6);
  }

  // ─── Objects ───────────────────────────────────────────

  private drawObject(g: Phaser.GameObjects.Graphics, def: ObjDef, scale: number) {
    const cx = def.x * scale;
    const cy = def.y * scale;
    const s = def.size * scale;

    // Shadow
    g.fillStyle(0x000000, 0.08);
    if (def.shape === 'circle') {
      g.fillCircle(cx + 1.5 * scale, cy + 1.5 * scale, s);
    } else if (def.shape === 'rect') {
      g.fillRoundedRect(cx - s + 1.5 * scale, cy - s + 1.5 * scale, s * 2, s * 2, 3 * scale);
    } else {
      // triangle shadow
      g.fillTriangle(
        cx + 1.5 * scale, cy - s + 1.5 * scale,
        cx - s + 1.5 * scale, cy + s + 1.5 * scale,
        cx + s + 1.5 * scale, cy + s + 1.5 * scale,
      );
    }

    // Main shape
    g.fillStyle(def.color, 1);
    if (def.shape === 'circle') {
      g.fillCircle(cx, cy, s);
      // Highlight
      g.fillStyle(0xffffff, 0.25);
      g.fillCircle(cx - s * 0.3, cy - s * 0.3, s * 0.35);
    } else if (def.shape === 'rect') {
      g.fillRoundedRect(cx - s, cy - s, s * 2, s * 2, 3 * scale);
      // Highlight
      g.fillStyle(0xffffff, 0.2);
      g.fillRoundedRect(cx - s + 2 * scale, cy - s + 2 * scale, s * 0.6, s * 0.6, 2 * scale);
    } else {
      // triangle
      g.fillTriangle(cx, cy - s, cx - s, cy + s, cx + s, cy + s);
      // Highlight
      g.fillStyle(0xffffff, 0.2);
      g.fillTriangle(cx, cy - s * 0.5, cx - s * 0.3, cy + s * 0.2, cx + s * 0.3, cy + s * 0.2);
    }
  }

  private swallowObject(obj: LiveObject) {
    obj.alive = false;
    this.swallowed++;

    // Shrink animation into hole
    this.tweens.add({
      targets: obj.graphics,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        obj.graphics.destroy();
      },
    });

    // Grow the hole slightly
    this.holeRadius += HOLE_GROW_PER_OBJ * this.dpr;
    this.drawHole();

    // Score pulse
    this.score += 100;
    this.emitState();

    // Check win
    if (this.swallowed >= this.totalObjects) {
      this.onAllSwallowed();
    }
  }

  // ─── Game End ──────────────────────────────────────────

  private onAllSwallowed() {
    this.phase = 'celebrating';
    const timeRemainingSec = Math.max(0, (this.timeLimitMs - this.elapsedMs) / 1000);
    this.score = calculateScore(this.swallowed, this.totalObjects, timeRemainingSec);
    this.emitState();

    // Celebrate
    this.celebrateWin();

    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        swallowed: this.swallowed,
        totalObjects: this.totalObjects,
        stage: this.config.stage ?? 1,
      });
    });
  }

  private onTimeUp() {
    this.phase = 'gameover';
    this.score = calculateScore(this.swallowed, this.totalObjects, 0);
    this.emitState();

    // Show time up text
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.4);
    overlay.setDepth(100);

    const text = this.add.text(w / 2, h / 2, "Time's Up!", {
      fontSize: `${28 * scale}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#EF4444',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    text.setDepth(101);

    this.time.delayedCall(1200, () => {
      this.game.events.emit('game-over', {
        score: this.score,
        swallowed: this.swallowed,
        totalObjects: this.totalObjects,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Juice Effects ────────────────────────────────────

  private celebrateWin() {
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;

    // Hole pulse
    this.tweens.add({
      targets: { r: this.holeRadius },
      r: this.holeRadius * 1.5,
      duration: 300,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onUpdate: (_tween: Phaser.Tweens.Tween, target: { r: number }) => {
        this.holeRadius = target.r;
        this.drawHole();
      },
    });

    // Confetti
    for (let i = 0; i < 30; i++) {
      const colors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (4 + Math.random() * 6) * scale;
      const p = this.add.rectangle(
        this.holeX + (Math.random() - 0.5) * 40 * scale,
        this.holeY,
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
  }

  // ─── Public Methods ────────────────────────────────────

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', {
      score: this.score,
      swallowed: this.swallowed,
      totalObjects: this.totalObjects,
    });
  }
}
