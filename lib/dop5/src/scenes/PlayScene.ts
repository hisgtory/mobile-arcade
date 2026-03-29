import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  ERASER_RADIUS,
  getStageConfig,
  type GameConfig,
  type PuzzleData,
} from '../types';
import { createEraseGrid, eraseAt, getErasePercent, isSolved, type EraseGrid } from '../logic/puzzle';

type GamePhase = 'idle' | 'erasing' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private config!: GameConfig;
  private dpr = 1;
  private puzzle!: PuzzleData;
  private eraseGrid!: EraseGrid;
  private phase: GamePhase = 'idle';

  // Scene area (in actual pixel coords)
  private sceneX = 0;
  private sceneY = 0;
  private sceneW = 0;
  private sceneH = 0;

  // Target area (in actual pixel coords)
  private targetX = 0;
  private targetY = 0;
  private targetW = 0;
  private targetH = 0;

  // Cover layer
  private coverGraphics!: Phaser.GameObjects.Graphics;
  private eraseTexture!: Phaser.GameObjects.RenderTexture;
  private isPointerDown = false;
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
    const stageConfig = getStageConfig(stage);
    this.puzzle = stageConfig.puzzle;
    this.eraseGrid = createEraseGrid();
    this.phase = 'idle';
    this.isPointerDown = false;
    this.score = 0;

    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    // Scene area: full game area with some padding for question
    const questionAreaH = 60 * this.dpr;
    this.sceneX = 0;
    this.sceneY = questionAreaH;
    this.sceneW = w;
    this.sceneH = h - questionAreaH;

    // Calculate target area in pixel coords
    this.targetX = this.sceneX + this.puzzle.target.x * this.sceneW;
    this.targetY = this.sceneY + this.puzzle.target.y * this.sceneH;
    this.targetW = this.puzzle.target.w * this.sceneW;
    this.targetH = this.puzzle.target.h * this.sceneH;

    // Background
    const bgHex = parseInt(this.puzzle.bgColor.replace('#', ''), 16);
    this.cameras.main.setBackgroundColor(bgHex);

    // Draw question text
    this.add.text(w / 2, questionAreaH / 2, this.puzzle.question, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: `${Math.round(20 * this.dpr)}px`,
      color: this.isLightBg() ? '#1F2937' : '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Draw scene objects (underneath cover)
    this.drawSceneObjects();

    // Create the cover layer (solid colored overlay that gets erased)
    this.createCoverLayer();

    // Draw target hint (subtle border)
    this.drawTargetHint();

    // Input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase === 'celebrating') return;
      this.isPointerDown = true;
      this.phase = 'erasing';
      this.handleErase(pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPointerDown || this.phase === 'celebrating') return;
      this.handleErase(pointer.x, pointer.y);
    });

    this.input.on('pointerup', () => {
      this.isPointerDown = false;
      if (this.phase === 'erasing') this.phase = 'idle';
    });

    this.emitState();
  }

  private isLightBg(): boolean {
    const hex = this.puzzle.bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }

  private drawSceneObjects() {
    for (const obj of this.puzzle.objects) {
      const x = this.sceneX + obj.x * this.sceneW;
      const y = this.sceneY + obj.y * this.sceneH;
      const size = Math.round(obj.size * this.dpr);

      this.add.text(x, y, obj.emoji, {
        fontSize: `${size}px`,
      }).setOrigin(0.5);
    }
  }

  private createCoverLayer() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    // Create a render texture covering the whole scene
    this.eraseTexture = this.add.renderTexture(0, 0, w, h);
    this.eraseTexture.setOrigin(0, 0);

    // Fill the render texture with a cover color
    const coverColor = this.getCoverColor();
    const graphics = this.add.graphics();
    graphics.fillStyle(coverColor, 1);
    graphics.fillRect(0, this.sceneY, w, this.sceneH);
    this.eraseTexture.draw(graphics);
    graphics.destroy();

    // Draw some "cover" decorations on the render texture (pattern)
    this.drawCoverPattern();
  }

  private getCoverColor(): number {
    // A slightly darker version of the bg, or a contrasting cover
    return 0xD4A574; // warm beige/parchment color for the "scratch" layer
  }

  private drawCoverPattern() {
    const w = DEFAULT_WIDTH * this.dpr;
    const scale = this.dpr;

    // Draw a subtle grid pattern on the cover
    const patternGraphics = this.add.graphics();
    patternGraphics.lineStyle(1 * scale, 0xC49A6C, 0.3);

    for (let x = 0; x < w; x += 20 * scale) {
      patternGraphics.lineBetween(x, this.sceneY, x, this.sceneY + this.sceneH);
    }
    for (let y = this.sceneY; y < this.sceneY + this.sceneH; y += 20 * scale) {
      patternGraphics.lineBetween(0, y, w, y);
    }

    // Add "Scratch here!" hint text
    const hintText = this.add.text(
      w / 2,
      this.sceneY + this.sceneH / 2,
      '👆 Scratch to reveal!',
      {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: `${Math.round(18 * scale)}px`,
        color: '#8B6914',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);

    this.eraseTexture.draw(patternGraphics);
    this.eraseTexture.draw(hintText);
    patternGraphics.destroy();
    hintText.destroy();
  }

  private drawTargetHint() {
    // Subtle dashed border around target area (behind cover, so barely visible)
    const graphics = this.add.graphics();
    graphics.lineStyle(2 * this.dpr, 0xFFD700, 0.0); // invisible at start
    graphics.strokeRect(this.targetX, this.targetY, this.targetW, this.targetH);
    graphics.setDepth(0);
  }

  private handleErase(px: number, py: number) {
    if (this.phase === 'celebrating') return;

    const scale = this.dpr;
    const radius = ERASER_RADIUS * scale;

    // Erase from the render texture (make it transparent)
    const eraser = this.add.graphics();
    eraser.fillStyle(0xffffff, 1);
    eraser.fillCircle(px, py, radius);

    this.eraseTexture.erase(eraser, 0, 0);
    eraser.destroy();

    // Check if erase is within target area
    const localX = px - this.targetX;
    const localY = py - this.targetY;

    // Erase the grid even for touches near the target (radius overlap)
    eraseAt(
      this.eraseGrid,
      localX,
      localY,
      radius,
      this.targetW,
      this.targetH,
    );

    // Update score based on erase percent
    const percent = getErasePercent(this.eraseGrid);
    this.score = Math.round(percent * 1000);

    this.emitState();

    // Check if solved
    if (isSolved(this.eraseGrid)) {
      this.onSolved();
    }
  }

  private onSolved() {
    if (this.phase === 'celebrating') return;
    this.phase = 'celebrating';

    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const scale = this.dpr;

    // Clear entire cover to reveal everything
    const clearGraphics = this.add.graphics();
    clearGraphics.fillStyle(0xffffff, 1);
    clearGraphics.fillRect(0, 0, w, h);
    this.eraseTexture.erase(clearGraphics, 0, 0);
    clearGraphics.destroy();

    // Flash effect on target area
    const flash = this.add.graphics();
    flash.fillStyle(0xFFD700, 0.4);
    flash.fillRoundedRect(
      this.targetX - 4 * scale,
      this.targetY - 4 * scale,
      this.targetW + 8 * scale,
      this.targetH + 8 * scale,
      8 * scale,
    );
    flash.setDepth(50);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Success text
    const successText = this.add.text(w / 2, h / 2, '✅ Found it!', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: `${Math.round(32 * scale)}px`,
      color: '#22C55E',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 4 * scale,
    }).setOrigin(0.5).setDepth(100).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: successText,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Confetti burst
    this.celebrateWin();

    // Emit stage clear after delay
    this.time.delayedCall(1500, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        stage: this.config.stage ?? 1,
      });
    });
  }

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    for (let i = 0; i < 24; i++) {
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
      p.setDepth(200);
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

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  private emitState() {
    const percent = getErasePercent(this.eraseGrid);
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('erase-update', { erasePercent: percent });
  }
}
