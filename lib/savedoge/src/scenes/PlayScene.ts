import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  GRACE_MS,
  HAZARD_DURATION_MS,
  type GameConfig,
  type StageConfig,
  type HazardConfig,
} from '../types';
import { getStageConfig } from '../logic/stage';

// ─── Drawing constants ───────────────────────────────────
const LINE_WIDTH = 6;
const LINE_COLOR = 0x4a3728;
const LINE_ALPHA = 1;
const MIN_SEGMENT = 4;

// ─── Doge constants ──────────────────────────────────────
const DOGE_RADIUS = 20;
const DOGE_COLOR = 0xf5a623;
const DOGE_EYE_COLOR = 0x333333;

// ─── Hazard colors ───────────────────────────────────────
const HAZARD_COLORS: Record<string, number> = {
  lava: 0xef4444,
  rain: 0x3b82f6,
  spikes: 0x6b7280,
};

type Phase = 'drawing' | 'simulating' | 'result';

export class PlayScene extends Phaser.Scene {
  private config!: GameConfig;
  private stageConfig!: StageConfig;
  private dpr = 1;

  // Drawing state
  private phase: Phase = 'drawing';
  private drawPoints: Phaser.Math.Vector2[] = [];
  private drawGraphics!: Phaser.GameObjects.Graphics;
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private isDrawing = false;
  private inkUsed = 0;
  private maxInk = 600;
  private lines: Phaser.Math.Vector2[][] = [];

  // Game objects
  private dogeSprite!: Phaser.GameObjects.Container;
  private dogeX = 0;
  private dogeY = 0;
  private dogeHit = false;
  private platformGraphics!: Phaser.GameObjects.Graphics;

  // Hazard objects
  private hazardObjects: Phaser.GameObjects.Graphics[] = [];
  private hazardTimer?: Phaser.Time.TimerEvent;
  private graceTimer?: Phaser.Time.TimerEvent;

