/**
 * PlayScene for Defend King (주공을 지켜라)
 *
 * Angry Birds-style physics destruction puzzle.
 * Slingshot on left, structures + enemies on right.
 * Launch projectiles to destroy all enemies.
 *
 * Events emitted on game.events:
 *   'score-update' → { score, ammoLeft, enemiesLeft }
 *   'stage-clear'  → { score, stage }
 *   'game-over'    → { score, stage }
 */

import Phaser from 'phaser';
import { GamePhase, COLORS, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../types';
import type { GameConfig, StageConfig, BlockData } from '../types';
import { levels } from '../logic/levels';

const CAT_DEFAULT = 0x0001;
const CAT_PROJECTILE = 0x0002;
const CAT_ENEMY = 0x0004;
const CAT_BLOCK = 0x0008;
const CAT_GROUND = 0x0010;

const SETTLE_SPEED = 0.3;
const SETTLE_FRAMES = 60;
const MAX_DRAG_DIST = 120;
const LAUNCH_POWER = 0.055;
const SLINGSHOT_INTERACTION_RADIUS = 60;
const SETTLE_Y_THRESHOLD = 50;
const OUT_OF_BOUNDS_MARGIN = 50;
const AMMO_BONUS_POINTS = 50;
const ENEMY_KILL_POINTS = 100;
const BLOCK_DESTROY_POINTS = 10;
const STARTUP_GRACE_MS = 1500;
const ICE_DESTRUCTION_THRESHOLD = 2;
const WOOD_DESTRUCTION_THRESHOLD = 4;
const STONE_DESTRUCTION_THRESHOLD = 7;
const ENEMY_PROJECTILE_THRESHOLD = 2;
const ENEMY_IMPACT_THRESHOLD = 8;

interface EnemyData {
  body: MatterJS.BodyType;
  graphics: Phaser.GameObjects.Container;
  alive: boolean;
}

interface BlockInfo {
  body: MatterJS.BodyType;
  graphics: Phaser.GameObjects.Rectangle;
  type: 'wood' | 'stone' | 'ice';
  alive: boolean;
}

export class PlayScene extends Phaser.Scene {
  private gameConfig?: GameConfig;
  private stageConfig?: StageConfig;
  private phase: GamePhase = GamePhase.READY;
  private dpr: number = 1;

  private areaW: number = 0;
  private areaH: number = 0;
  private groundY: number = 0;

  private slingshotX: number = 0;
  private slingshotY: number = 0;
  private slingshotGraphics!: Phaser.GameObjects.Graphics;
  private bandGraphics!: Phaser.GameObjects.Graphics;
  private trajectoryDots: Phaser.GameObjects.Arc[] = [];

  private isAiming: boolean = false;
  private aimCurrentX: number = 0;
  private aimCurrentY: number = 0;

  private currentStage: number = 1;
  private score: number = 0;
  private ammoLeft: number = 0;
  private enemies: EnemyData[] = [];
  private blockInfos: BlockInfo[] = [];
  private projectile: { body: MatterJS.BodyType; graphics: Phaser.GameObjects.Arc } | null = null;
  private heroGraphics!: Phaser.GameObjects.Container;

  private settleCounter: number = 0;
  private createdAt: number = 0;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { gameConfig?: GameConfig; stageConfig?: StageConfig }): void {
    this.gameConfig = data?.gameConfig ?? (this.game as any).__defendkingConfig;
    this.stageConfig = data?.stageConfig ?? (this.game as any).__stageConfig;
  }

  create(): void {
    this.dpr = (this.game as any).__dpr || 1;
    this.areaW = this.scale.width;
    this.areaH = this.scale.height;
    this.groundY = this.areaH * 0.94;

    this.currentStage = this.stageConfig?.stage ?? 1;
    this.score = 0;
    this.phase = GamePhase.READY;
    this.enemies = [];
    this.blockInfos = [];
    this.projectile = null;
    this.settleCounter = 0;
    this.trajectoryDots = [];
    this.createdAt = Date.now();

    this.slingshotX = this.areaW * 0.15;
    this.slingshotY = this.groundY - 40 * this.dpr;

    this.drawBackground();
    this.drawGround();
    this.drawSlingshot();
    this.loadLevel(this.currentStage);
    this.setupInput();
    this.setupCollisions();
    this.emitScoreUpdate();
  }

  // ==================== DRAWING ====================

  private drawBackground(): void {
    const skyTop = this.add.rectangle(this.areaW / 2, 0, this.areaW, this.areaH * 0.5, 0x87ceeb);
    skyTop.setOrigin(0.5, 0);
    const skyBottom = this.add.rectangle(
      this.areaW / 2, this.areaH * 0.5, this.areaW, this.areaH * 0.5, 0xb0e0e6,
    );
    skyBottom.setOrigin(0.5, 0);

    const cloudColor = 0xffffff;
    const cloudAlpha = 0.6;
    for (const cx of [this.areaW * 0.2, this.areaW * 0.6, this.areaW * 0.85]) {
      const cy = 30 * this.dpr + Math.random() * 40 * this.dpr;
      const r = 15 * this.dpr;
      this.add.circle(cx, cy, r, cloudColor, cloudAlpha);
      this.add.circle(cx - r * 0.8, cy + r * 0.3, r * 0.7, cloudColor, cloudAlpha);
      this.add.circle(cx + r * 0.9, cy + r * 0.2, r * 0.8, cloudColor, cloudAlpha);
    }
  }

  private drawGround(): void {
    const groundH = this.areaH - this.groundY;
    this.add.rectangle(this.areaW / 2, this.groundY + groundH / 2, this.areaW, groundH, COLORS.ground);
    this.add.rectangle(this.areaW / 2, this.groundY + 2 * this.dpr, this.areaW, 4 * this.dpr, 0x2ecc71);
    this.add.rectangle(
      this.areaW / 2, this.groundY + groundH * 0.6, this.areaW, groundH * 0.4, COLORS.groundDark,
    );

    this.matter.add.rectangle(this.areaW / 2, this.groundY + groundH / 2, this.areaW, groundH, {
      isStatic: true,
      label: 'ground',
      collisionFilter: {
        category: CAT_GROUND,
        mask: CAT_PROJECTILE | CAT_ENEMY | CAT_BLOCK | CAT_DEFAULT,
      },
      friction: 0.8,
      restitution: 0.2,
    });

    this.matter.add.rectangle(-10, this.areaH / 2, 20, this.areaH * 2, {
      isStatic: true,
      label: 'wall-left',
    });
    this.matter.add.rectangle(this.areaW + 10, this.areaH / 2, 20, this.areaH * 2, {
      isStatic: true,
      label: 'wall-right',
    });
  }

  private drawSlingshot(): void {
    this.slingshotGraphics = this.add.graphics();
    this.slingshotGraphics.setDepth(5);
    const g = this.slingshotGraphics;
    const sx = this.slingshotX;
    const sy = this.slingshotY;
    const s = this.dpr;

    g.lineStyle(6 * s, COLORS.slingshot);
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx - 12 * s, sy - 30 * s);
    g.strokePath();

    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx + 12 * s, sy - 30 * s);
    g.strokePath();

    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx, sy + 25 * s);
    g.strokePath();

    g.lineStyle(8 * s, COLORS.slingshot);
    g.beginPath();
    g.moveTo(sx - 8 * s, sy + 25 * s);
    g.lineTo(sx + 8 * s, sy + 25 * s);
    g.strokePath();

    this.bandGraphics = this.add.graphics();
    this.bandGraphics.setDepth(10);
  }

  // ==================== LEVEL LOADING ====================

  private loadLevel(stage: number): void {
    const levelIndex = Math.min(stage - 1, levels.length - 1);
    const level = levels[levelIndex];
    this.ammoLeft = level.ammo;

    const playH = this.groundY;

    const heroX = level.hero.x * this.areaW;
    const heroY = level.hero.y * playH;
    this.drawHero(heroX, heroY);

    for (const block of level.blocks) {
      this.createBlock(block, playH);
    }

    for (const enemyPos of level.enemies) {
      this.createEnemy(enemyPos.x * this.areaW, enemyPos.y * playH);
    }
  }

  private drawHero(x: number, y: number): void {
    const r = 12 * this.dpr;
    this.heroGraphics = this.add.container(x, y);
    this.heroGraphics.setDepth(20);

    const body = this.add.circle(0, 0, r, COLORS.hero);
    body.setStrokeStyle(2 * this.dpr, 0x2980b9);
    this.heroGraphics.add(body);

    const eyeR = 2 * this.dpr;
    const eyeY = -2 * this.dpr;
    this.heroGraphics.add(this.add.circle(-4 * this.dpr, eyeY, eyeR, 0xffffff));
    this.heroGraphics.add(this.add.circle(4 * this.dpr, eyeY, eyeR, 0xffffff));
    this.heroGraphics.add(this.add.circle(-4 * this.dpr, eyeY, eyeR * 0.5, 0x000000));
    this.heroGraphics.add(this.add.circle(4 * this.dpr, eyeY, eyeR * 0.5, 0x000000));

    const crown = this.add.graphics();
    const crownColor = 0xf1c40f;
    crown.fillStyle(crownColor, 1);
    const cw = 14 * this.dpr;
    const ch = 8 * this.dpr;
    const cy = -r - ch * 0.5;
    crown.fillRect(-cw / 2, cy, cw, ch);
    crown.fillTriangle(
      -cw / 2, cy,
      -cw / 2 + 3 * this.dpr, cy - 5 * this.dpr,
      -cw / 2 + 6 * this.dpr, cy,
    );
    crown.fillTriangle(-2 * this.dpr, cy, 0, cy - 6 * this.dpr, 2 * this.dpr, cy);
    crown.fillTriangle(
      cw / 2 - 6 * this.dpr, cy,
      cw / 2 - 3 * this.dpr, cy - 5 * this.dpr,
      cw / 2, cy,
    );
    this.heroGraphics.add(crown);

    const smile = this.add.graphics();
    smile.lineStyle(1.5 * this.dpr, 0x000000);
    smile.beginPath();
    smile.arc(0, 2 * this.dpr, 4 * this.dpr, 0.2, Math.PI - 0.2, false);
    smile.strokePath();
    this.heroGraphics.add(smile);
  }

  private createBlock(blockData: BlockData, playH: number): void {
    const x = blockData.x * this.areaW;
    const y = blockData.y * playH;
    const w = blockData.width * this.areaW;
    const h = blockData.height * playH;

    let color: number;
    let density: number;
    let friction: number;
    let restitution: number;

    switch (blockData.type) {
      case 'stone':
        color = COLORS.stone;
        density = 0.008;
        friction = 0.9;
        restitution = 0.1;
        break;
      case 'ice':
        color = COLORS.ice;
        density = 0.002;
        friction = 0.1;
        restitution = 0.4;
        break;
      case 'wood':
      default:
        color = COLORS.wood;
        density = 0.004;
        friction = 0.6;
        restitution = 0.2;
        break;
    }

    const rect = this.add.rectangle(x, y, w, h, color);
    rect.setStrokeStyle(1 * this.dpr, 0x000000, 0.2);
    rect.setDepth(3);

    const matterBody = this.matter.add.rectangle(x, y, w, h, {
      label: 'block',
      density,
      friction,
      restitution,
      collisionFilter: {
        category: CAT_BLOCK,
        mask: CAT_PROJECTILE | CAT_ENEMY | CAT_BLOCK | CAT_GROUND | CAT_DEFAULT,
      },
    });

    this.blockInfos.push({ body: matterBody, graphics: rect, type: blockData.type, alive: true });
  }

  private createEnemy(x: number, y: number): void {
    const r = 10 * this.dpr;
    const container = this.add.container(x, y);
    container.setDepth(15);

    const circle = this.add.circle(0, 0, r, COLORS.enemy);
    circle.setStrokeStyle(2 * this.dpr, 0xc0392b);
    container.add(circle);

    const eyeR = 2.5 * this.dpr;
    const eyeY = -2 * this.dpr;
    container.add(this.add.circle(-3.5 * this.dpr, eyeY, eyeR, 0xffffff));
    container.add(this.add.circle(3.5 * this.dpr, eyeY, eyeR, 0xffffff));
    container.add(this.add.circle(-3.5 * this.dpr, eyeY, eyeR * 0.5, 0x000000));
    container.add(this.add.circle(3.5 * this.dpr, eyeY, eyeR * 0.5, 0x000000));

    const brows = this.add.graphics();
    brows.lineStyle(1.5 * this.dpr, 0x000000);
    brows.beginPath();
    brows.moveTo(-6 * this.dpr, eyeY - 4 * this.dpr);
    brows.lineTo(-1 * this.dpr, eyeY - 2 * this.dpr);
    brows.strokePath();
    brows.beginPath();
    brows.moveTo(6 * this.dpr, eyeY - 4 * this.dpr);
    brows.lineTo(1 * this.dpr, eyeY - 2 * this.dpr);
    brows.strokePath();
    container.add(brows);

    const matterBody = this.matter.add.circle(x, y, r, {
      label: 'enemy',
      density: 0.003,
      friction: 0.5,
      restitution: 0.3,
      collisionFilter: {
        category: CAT_ENEMY,
        mask: CAT_PROJECTILE | CAT_BLOCK | CAT_ENEMY | CAT_GROUND | CAT_DEFAULT,
      },
    });

    this.enemies.push({ body: matterBody, graphics: container, alive: true });
  }

  // ==================== INPUT ====================

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== GamePhase.READY || this.ammoLeft <= 0) return;

      const dist = Phaser.Math.Distance.Between(
        pointer.x, pointer.y, this.slingshotX, this.slingshotY,
      );
      if (dist < SLINGSHOT_INTERACTION_RADIUS * this.dpr) {
        this.isAiming = true;
        this.phase = GamePhase.AIMING;
        this.aimCurrentX = pointer.x;
        this.aimCurrentY = pointer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming) return;
      this.aimCurrentX = pointer.x;
      this.aimCurrentY = pointer.y;
      this.updateAimVisuals();
    });

    this.input.on('pointerup', () => {
      if (!this.isAiming) return;
      this.isAiming = false;

      const dx = this.slingshotX - this.aimCurrentX;
      const dy = this.slingshotY - this.aimCurrentY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      this.clearAimVisuals();

      if (dist < 10 * this.dpr) {
        this.phase = GamePhase.READY;
        return;
      }

      this.launchProjectile(dx, dy, Math.min(dist, MAX_DRAG_DIST * this.dpr));
    });
  }

  private updateAimVisuals(): void {
    this.clearAimVisuals();

    const dx = this.slingshotX - this.aimCurrentX;
    const dy = this.slingshotY - this.aimCurrentY;
    let dist = Math.sqrt(dx * dx + dy * dy);
    dist = Math.min(dist, MAX_DRAG_DIST * this.dpr);

    const angle = Math.atan2(dy, dx);
    const clampedX = this.slingshotX - Math.cos(angle) * dist;
    const clampedY = this.slingshotY - Math.sin(angle) * dist;

    const s = this.dpr;
    this.bandGraphics.clear();
    this.bandGraphics.lineStyle(3 * s, 0x4a3728);
    this.bandGraphics.beginPath();
    this.bandGraphics.moveTo(this.slingshotX - 12 * s, this.slingshotY - 30 * s);
    this.bandGraphics.lineTo(clampedX, clampedY);
    this.bandGraphics.strokePath();
    this.bandGraphics.beginPath();
    this.bandGraphics.moveTo(this.slingshotX + 12 * s, this.slingshotY - 30 * s);
    this.bandGraphics.lineTo(clampedX, clampedY);
    this.bandGraphics.strokePath();

    const projPreview = this.add.circle(clampedX, clampedY, 7 * s, COLORS.projectile, 0.8);
    projPreview.setDepth(11);
    this.trajectoryDots.push(projPreview);

    const power = dist * LAUNCH_POWER;
    const launchAngle = Math.atan2(dy, dx);
    const launchVx = Math.cos(launchAngle) * power;
    const launchVy = Math.sin(launchAngle) * power;
    const gravityPerStep = 0.05;

    let px = this.slingshotX;
    let py = this.slingshotY - 30 * s;
    let tvx = launchVx;
    let tvy = launchVy;

    for (let i = 0; i < 20; i++) {
      px += tvx * 4;
      py += tvy * 4;
      tvy += gravityPerStep * 4;

      if (py > this.groundY) break;

      const dot = this.add.circle(px, py, 2 * s, COLORS.projectile, Math.max(0, 0.4 - i * 0.02));
      dot.setDepth(11);
      this.trajectoryDots.push(dot);
    }
  }

  private clearAimVisuals(): void {
    this.bandGraphics.clear();
    for (const dot of this.trajectoryDots) {
      dot.destroy();
    }
    this.trajectoryDots = [];
  }

  // ==================== LAUNCH ====================

  private launchProjectile(dx: number, dy: number, dist: number): void {
    this.phase = GamePhase.FLYING;
    this.ammoLeft--;

    const s = this.dpr;
    const r = 7 * s;
    const startX = this.slingshotX;
    const startY = this.slingshotY - 30 * s;

    const gfx = this.add.circle(startX, startY, r, COLORS.projectile);
    gfx.setStrokeStyle(2 * s, 0xe67e22);
    gfx.setDepth(20);

    const body = this.matter.add.circle(startX, startY, r, {
      label: 'projectile',
      density: 0.006,
      friction: 0.5,
      restitution: 0.4,
      collisionFilter: {
        category: CAT_PROJECTILE,
        mask: CAT_BLOCK | CAT_ENEMY | CAT_GROUND | CAT_DEFAULT,
      },
    });

    const power = dist * LAUNCH_POWER;
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;

    this.matter.body.setVelocity(body, { x: vx, y: vy });

    this.projectile = { body, graphics: gfx };
    this.settleCounter = 0;

    this.emitScoreUpdate();
  }

  // ==================== COLLISIONS ====================

  private setupCollisions(): void {
    this.matter.world.on('collisionstart', (_event: Phaser.Physics.Matter.Events.CollisionStartEvent, bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType) => {
      this.handleCollision(bodyA, bodyB);
    });
  }

  private handleCollision(bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType): void {
    const velAx = bodyA.velocity?.x ?? 0;
    const velAy = bodyA.velocity?.y ?? 0;
    const velBx = bodyB.velocity?.x ?? 0;
    const velBy = bodyB.velocity?.y ?? 0;
    const relVel = Math.sqrt((velAx - velBx) ** 2 + (velAy - velBy) ** 2);
    const inGrace = Date.now() - this.createdAt < STARTUP_GRACE_MS;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.body === bodyA || enemy.body === bodyB) {
        const other = enemy.body === bodyA ? bodyB : bodyA;
        if (other.label === 'projectile' && relVel > ENEMY_PROJECTILE_THRESHOLD) {
          this.destroyEnemy(enemy);
        } else if (!inGrace && relVel > ENEMY_IMPACT_THRESHOLD) {
          this.destroyEnemy(enemy);
        }
      }
    }

    for (const block of this.blockInfos) {
      if (!block.alive) continue;
      if (block.body === bodyA || block.body === bodyB) {
        const other = block.body === bodyA ? bodyB : bodyA;
        if (other.label === 'projectile') {
          const threshold =
            block.type === 'ice' ? ICE_DESTRUCTION_THRESHOLD :
            block.type === 'wood' ? WOOD_DESTRUCTION_THRESHOLD :
            STONE_DESTRUCTION_THRESHOLD;
          if (relVel > threshold) {
            this.destroyBlock(block);
          }
        }
      }
    }
  }

  private destroyEnemy(enemy: EnemyData): void {
    if (!enemy.alive) return;
    enemy.alive = false;
    this.score += ENEMY_KILL_POINTS;

    this.tweens.add({
      targets: enemy.graphics,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        enemy.graphics.destroy();
      },
    });

    this.time.delayedCall(50, () => {
      this.matter.world.remove(enemy.body);
    });

    this.spawnParticles(enemy.graphics.x, enemy.graphics.y, COLORS.enemy);
    this.emitScoreUpdate();
  }

  private destroyBlock(block: BlockInfo): void {
    if (!block.alive) return;
    block.alive = false;
    this.score += BLOCK_DESTROY_POINTS;

    this.tweens.add({
      targets: block.graphics,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        block.graphics.destroy();
      },
    });

    this.time.delayedCall(50, () => {
      this.matter.world.remove(block.body);
    });

    this.spawnParticles(block.graphics.x, block.graphics.y, block.graphics.fillColor);
  }

  private spawnParticles(x: number, y: number, color: number): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 40 + Math.random() * 60;
      const size = (2 + Math.random() * 3) * this.dpr;

      const particle = this.add.rectangle(x, y, size, size, color);
      particle.setDepth(50);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  // ==================== UPDATE LOOP ====================

  update(_time: number, _delta: number): void {
    this.syncGraphicsToPhysics();
    this.checkEnemiesOutOfBounds();

    if (this.phase === GamePhase.FLYING && this.projectile) {
      const pos = this.projectile.body.position;
      if (this.isOutOfBounds(pos)) {
        this.startSettling();
        return;
      }

      const speed = Math.sqrt(
        this.projectile.body.velocity.x ** 2 + this.projectile.body.velocity.y ** 2,
      );

      if (speed < SETTLE_SPEED && pos.y >= this.slingshotY - SETTLE_Y_THRESHOLD * this.dpr) {
        this.settleCounter++;
        if (this.settleCounter > SETTLE_FRAMES / 2) {
          this.startSettling();
        }
      } else {
        this.settleCounter = 0;
      }
    }

    if (this.phase === GamePhase.SETTLING) {
      let allSettled = true;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const speed = Math.sqrt(enemy.body.velocity.x ** 2 + enemy.body.velocity.y ** 2);
        if (speed > SETTLE_SPEED) {
          allSettled = false;
          break;
        }
      }
      if (allSettled) {
        for (const block of this.blockInfos) {
          if (!block.alive) continue;
          const speed = Math.sqrt(block.body.velocity.x ** 2 + block.body.velocity.y ** 2);
          if (speed > SETTLE_SPEED) {
            allSettled = false;
            break;
          }
        }
      }

      if (allSettled) {
        this.settleCounter++;
      } else {
        this.settleCounter = 0;
      }

      if (this.settleCounter > SETTLE_FRAMES) {
        this.onSettled();
      }
    }
  }

  private syncGraphicsToPhysics(): void {
    if (this.projectile) {
      this.projectile.graphics.setPosition(
        this.projectile.body.position.x,
        this.projectile.body.position.y,
      );
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.graphics.setPosition(enemy.body.position.x, enemy.body.position.y);
      enemy.graphics.setRotation(enemy.body.angle);
    }

    for (const block of this.blockInfos) {
      if (!block.alive) continue;
      block.graphics.setPosition(block.body.position.x, block.body.position.y);
      block.graphics.setRotation(block.body.angle);
    }
  }

  private isOutOfBounds(pos: { x: number; y: number }): boolean {
    return (
      pos.y > this.groundY + OUT_OF_BOUNDS_MARGIN * this.dpr ||
      pos.x < -OUT_OF_BOUNDS_MARGIN ||
      pos.x > this.areaW + OUT_OF_BOUNDS_MARGIN
    );
  }

  private checkEnemiesOutOfBounds(): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (this.isOutOfBounds(enemy.body.position)) {
        this.destroyEnemy(enemy);
      }
    }
  }

  private startSettling(): void {
    if (this.phase === GamePhase.SETTLING) return;
    this.phase = GamePhase.SETTLING;
    this.settleCounter = 0;

    if (this.projectile) {
      const proj = this.projectile;
      this.tweens.add({
        targets: proj.graphics,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          proj.graphics.destroy();
        },
      });
      this.time.delayedCall(100, () => {
        if (this.projectile && this.projectile.body === proj.body) {
          this.matter.world.remove(proj.body);
          this.projectile = null;
        }
      });
    }
  }

  private onSettled(): void {
    const aliveEnemies = this.enemies.filter(e => e.alive).length;

    if (aliveEnemies === 0) {
      this.score += this.ammoLeft * AMMO_BONUS_POINTS;
      this.phase = GamePhase.LEVEL_CLEAR;
      this.showLevelClear();
      return;
    }

    if (this.ammoLeft <= 0) {
      this.phase = GamePhase.GAME_OVER;
      this.showGameOver();
      return;
    }

    this.phase = GamePhase.READY;
    this.emitScoreUpdate();
  }

  // ==================== UI FEEDBACK ====================

  private showLevelClear(): void {
    const text = this.add.text(this.areaW / 2, this.areaH * 0.4, 'STAGE CLEAR!', {
      fontSize: `${24 * this.dpr}px`,
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
      color: '#f39c12',
      stroke: '#ffffff',
      strokeThickness: 4 * this.dpr,
    }).setOrigin(0.5).setDepth(100);

    const scoreText = this.add.text(this.areaW / 2, this.areaH * 0.48, `Score: ${this.score}`, {
      fontSize: `${16 * this.dpr}px`,
      fontFamily: 'system-ui, sans-serif',
      color: '#2c3e50',
      stroke: '#ffffff',
      strokeThickness: 2 * this.dpr,
    }).setOrigin(0.5).setDepth(100);

    text.setScale(0);
    this.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    scoreText.setAlpha(0);
    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      delay: 300,
      duration: 300,
    });

    this.gameConfig?.onClear?.();
    this.game.events.emit('stage-clear', { score: this.score, stage: this.currentStage });
  }

  private showGameOver(): void {
    const overlay = this.add.rectangle(
      this.areaW / 2, this.areaH / 2, this.areaW, this.areaH, 0x000000, 0,
    );
    overlay.setDepth(90);
    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.4,
      duration: 500,
    });

    const text = this.add.text(this.areaW / 2, this.areaH * 0.4, 'GAME OVER', {
      fontSize: `${24 * this.dpr}px`,
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
      color: '#e74c3c',
      stroke: '#ffffff',
      strokeThickness: 4 * this.dpr,
    }).setOrigin(0.5).setDepth(100);

    const scoreText = this.add.text(this.areaW / 2, this.areaH * 0.48, `Score: ${this.score}`, {
      fontSize: `${16 * this.dpr}px`,
      fontFamily: 'system-ui, sans-serif',
      color: '#2c3e50',
      stroke: '#ffffff',
      strokeThickness: 2 * this.dpr,
    }).setOrigin(0.5).setDepth(100);

    text.setScale(0);
    this.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    scoreText.setAlpha(0);
    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      delay: 300,
      duration: 300,
    });

    this.cameras.main.shake(300, 0.008);

    this.gameConfig?.onGameOver?.();
    this.game.events.emit('game-over', { score: this.score, stage: this.currentStage });
  }

  // ==================== EVENTS ====================

  private emitScoreUpdate(): void {
    const aliveEnemies = this.enemies.filter(e => e.alive).length;
    this.game.events.emit('score-update', {
      score: this.score,
      ammoLeft: this.ammoLeft,
      enemiesLeft: aliveEnemies,
    });
  }

  shutdown(): void {
    this.enemies = [];
    this.blockInfos = [];
    this.trajectoryDots = [];
    this.projectile = null;
  }
}
