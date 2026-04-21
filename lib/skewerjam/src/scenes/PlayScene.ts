import Phaser from 'phaser';
import {
  SKEWER_CAPACITY,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  FOOD_TYPES,
  getStageConfig,
  type BoardState,
  type MoveAction,
  type GameConfig,
  type StageConfig,
} from '../types';
import { createBoard, canMove, executeMove, isWon, isSkewerSolved } from '../logic/board';

const SKEWER_WIDTH = 44;
const SKEWER_HEIGHT = 150;
const ITEM_SIZE = 28;
const ITEM_GAP = 4;
const SKEWER_GAP = 14;
const LIFT_Y = -20;
const STICK_COLOR = 0x8B6914;
const STICK_TIP_COLOR = 0xA67C1A;
const FALLBACK_COLORS = [0xEF4444, 0x3B82F6, 0x22C55E, 0xEAB308, 0xA855F7, 0xF97316, 0xEC4899, 0x06B6D4, 0x92400E, 0x84CC16, 0x6366F1, 0xF43F5E];

type GamePhase = 'idle' | 'moving' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private gameConfig?: GameConfig;
  private stageNum: number = 1;
  private stageConfig!: StageConfig;
  private dpr = 1;

  // Visual
  private skewerContainers: Phaser.GameObjects.Container[] = [];
  private selectedSkewer: number | null = null;
  private phase: GamePhase = 'idle';
  private moveHistory: { skewers: number[][]; from: number; to: number; score: number }[] = [];
  private score = 0;
  private moves = 0;
  private solvedSkewers = new Set<number>();
  private foodTextures: string[] = [];

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number }): void {
    // TODO: Use Phaser registry for better type safety
    const gameConfig = this.game.registry.get('skewerjamConfig') as GameConfig;
    this.stageNum = data?.stage ?? gameConfig?.stage ?? 1;
    this.gameConfig = gameConfig;
    this.dpr = this.game.registry.get('dpr') || 1;
  }

  preload() {
    const stage = this.stageNum;
    this.stageConfig = getStageConfig(stage);
    this.foodTextures = [];

    for (let i = 0; i < this.stageConfig.numFoods; i++) {
      const food = FOOD_TYPES[i % FOOD_TYPES.length];
      const key = `food_${i}`;
      this.foodTextures.push(key);
      if (!this.textures.exists(key)) {
        this.load.image(key, `/assets/tiles/${food.tile}.png`);
      }
    }
  }

  create() {
    this.board = createBoard(this.stageConfig);
    this.selectedSkewer = null;
    this.phase = 'idle';
    this.moveHistory = [];
    this.score = 0;
    this.moves = 0;
    this.solvedSkewers = new Set();

    this.drawBoard();
    this.emitState();

    this.events.on('shutdown', this.shutdown, this);
  }

  // ─── Layout ───────────────────────────────────────────

  private getSkewerLayout(): { x: number; y: number }[] {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const count = this.board.skewers.length;
    const maxPerRow = Math.min(count, 5);
    const rows = Math.ceil(count / maxPerRow);
    const scale = this.dpr;

    const positions: { x: number; y: number }[] = [];
    const skewerW = SKEWER_WIDTH * scale;
    const gap = SKEWER_GAP * scale;

    for (let row = 0; row < rows; row++) {
      const startIdx = row * maxPerRow;
      const rowCount = Math.min(maxPerRow, count - startIdx);
      const totalRowW = rowCount * skewerW + (rowCount - 1) * gap;
      const startX = (w - totalRowW) / 2 + skewerW / 2;
      const rowH = SKEWER_HEIGHT * scale;
      const totalH = rows * rowH + (rows - 1) * 40 * scale;
      const startY = (h - totalH) / 2 + rowH / 2 + row * (rowH + 40 * scale);

      for (let col = 0; col < rowCount; col++) {
        positions.push({
          x: startX + col * (skewerW + gap),
          y: startY,
        });
      }
    }

    return positions;
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear previous
    this.skewerContainers.forEach((c) => c.destroy());
    this.skewerContainers = [];

    const positions = this.getSkewerLayout();
    const scale = this.dpr;
    const skewerW = SKEWER_WIDTH * scale;
    const skewerH = SKEWER_HEIGHT * scale;
    const itemSz = ITEM_SIZE * scale;
    const itemGap = ITEM_GAP * scale;

    this.board.skewers.forEach((skewer, idx) => {
      const pos = positions[idx];
      const container = this.add.container(pos.x, pos.y);

      // Skewer stick (vertical line)
      const stickW = 4 * scale;
      const stickH = skewerH - 10 * scale;
      const stick = this.add.graphics();
      stick.fillStyle(STICK_COLOR, 1);
      stick.fillRoundedRect(-stickW / 2, -skewerH / 2, stickW, stickH, 2 * scale);
      container.add(stick);

      // Skewer tip (pointed top)
      const tip = this.add.graphics();
      tip.fillStyle(STICK_TIP_COLOR, 1);
      tip.fillTriangle(
        0, -skewerH / 2 - 8 * scale,
        -stickW / 2 - 1 * scale, -skewerH / 2,
        stickW / 2 + 1 * scale, -skewerH / 2,
      );
      container.add(tip);

      // Skewer base/handle
      const handleW = 14 * scale;
      const handleH = 6 * scale;
      const handleY = skewerH / 2 - 10 * scale;
      const handle = this.add.graphics();
      handle.fillStyle(STICK_COLOR, 1);
      handle.fillRoundedRect(-handleW / 2, handleY, handleW, handleH, 3 * scale);
      container.add(handle);

      // Food items (bottom-to-top on the stick)
      for (let s = 0; s < skewer.length; s++) {
        const foodIdx = skewer[s];
        const textureKey = this.foodTextures[foodIdx];
        const itemY = skewerH / 2 - 18 * scale - s * (itemSz + itemGap) - itemSz / 2;

        if (textureKey && this.textures.exists(textureKey)) {
          const sprite = this.add.image(0, itemY, textureKey);
          sprite.setDisplaySize(itemSz, itemSz);
          container.add(sprite);
        } else {
          // Fallback colored circle
          const circle = this.add.circle(0, itemY, itemSz / 2, FALLBACK_COLORS[foodIdx % FALLBACK_COLORS.length]);
          container.add(circle);
        }
      }

      // Solved indicator
      if (isSkewerSolved(skewer)) {
        const check = this.add.graphics();
        check.fillStyle(0x22c55e, 0.15);
        check.fillRoundedRect(-skewerW / 2, -skewerH / 2 - 10 * scale, skewerW, skewerH + 20 * scale, 8 * scale);
        container.add(check);
      }

      // Hit area
      const hitArea = this.add
        .rectangle(0, 0, skewerW + 8 * scale, skewerH + 30 * scale)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => this.onSkewerTap(idx));
      container.add(hitArea);

      this.skewerContainers.push(container);
    });
  }

  // ─── Interaction ──────────────────────────────────────

  private onSkewerTap(idx: number) {
    if (this.phase !== 'idle') return;

    if (this.selectedSkewer === null) {
      // Select source skewer
      if (this.board.skewers[idx].length === 0) return;
      if (isSkewerSolved(this.board.skewers[idx])) return;
      this.selectedSkewer = idx;
      this.liftSkewer(idx, true);
    } else if (this.selectedSkewer === idx) {
      // Deselect
      this.liftSkewer(idx, false);
      this.selectedSkewer = null;
    } else {
      // Try to move
      const move = canMove(this.board.skewers, this.selectedSkewer, idx);
      if (move) {
        this.liftSkewer(this.selectedSkewer, false);
        this.animateMove(move);
      } else {
        // Invalid — shake destination, switch selection
        this.shakeSkewer(idx);
        this.liftSkewer(this.selectedSkewer, false);

        // If tapped skewer has food and isn't solved, select it instead
        if (this.board.skewers[idx].length > 0 && !isSkewerSolved(this.board.skewers[idx])) {
          this.selectedSkewer = idx;
          this.liftSkewer(idx, true);
        } else {
          this.selectedSkewer = null;
        }
      }
    }
  }

  private liftSkewer(idx: number, up: boolean) {
    const container = this.skewerContainers[idx];
    if (!container) return;
    const positions = this.getSkewerLayout();
    const targetY = positions[idx].y + (up ? LIFT_Y * this.dpr : 0);

    this.tweens.add({
      targets: container,
      y: targetY,
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  private shakeSkewer(idx: number) {
    const container = this.skewerContainers[idx];
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

  // ─── Move Animation ───────────────────────────────────

  private animateMove(move: MoveAction) {
    this.phase = 'moving';

    // Save state for undo
    this.moveHistory.push({
      skewers: this.board.skewers.map((s) => [...s]),
      from: move.from,
      to: move.to,
      score: this.score,
    });

    const srcSkewer = this.board.skewers[move.from];
    const scale = this.dpr;
    const itemSz = ITEM_SIZE * scale;
    const itemGap = ITEM_GAP * scale;
    const skewerH = SKEWER_HEIGHT * scale;
    const srcPos = this.getSkewerLayout()[move.from];
    const dstPos = this.getSkewerLayout()[move.to];

    // Create flying food items
    const flyItems: Phaser.GameObjects.GameObject[] = [];
    for (let i = 0; i < move.count; i++) {
      const foodIdx = srcSkewer[srcSkewer.length - 1 - i];
      const textureKey = this.foodTextures[foodIdx];
      
      // Fixed startY to align with drawBoard items
      const srcIdx = srcSkewer.length - 1 - i;
      const startY = srcPos.y + skewerH / 2 - 18 * scale - srcIdx * (itemSz + itemGap) - itemSz / 2;

      let item: Phaser.GameObjects.GameObject;
      if (textureKey && this.textures.exists(textureKey)) {
        const sprite = this.add.image(srcPos.x, startY, textureKey);
        sprite.setDisplaySize(itemSz, itemSz);
        sprite.setDepth(100);
        item = sprite;
      } else {
        const circle = this.add.circle(srcPos.x, startY, itemSz / 2, FALLBACK_COLORS[foodIdx % FALLBACK_COLORS.length]);
        circle.setDepth(100);
        item = circle;
      }
      flyItems.push(item);
    }

    // Execute move on data
    this.board.skewers = executeMove(this.board.skewers, move);
    this.moves++;

    // Redraw (source items removed)
    this.drawBoard();

    // Animate flying items to destination
    const dstSkewer = this.board.skewers[move.to];
    const dstTopIndex = dstSkewer.length;

    flyItems.forEach((item, i) => {
      const targetIdx = dstTopIndex - move.count + i;
      const targetY = dstPos.y + skewerH / 2 - 18 * scale - targetIdx * (itemSz + itemGap) - itemSz / 2;

      this.tweens.add({
        targets: item,
        x: dstPos.x,
        y: targetY,
        duration: 300,
        ease: 'Cubic.easeInOut',
        delay: i * 40,
        onComplete: () => {
          item.destroy();
          if (i === move.count - 1) {
            this.onMoveComplete(move);
          }
        },
      });
    });
  }

  private onMoveComplete(move: MoveAction) {
    // Check if destination skewer is now solved
    const dstSkewer = this.board.skewers[move.to];
    if (isSkewerSolved(dstSkewer) && !this.solvedSkewers.has(move.to)) {
      this.solvedSkewers.add(move.to);
      this.score += 100;
      this.celebrateSkewer(move.to);
    }

    this.drawBoard();
    this.selectedSkewer = null;
    this.emitState();

    // Check win
    if (isWon(this.board.skewers)) {
      this.phase = 'celebrating';
      this.time.delayedCall(600, () => {
        this.celebrateWin();
      });
    } else {
      this.phase = 'idle';
    }
  }

  // ─── Juice Effects ────────────────────────────────────

  private celebrateSkewer(idx: number) {
    const container = this.skewerContainers[idx];
    if (!container) return;
    const scale = this.dpr;

    // Bounce
    this.tweens.add({
      targets: container,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    // Particles
    const pos = this.getSkewerLayout()[idx];
    for (let i = 0; i < 12; i++) {
      const p = this.add.circle(
        pos.x,
        pos.y,
        (3 + Math.random() * 3) * scale,
        0xfbbf24,
        1,
      );
      p.setDepth(200);
      const angle = (Math.PI * 2 * i) / 12;
      const dist = (40 + Math.random() * 30) * scale;
      this.tweens.add({
        targets: p,
        x: pos.x + Math.cos(angle) * dist,
        y: pos.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

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
        stage: this.stageNum,
      });
    });
  }

  // ─── Undo ─────────────────────────────────────────────

  public undo() {
    if (this.phase !== 'idle' || this.moveHistory.length === 0) return;
    const prev = this.moveHistory.pop()!;
    this.board.skewers = prev.skewers;
    this.score = prev.score;
    this.moves = Math.max(0, this.moves - 1);

    // Recalculate solved skewers
    this.solvedSkewers.clear();
    this.board.skewers.forEach((s, i) => {
      if (isSkewerSolved(s)) this.solvedSkewers.add(i);
    });

    this.selectedSkewer = null;
    this.drawBoard();
    this.emitState();
  }

  public restart() {
    this.scene.restart({ stage: this.stageNum });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
  }

  shutdown() {
    this.tweens.killAll();
    this.skewerContainers.forEach((c) => c.destroy());
    this.skewerContainers = [];
  }
}
