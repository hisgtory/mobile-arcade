import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  CATEGORIES,
  getStageConfig,
  type GameConfig,
  type BoardState,
} from '../types';
import { createBoard, placeItem, isWon } from '../logic/board';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config: GameConfig = {};
  private dpr = 1;
  private selectedItemId: number | null = null;
  private phase: 'idle' | 'animating' | 'celebrating' = 'idle';
  private moveHistory: { board: BoardState; itemId: number; shelfIndex: number }[] = [];
  private score = 0;
  private moves = 0;

  private itemSprites: Map<number, Phaser.GameObjects.Container> = new Map();
  private shelfContainers: Phaser.GameObjects.Container[] = [];
  private glowRing: Phaser.GameObjects.Graphics | null = null;

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

    this.selectedItemId = null;
    this.phase = 'idle';
    this.moveHistory = [];
    this.score = 0;
    this.moves = 0;
    this.itemSprites.clear();
    this.shelfContainers = [];
    this.glowRing = null;

    this.drawFloorItems();
    this.drawShelves();
    this.emitState();
  }

  private drawFloorItems() {
    const radius = 28 * this.dpr;
    const fontSize = Math.round(24 * this.dpr);

    for (const item of this.board.items) {
      if (item.shelved) continue;

      const x = item.x * this.dpr;
      const y = item.y * this.dpr;
      const cat = CATEGORIES[item.category];

      const container = this.add.container(x, y);

      const circle = this.add.graphics();
      circle.fillStyle(Phaser.Display.Color.HexStringToColor(cat.color).color, 1);
      circle.fillCircle(0, 0, radius);
      container.add(circle);

      const emoji = this.add.text(0, 0, cat.emoji, {
        fontSize: `${fontSize}px`,
      }).setOrigin(0.5);
      container.add(emoji);

      // Hit area
      container.setSize(radius * 2, radius * 2);
      container.setInteractive(
        new Phaser.Geom.Circle(0, 0, radius),
        Phaser.Geom.Circle.Contains,
      );
      container.on('pointerdown', () => this.onItemTap(item.id));

      this.itemSprites.set(item.id, container);
    }
  }

  private drawShelves() {
    const numShelves = this.board.numCategories;
    const dpr = this.dpr;
    const screenW = DEFAULT_WIDTH * dpr;
    const shelfFontSize = Math.round(18 * dpr);
    const counterFontSize = Math.round(12 * dpr);

    // Layout: 1 row if ≤ 6, 2 rows if > 6
    const useDoubleRow = numShelves > 6;
    const perRow = useDoubleRow ? Math.ceil(numShelves / 2) : numShelves;
    const gap = 8 * dpr;
    const shelfH = 40 * dpr;
    const shelfW = (screenW - gap * (perRow + 1)) / perRow;
    const baseY = useDoubleRow ? 410 * dpr : 440 * dpr;
    const rowSpacing = (shelfH + gap);

    for (let i = 0; i < numShelves; i++) {
      const row = useDoubleRow ? Math.floor(i / perRow) : 0;
      const col = useDoubleRow ? i % perRow : i;

      const x = gap + col * (shelfW + gap) + shelfW / 2;
      const y = baseY + row * rowSpacing;

      const cat = CATEGORIES[this.board.shelves[i].category];
      const shelf = this.board.shelves[i];

      const container = this.add.container(x, y);

      // Rounded rectangle (pill shape)
      const bg = this.add.graphics();
      const cornerRadius = shelfH / 2;
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(cat.color).color, 0.2);
      bg.fillRoundedRect(-shelfW / 2, -shelfH / 2, shelfW, shelfH, cornerRadius);
      bg.lineStyle(2 * dpr, Phaser.Display.Color.HexStringToColor(cat.color).color, 0.8);
      bg.strokeRoundedRect(-shelfW / 2, -shelfH / 2, shelfW, shelfH, cornerRadius);
      container.add(bg);

      // Emoji label
      const emoji = this.add.text(-shelfW / 4, 0, cat.emoji, {
        fontSize: `${shelfFontSize}px`,
      }).setOrigin(0.5);
      container.add(emoji);

      // Counter text
      const counter = this.add.text(shelfW / 4, 0, `${shelf.items.length}/${shelf.capacity}`, {
        fontSize: `${counterFontSize}px`,
        color: cat.color,
        fontFamily: 'Arial',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(counter);

      // Hit area
      container.setSize(shelfW, shelfH);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-shelfW / 2, -shelfH / 2, shelfW, shelfH),
        Phaser.Geom.Rectangle.Contains,
      );
      container.on('pointerdown', () => this.onShelfTap(i));

      this.shelfContainers.push(container);
    }
  }

  private drawBoard() {
    // Destroy existing sprites
    this.itemSprites.forEach(container => container.destroy());
    this.itemSprites.clear();
    this.shelfContainers.forEach(container => container.destroy());
    this.shelfContainers = [];
    if (this.glowRing) {
      this.glowRing.destroy();
      this.glowRing = null;
    }

    this.drawFloorItems();
    this.drawShelves();
  }

  private showGlow(itemId: number) {
    this.clearGlow();
    const container = this.itemSprites.get(itemId);
    if (!container) return;

    const radius = 28 * this.dpr;
    const glow = this.add.graphics();
    glow.lineStyle(3 * this.dpr, 0xffffff, 0.9);
    glow.strokeCircle(container.x, container.y, radius + 4 * this.dpr);
    glow.fillStyle(0xffffff, 0.15);
    glow.fillCircle(container.x, container.y, radius + 4 * this.dpr);
    this.glowRing = glow;

    // Scale up slightly
    container.setScale(1.15);
  }

  private clearGlow() {
    if (this.glowRing) {
      this.glowRing.destroy();
      this.glowRing = null;
    }
    // Reset scale on previously selected item
    if (this.selectedItemId !== null) {
      const prev = this.itemSprites.get(this.selectedItemId);
      if (prev) prev.setScale(1);
    }
  }

  private onItemTap(itemId: number) {
    if (this.phase !== 'idle') return;

    const item = this.board.items.find(it => it.id === itemId);
    if (!item || item.shelved) return;

    if (this.selectedItemId === itemId) {
      // Deselect
      this.clearGlow();
      this.selectedItemId = null;
      return;
    }

    // Select new item
    this.clearGlow();
    this.selectedItemId = itemId;
    this.showGlow(itemId);
  }

  private onShelfTap(shelfIndex: number) {
    if (this.phase !== 'idle' || this.selectedItemId === null) return;

    const itemId = this.selectedItemId;
    const prevBoard = this.board;
    const { correct, board: newBoard } = placeItem(this.board, itemId, shelfIndex);

    this.moves++;

    if (correct) {
      this.phase = 'animating';
      this.moveHistory.push({ board: prevBoard, itemId, shelfIndex });
      this.board = newBoard;

      const container = this.itemSprites.get(itemId);
      const shelfContainer = this.shelfContainers[shelfIndex];

      if (container && shelfContainer) {
        this.clearGlow();
        this.selectedItemId = null;

        this.tweens.add({
          targets: container,
          x: shelfContainer.x,
          y: shelfContainer.y,
          scaleX: 0.5,
          scaleY: 0.5,
          alpha: 0.3,
          duration: 400,
          ease: 'Cubic.easeInOut',
          onComplete: () => {
            this.score += 100;
            this.drawBoard();
            this.emitState();

            if (isWon(this.board)) {
              this.celebrateWin();
            } else {
              this.phase = 'idle';
            }
          },
        });
      } else {
        this.clearGlow();
        this.selectedItemId = null;
        this.score += 100;
        this.drawBoard();
        this.emitState();
        if (isWon(this.board)) {
          this.celebrateWin();
        } else {
          this.phase = 'idle';
        }
      }
    } else {
      // Wrong shelf — shake it
      this.shakeShelf(shelfIndex);
      this.clearGlow();
      this.selectedItemId = null;
      this.emitState();
    }
  }

  private shakeShelf(shelfIndex: number) {
    const container = this.shelfContainers[shelfIndex];
    if (!container) return;

    const origX = container.x;
    const offset = 6 * this.dpr;

    this.tweens.add({
      targets: container,
      x: origX + offset,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        container.x = origX;
      },
    });
  }

  private celebrateWin() {
    this.phase = 'celebrating';

    const screenW = DEFAULT_WIDTH * this.dpr;
    const screenH = DEFAULT_HEIGHT * this.dpr;
    const colors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316];

    // Confetti burst
    for (let i = 0; i < 40; i++) {
      const x = screenW / 2 + (Math.random() - 0.5) * 60 * this.dpr;
      const size = (4 + Math.random() * 6) * this.dpr;
      const color = colors[Math.floor(Math.random() * colors.length)];

      const p = this.add.rectangle(
        x,
        screenH / 2,
        size,
        size * 1.5,
        color,
      );
      p.setDepth(300);
      p.setRotation(Math.random() * Math.PI);

      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * screenW * 0.8,
        y: p.y + (Math.random() - 0.5) * screenH * 0.6,
        rotation: p.rotation + (Math.random() - 0.5) * 4,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    // Emit stage clear after confetti
    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        moves: this.moves,
        stage: this.config.stage ?? 1,
      });
    });
  }

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
  }

  public undo() {
    if (this.moveHistory.length === 0 || this.phase !== 'idle') return;

    const last = this.moveHistory.pop()!;
    this.board = last.board;
    this.score = Math.max(0, this.score - 100);
    this.moves = Math.max(0, this.moves - 1);

    this.clearGlow();
    this.selectedItemId = null;
    this.drawBoard();
    this.emitState();
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }
}