  // Score
  private score = 0;

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
    this.phase = 'drawing';
    this.drawPoints = [];
    this.isDrawing = false;
    this.inkUsed = 0;
    this.maxInk = this.stageConfig.ink;
    this.lines = [];
    this.dogeHit = false;
    this.score = 0;
    this.hazardObjects = [];

    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xe8f4fd, 0xe8f4fd, 0xfdf2e9, 0xfdf2e9, 1);
    bg.fillRect(0, 0, w, h);

    // Ground line
    const groundY = (this.stageConfig.platformY ?? 0.82) * h;
    this.platformGraphics = this.add.graphics();
    this.platformGraphics.fillStyle(0x8b7355, 1);
    this.platformGraphics.fillRect(0, groundY, w, h - groundY);
    this.platformGraphics.fillStyle(0x6d9b3a, 1);
    this.platformGraphics.fillRect(0, groundY, w, 4 * s);

    // Draw the doge
    this.dogeX = this.stageConfig.dogeX * w;
    this.dogeY = this.stageConfig.dogeY * h;
    this.dogeSprite = this.createDoge(this.dogeX, this.dogeY);

    // Drawing layer
    this.drawGraphics = this.add.graphics();
    this.previewGraphics = this.add.graphics();

    // Input handlers
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'drawing') return;
      this.isDrawing = true;
      this.drawPoints = [new Phaser.Math.Vector2(pointer.x, pointer.y)];
      this.previewGraphics.clear();
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDrawing || this.phase !== 'drawing') return;
      const last = this.drawPoints[this.drawPoints.length - 1];
      const dx = pointer.x - last.x;
      const dy = pointer.y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MIN_SEGMENT * this.dpr) return;

      // Check ink
      if (this.inkUsed + dist / this.dpr > this.maxInk) {
        this.finishLine();
        return;
      }

      this.inkUsed += dist / this.dpr;
      this.drawPoints.push(new Phaser.Math.Vector2(pointer.x, pointer.y));

      // Draw preview
      this.previewGraphics.clear();
      this.previewGraphics.lineStyle(LINE_WIDTH * this.dpr, LINE_COLOR, LINE_ALPHA);
      this.previewGraphics.beginPath();
      this.previewGraphics.moveTo(this.drawPoints[0].x, this.drawPoints[0].y);
      for (let i = 1; i < this.drawPoints.length; i++) {
        this.previewGraphics.lineTo(this.drawPoints[i].x, this.drawPoints[i].y);
      }
      this.previewGraphics.strokePath();

      this.emitInk();
    });

    this.input.on('pointerup', () => {
      if (!this.isDrawing || this.phase !== 'drawing') return;
      this.finishLine();
    });

    // Instruction text
    const instructionText = this.add.text(w / 2, 30 * s, 'Draw lines to protect the Doge!', {
      fontSize: `${14 * s}px`,
      color: '#6B7280',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    instructionText.setDepth(10);

    // GO button
    this.createGoButton();

    this.emitInk();
    this.emitScore();
  }

  // ─── Doge Drawing ──────────────────────────────────────

  private createDoge(x: number, y: number): Phaser.GameObjects.Container {
    const s = this.dpr;
    const container = this.add.container(x, y);
    const r = DOGE_RADIUS * s;

    // Body
    const body = this.add.graphics();
    body.fillStyle(DOGE_COLOR, 1);
    body.fillCircle(0, 0, r);
    container.add(body);

    // Ears
    const earL = this.add.graphics();
    earL.fillStyle(0xd4892a, 1);
    earL.fillTriangle(-r * 0.7, -r * 0.3, -r * 0.4, -r * 1.1, -r * 0.1, -r * 0.3);
    container.add(earL);

    const earR = this.add.graphics();
    earR.fillStyle(0xd4892a, 1);
    earR.fillTriangle(r * 0.7, -r * 0.3, r * 0.4, -r * 1.1, r * 0.1, -r * 0.3);
    container.add(earR);

    // Eyes
    const eyeOffset = r * 0.3;
    const eyeR = r * 0.15;
    const eyeL = this.add.graphics();
    eyeL.fillStyle(DOGE_EYE_COLOR, 1);
    eyeL.fillCircle(-eyeOffset, -r * 0.15, eyeR);
    container.add(eyeL);

    const eyeRG = this.add.graphics();
    eyeRG.fillStyle(DOGE_EYE_COLOR, 1);
    eyeRG.fillCircle(eyeOffset, -r * 0.15, eyeR);
    container.add(eyeRG);

    // Nose
    const nose = this.add.graphics();
    nose.fillStyle(0x333333, 1);
    nose.fillCircle(0, r * 0.15, r * 0.12);
    container.add(nose);

    // Mouth (smile)
    const mouth = this.add.graphics();
    mouth.lineStyle(2 * s, 0x333333, 1);
    mouth.beginPath();
    mouth.arc(0, r * 0.15, r * 0.25, 0.2, Math.PI - 0.2, false);
    mouth.strokePath();
    container.add(mouth);

    container.setDepth(5);
    return container;
  }

  // ─── GO Button ─────────────────────────────────────────

  private goButton?: Phaser.GameObjects.Container;

  private createGoButton() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    const container = this.add.container(w / 2, h - 40 * s);
    container.setDepth(20);

    const btnW = 120 * s;
    const btnH = 40 * s;
    const bg = this.add.graphics();
    bg.fillStyle(0x22c55e, 1);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12 * s);
    container.add(bg);

    const label = this.add.text(0, 0, '▶ GO!', {
      fontSize: `${18 * s}px`,
      color: '#FFFFFF',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(label);

    const hitArea = this.add.rectangle(0, 0, btnW, btnH).setInteractive().setAlpha(0.001);
    hitArea.on('pointerdown', () => this.startSimulation());
    container.add(hitArea);

    this.goButton = container;
  }

  // ─── Line Management ───────────────────────────────────

  private finishLine() {
    this.isDrawing = false;
    if (this.drawPoints.length < 2) return;

    this.lines.push([...this.drawPoints]);

    // Commit line to permanent graphics
    this.drawGraphics.lineStyle(LINE_WIDTH * this.dpr, LINE_COLOR, LINE_ALPHA);
    this.drawGraphics.beginPath();
    this.drawGraphics.moveTo(this.drawPoints[0].x, this.drawPoints[0].y);
    for (let i = 1; i < this.drawPoints.length; i++) {
      this.drawGraphics.lineTo(this.drawPoints[i].x, this.drawPoints[i].y);
    }
    this.drawGraphics.strokePath();

    // Draw end caps for a rounded look
    const capR = (LINE_WIDTH * this.dpr) / 2;
    this.drawGraphics.fillStyle(LINE_COLOR, LINE_ALPHA);
    this.drawGraphics.fillCircle(this.drawPoints[0].x, this.drawPoints[0].y, capR);
    this.drawGraphics.fillCircle(
      this.drawPoints[this.drawPoints.length - 1].x,
      this.drawPoints[this.drawPoints.length - 1].y,
      capR,
    );

    this.previewGraphics.clear();
    this.drawPoints = [];
    this.emitInk();
  }

  // ─── Simulation (Hazard Phase) ─────────────────────────

  private startSimulation() {
    if (this.phase !== 'drawing') return;
    if (this.isDrawing) this.finishLine();

    this.phase = 'simulating';

    // Remove GO button
    if (this.goButton) {
      this.goButton.destroy();
      this.goButton = undefined;
    }

    // Build line segments for collision
    const lineSegments = this.buildLineSegments();

    // Start grace period, then spawn hazards
    const statusText = this.add.text(
      DEFAULT_WIDTH * this.dpr / 2,
      50 * this.dpr,
      'Get ready...',
      {
        fontSize: `${16 * this.dpr}px`,
        color: '#EF4444',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5).setDepth(15);

    this.graceTimer = this.time.delayedCall(GRACE_MS, () => {
      statusText.setText('Incoming!');
      this.spawnHazards(lineSegments);

      // After hazard phase, check result
      this.hazardTimer = this.time.delayedCall(HAZARD_DURATION_MS, () => {
        statusText.destroy();
        this.endSimulation();
      });
    });
  }

  private buildLineSegments(): { x1: number; y1: number; x2: number; y2: number }[] {
    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const line of this.lines) {
      for (let i = 0; i < line.length - 1; i++) {
        segments.push({
          x1: line[i].x,
          y1: line[i].y,
          x2: line[i + 1].x,
          y2: line[i + 1].y,
        });
      }
    }
    return segments;
  }

  private spawnHazards(lineSegments: { x1: number; y1: number; x2: number; y2: number }[]) {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    for (const hazard of this.stageConfig.hazards) {
      this.spawnHazardWave(hazard, lineSegments, w, h, s);
    }
  }

  private spawnHazardWave(
    hazard: HazardConfig,
    lineSegments: { x1: number; y1: number; x2: number; y2: number }[],
    w: number,
    h: number,
    s: number,
  ) {
    const color = HAZARD_COLORS[hazard.type] ?? 0xef4444;
    const groundY = (this.stageConfig.platformY ?? 0.82) * h;

    for (let i = 0; i < hazard.count; i++) {
      const delay = (i / hazard.count) * HAZARD_DURATION_MS * 0.8;

      this.time.delayedCall(delay, () => {
        if (this.phase === 'result') return;

        const size = (3 + Math.random() * 4) * s;
        const g = this.add.graphics();
        g.fillStyle(color, 0.9);

        let startX: number;
        let startY: number;
        let vx: number;
        let vy: number;

        if (hazard.direction === 'top') {
          startX = Math.random() * w;
          startY = -size;
          vx = (Math.random() - 0.5) * 40 * s;
          vy = hazard.speed * s;
        } else if (hazard.direction === 'left') {
          startX = -size;
          startY = Math.random() * groundY * 0.8;
          vx = hazard.speed * s;
          vy = (Math.random() - 0.5) * 40 * s + 50 * s;
        } else {
          startX = w + size;
          startY = Math.random() * groundY * 0.8;
          vx = -hazard.speed * s;
          vy = (Math.random() - 0.5) * 40 * s + 50 * s;
        }

        // Draw shape based on type
        if (hazard.type === 'rain') {
          g.fillRoundedRect(-size / 2, -size, size, size * 2, size / 3);
        } else if (hazard.type === 'lava') {
          g.fillCircle(0, 0, size);
          // Add glow
          g.fillStyle(0xfbbf24, 0.3);
          g.fillCircle(0, 0, size * 1.5);
        } else {
          // spikes - triangle
          g.fillTriangle(-size, size, 0, -size, size, size);
        }

        g.setPosition(startX, startY);
        g.setDepth(8);
        this.hazardObjects.push(g);

        // Animate with gravity
        const gravity = hazard.direction === 'top' ? 80 * s : 30 * s;
        const startTime = this.time.now;
        const maxLifetime = 5000;

        const updateEvent = this.time.addEvent({
          delay: 16,
          loop: true,
          callback: () => {
            if (this.phase === 'result' || !g.active) {
              updateEvent.destroy();
              return;
            }

            const elapsed = (this.time.now - startTime) / 1000;
            if (elapsed * 1000 > maxLifetime) {
              g.destroy();
              updateEvent.destroy();
              return;
            }

            const newX = startX + vx * elapsed;
            const newY = startY + vy * elapsed + 0.5 * gravity * elapsed * elapsed;
            g.setPosition(newX, newY);

            // Check collision with lines
            if (this.checkLineCollision(newX, newY, size, lineSegments)) {
              // Particle hit line — bounce or stop
              this.createHitEffect(newX, newY, color, s);
              g.destroy();
              updateEvent.destroy();
              return;
            }

            // Check collision with ground
            if (newY > groundY) {
              g.destroy();
              updateEvent.destroy();
              return;
            }

            // Check collision with doge
            if (!this.dogeHit && this.checkDogeCollision(newX, newY, size)) {
              this.onDogeHit();
              g.destroy();
              updateEvent.destroy();
            }
          },
        });
      });
    }
  }

  private checkLineCollision(
    x: number,
    y: number,
    size: number,
    segments: { x1: number; y1: number; x2: number; y2: number }[],
  ): boolean {
    const threshold = (LINE_WIDTH * this.dpr) / 2 + size;
    for (const seg of segments) {
      const dist = this.pointToSegmentDist(x, y, seg.x1, seg.y1, seg.x2, seg.y2);
      if (dist < threshold) return true;
    }
    return false;
  }

  private pointToSegmentDist(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const nearX = x1 + t * dx;
    const nearY = y1 + t * dy;
    return Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);
  }

  private checkDogeCollision(x: number, y: number, size: number): boolean {
    const dr = DOGE_RADIUS * this.dpr;
    const dx = x - this.dogeX;
    const dy = y - this.dogeY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < dr + size;
  }

  private createHitEffect(x: number, y: number, color: number, s: number) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.circle(x, y, 2 * s, color, 0.8);
      p.setDepth(12);
      const angle = Math.random() * Math.PI * 2;
      const dist = (10 + Math.random() * 15) * s;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 300,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ─── Doge Hit ──────────────────────────────────────────

  private onDogeHit() {
    this.dogeHit = true;

    // Shake doge
    this.tweens.add({
      targets: this.dogeSprite,
      x: this.dogeX + 5 * this.dpr,
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.dogeSprite.x = this.dogeX;
      },
    });

    // Change doge expression (turn red-ish)
    const sadOverlay = this.add.graphics();
    sadOverlay.fillStyle(0xef4444, 0.3);
    sadOverlay.fillCircle(0, 0, DOGE_RADIUS * this.dpr);
    this.dogeSprite.add(sadOverlay);
  }

  // ─── End Simulation ────────────────────────────────────

  private endSimulation() {
    this.phase = 'result';

    // Destroy remaining hazards
    for (const h of this.hazardObjects) {
      if (h.active) h.destroy();
    }
    this.hazardObjects = [];

    if (!this.dogeHit) {
      // Doge survived!
      const inkBonus = Math.floor((1 - this.inkUsed / this.maxInk) * 500);
      this.score = 1000 + inkBonus;
      this.emitScore();
      this.celebrateWin();
    } else {
      // Doge was hit — game over
      this.score = 0;
      this.emitScore();
      this.time.delayedCall(500, () => {
        this.game.events.emit('game-over', {
          score: this.score,
          stage: this.config.stage ?? 1,
          inkUsed: this.inkUsed,
        });
      });
    }
  }

  // ─── Win Celebration ───────────────────────────────────

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Bounce doge
    this.tweens.add({
      targets: this.dogeSprite,
      y: this.dogeY - 30 * s,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });

    // Confetti
    for (let i = 0; i < 25; i++) {
      const colors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (4 + Math.random() * 6) * s;
      const p = this.add.rectangle(
        w / 2 + (Math.random() - 0.5) * 60 * s,
        h * 0.4,
        size,
        size * 1.5,
        color,
      );
      p.setDepth(300);
      p.setRotation(Math.random() * Math.PI);

      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * w * 0.8,
        y: p.y + (Math.random() - 0.5) * h * 0.5,
        rotation: p.rotation + (Math.random() - 0.5) * 4,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    // Emit stage clear
    this.time.delayedCall(1500, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        stage: this.config.stage ?? 1,
        inkUsed: this.inkUsed,
      });
    });
  }

  // ─── Public Methods ────────────────────────────────────

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  public undo() {
    if (this.phase !== 'drawing' || this.lines.length === 0) return;
    const removed = this.lines.pop()!;

    // Recalculate ink
    let removedInk = 0;
    for (let i = 0; i < removed.length - 1; i++) {
      const dx = removed[i + 1].x - removed[i].x;
      const dy = removed[i + 1].y - removed[i].y;
      removedInk += Math.sqrt(dx * dx + dy * dy) / this.dpr;
    }
    this.inkUsed = Math.max(0, this.inkUsed - removedInk);

    // Redraw all lines
    this.drawGraphics.clear();
    for (const line of this.lines) {
      this.drawGraphics.lineStyle(LINE_WIDTH * this.dpr, LINE_COLOR, LINE_ALPHA);
      this.drawGraphics.beginPath();
      this.drawGraphics.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) {
        this.drawGraphics.lineTo(line[i].x, line[i].y);
      }
      this.drawGraphics.strokePath();

      const capR = (LINE_WIDTH * this.dpr) / 2;
      this.drawGraphics.fillStyle(LINE_COLOR, LINE_ALPHA);
      this.drawGraphics.fillCircle(line[0].x, line[0].y, capR);
      this.drawGraphics.fillCircle(line[line.length - 1].x, line[line.length - 1].y, capR);
    }

    this.emitInk();
  }

  // ─── Events ────────────────────────────────────────────

  private emitInk() {
    this.game.events.emit('ink-update', {
      ink: Math.max(0, this.maxInk - this.inkUsed),
      maxInk: this.maxInk,
    });
  }

  private emitScore() {
    this.game.events.emit('score-update', { score: this.score });
  }
}
