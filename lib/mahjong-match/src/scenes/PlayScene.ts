import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  TILE_EMOJIS,
  getStageConfig,
  type TileData,
  type GameConfig,
} from '../types';
import {
  createBoard,
  isFree,
  canMatch,
  findAllMatches,
  isWon,
  isStuck,
  removePair,
  shuffleBoard,
} from '../logic/board';

// ─── Visual Constants ────────────────────────────────────
const TILE_W = 40;
const TILE_H = 50;
const TILE_GAP = 4;
const TILE_RADIUS = 6;
const LAYER_OFFSET_X = 3;
const LAYER_OFFSET_Y = -3;
const SHADOW_OFFSET = 2;
const COMBO_WINDOW_MS = 1500;

type GamePhase = 'idle' | 'animating' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: ReturnType<typeof createBoard>;
  private config!: GameConfig;
  private dpr = 1;

  // Visual state
  private tileSprites: Map<number, Phaser.GameObjects.Container> = new Map();
  private selectedTile: TileData | null = null;
  private phase: GamePhase = 'idle';

  // Scoring
  private score = 0;
  private moves = 0;
  private lastMatchTime = 0;
  private comboCount = 0;

  // Layout cache (recalculated once per draw)
  private gridBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  constructor() {
    super({ key: 'PlayScene' });
  }

  /* ────── Lifecycle ────── */

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    const stage = this.config.stage ?? 1;
    const stageConfig = getStageConfig(stage);
    this.board = createBoard(stageConfig);

    this.selectedTile = null;
    this.phase = 'idle';
    this.score = 0;
    this.moves = 0;
    this.lastMatchTime = 0;
    this.comboCount = 0;
    this.tileSprites.clear();

    this.cacheGridBounds();
    this.createEmojiTextures();
    this.drawBoard();
    this.emitState();
  }

  /* ────── Emoji Textures (canvas → Phaser texture) ────── */

  private createEmojiTextures() {
    const usedTypes = new Set(this.board.tiles.map((t) => t.typeIndex));
    const size = Math.ceil(32 * this.dpr);

    for (const typeIdx of usedTypes) {
      const key = `emoji-${typeIdx}`;
      if (this.textures.exists(key)) continue;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.font = `${Math.ceil(22 * this.dpr)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        TILE_EMOJIS[typeIdx % TILE_EMOJIS.length],
        size / 2,
        size / 2,
      );
      this.textures.addCanvas(key, canvas);
    }
  }

  /* ────── Layout ────── */

  private cacheGridBounds() {
    const all = this.board.tiles;
    this.gridBounds = {
      minX: Math.min(...all.map((t) => t.gridX)),
      maxX: Math.max(...all.map((t) => t.gridX)),
      minY: Math.min(...all.map((t) => t.gridY)),
      maxY: Math.max(...all.map((t) => t.gridY)),
    };
  }

  private getTilePosition(tile: TileData): { x: number; y: number } {
    const s = this.dpr;
    const w = DEFAULT_WIDTH * s;
    const h = DEFAULT_HEIGHT * s;

    const { minX, maxX, minY, maxY } = this.gridBounds;
    const gridW = maxX - minX + 1;
    const gridH = maxY - minY + 1;

    const tw = TILE_W * s;
    const th = TILE_H * s;
    const gap = TILE_GAP * s;

    const totalW = gridW * tw + (gridW - 1) * gap;
    const totalH = gridH * th + (gridH - 1) * gap;

    const startX = (w - totalW) / 2 + tw / 2;
    const startY = (h - totalH) / 2 + th / 2;

    const lx = LAYER_OFFSET_X * s * tile.gridZ;
    const ly = LAYER_OFFSET_Y * s * tile.gridZ;

    return {
      x: startX + (tile.gridX - minX) * (tw + gap) + lx,
      y: startY + (tile.gridY - minY) * (th + gap) + ly,
    };
  }

  /* ────── Drawing ────── */

  private drawBoard() {
    // Destroy previous sprites
    this.tileSprites.forEach((c) => c.destroy());
    this.tileSprites.clear();

    const s = this.dpr;
    const tw = TILE_W * s;
    const th = TILE_H * s;
    const radius = TILE_RADIUS * s;
    const shadowOff = SHADOW_OFFSET * s;

    // Draw order: low z first, then y, then x
    const visible = [...this.board.tiles]
      .filter((t) => !t.removed)
      .sort(
        (a, b) =>
          a.gridZ - b.gridZ || a.gridY - b.gridY || a.gridX - b.gridX,
      );

    for (const tile of visible) {
      const pos = this.getTilePosition(tile);
      const free = isFree(tile, this.board.tiles);
      const selected =
        this.selectedTile !== null && this.selectedTile.id === tile.id;

      const container = this.add.container(pos.x, pos.y);
      container.setDepth(tile.gridZ * 1000 + tile.gridY * 10 + tile.gridX);

      // Shadow
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.25);
      shadow.fillRoundedRect(
        -tw / 2 + shadowOff,
        -th / 2 + shadowOff,
        tw,
        th,
        radius,
      );
      container.add(shadow);

      // Background
      const bg = this.add.graphics();
      const bgAlpha = free ? 1.0 : 0.6;
      bg.fillStyle(0xffffff, bgAlpha);
      bg.fillRoundedRect(-tw / 2, -th / 2, tw, th, radius);
      bg.lineStyle(1 * s, 0xbbbbbb, bgAlpha);
      bg.strokeRoundedRect(-tw / 2, -th / 2, tw, th, radius);
      container.add(bg);

      // Emoji image
      const emojiKey = `emoji-${tile.typeIndex}`;
      if (this.textures.exists(emojiKey)) {
        const emoji = this.add.image(0, 0, emojiKey);
        emoji.setAlpha(free ? 1.0 : 0.5);
        container.add(emoji);
      }

      // Selection highlight
      if (selected) {
        const hl = this.add.graphics();
        hl.lineStyle(3 * s, 0x3b82f6, 1);
        hl.strokeRoundedRect(
          -tw / 2 - 2 * s,
          -th / 2 - 2 * s,
          tw + 4 * s,
          th + 4 * s,
          radius + 2 * s,
        );
        container.add(hl);
      }

      // Hit area
      const hitArea = this.add
        .rectangle(0, 0, tw + 4 * s, th + 4 * s)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => this.onTileTap(tile));
      container.add(hitArea);

      // Dim blocked tiles
      if (!free) container.setAlpha(0.6);

      this.tileSprites.set(tile.id, container);
    }
  }

  /* ────── Interaction ────── */

  private onTileTap(tile: TileData) {
    if (this.phase !== 'idle') return;
    if (tile.removed) return;
    if (!isFree(tile, this.board.tiles)) return;

    if (this.selectedTile === null) {
      // First selection
      this.selectedTile = tile;
      this.drawBoard();
      return;
    }

    if (this.selectedTile.id === tile.id) {
      // Deselect
      this.selectedTile = null;
      this.drawBoard();
      return;
    }

    if (canMatch(this.selectedTile, tile, this.board.tiles)) {
      // Successful match
      this.animateMatch(this.selectedTile, tile);
    } else {
      // Mismatch → shake, then reselect the new tile
      this.shakeTile(tile.id);
      this.selectedTile = tile;
      this.drawBoard();
    }
  }

  /* ────── Match Animation ────── */

  private animateMatch(a: TileData, b: TileData) {
    this.phase = 'animating';

    const cA = this.tileSprites.get(a.id);
    const cB = this.tileSprites.get(b.id);

    const pop = (c: Phaser.GameObjects.Container | undefined) => {
      if (!c) return;
      this.tweens.add({
        targets: c,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: 250,
        ease: 'Back.easeIn',
      });
    };

    pop(cA);
    pop(cB);

    // Sparkle particles at each tile position
    this.spawnParticles(a);
    this.spawnParticles(b);

    this.time.delayedCall(260, () => {
      this.board.tiles = removePair(this.board.tiles, a, b);
      this.selectedTile = null;
      this.moves++;

      // Combo scoring
      const now = Date.now();
      if (now - this.lastMatchTime < COMBO_WINDOW_MS && this.lastMatchTime > 0) {
        this.comboCount++;
      } else {
        this.comboCount = 0;
      }
      this.lastMatchTime = now;
      this.score += 100 + 50 * this.comboCount;

      this.drawBoard();
      this.emitState();

      if (isWon(this.board.tiles)) {
        this.phase = 'celebrating';
        this.time.delayedCall(400, () => this.celebrateWin());
      } else if (isStuck(this.board.tiles)) {
        this.phase = 'idle';
        this.game.events.emit('game-stuck');
      } else {
        this.phase = 'idle';
      }
    });
  }

  /* ────── Juice Effects ────── */

  private spawnParticles(tile: TileData) {
    const pos = this.getTilePosition(tile);
    const s = this.dpr;
    const colors = [0xfbbf24, 0x3b82f6, 0xef4444, 0x22c55e];

    for (let i = 0; i < 8; i++) {
      const color = colors[i % colors.length];
      const p = this.add.circle(
        pos.x,
        pos.y,
        (2 + Math.random() * 3) * s,
        color,
        1,
      );
      p.setDepth(2000);
      const angle = (Math.PI * 2 * i) / 8;
      const dist = (25 + Math.random() * 20) * s;
      this.tweens.add({
        targets: p,
        x: pos.x + Math.cos(angle) * dist,
        y: pos.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  private shakeTile(id: number) {
    const container = this.tileSprites.get(id);
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

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const confettiColors = [
      0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316,
    ];

    for (let i = 0; i < 40; i++) {
      const color =
        confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const size = (4 + Math.random() * 6) * this.dpr;
      const p = this.add.rectangle(
        w / 2 + (Math.random() - 0.5) * 80 * this.dpr,
        h / 2,
        size,
        size * 1.5,
        color,
      );
      p.setDepth(3000);
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

  /* ────── Public API ────── */

  /** Reshuffle remaining tiles, guaranteeing at least one valid match. */
  public shuffle() {
    if (this.phase !== 'idle') return;
    this.board.tiles = shuffleBoard(this.board.tiles);
    this.selectedTile = null;
    this.drawBoard();
    this.emitState();
  }

  /** Briefly highlight one available matching pair. */
  public hint() {
    if (this.phase !== 'idle') return;
    const matches = findAllMatches(this.board.tiles);
    if (matches.length === 0) return;

    const [a, b] = matches[0];
    for (const tile of [a, b]) {
      const c = this.tileSprites.get(tile.id);
      if (!c) continue;
      this.tweens.add({
        targets: c,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 300,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  /* ────── Events ────── */

  private emitState() {
    const remaining = this.board.tiles.filter((t) => !t.removed).length;
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
    this.game.events.emit('matches-left', { count: Math.floor(remaining / 2) });
  }

  /* ────── Cleanup ────── */

  shutdown(): void {
    this.tileSprites.forEach((c) => c.destroy());
    this.tileSprites.clear();
    this.selectedTile = null;
  }
}
