/**
 * PlayScene for DreamStore
 *
 * A store-themed puzzle: customers arrive with orders, tap products on the
 * grid to fulfill them. Gravity-fill replenishes consumed products.
 *
 * Events emitted:
 *   'score-update'    — { score, combo }
 *   'customer-update' — { served, total, currentOrder }
 *   'time-update'     — { timeLeft }
 *   'stage-clear'     — { score, timeLeft }
 *   'game-over'       — { score }
 */

import Phaser from 'phaser';
import { getStageConfig } from '../logic/stage';
import {
  createBoard,
  removeCell,
  applyGravity,
  fillEmpty,
  type Board,
} from '../logic/board';
import { generateCustomer, isOrderComplete, fulfillItem } from '../logic/customer';
import { ProductTile } from '../objects/ProductTile';
import {
  GamePhase,
  PRODUCT_IMAGES,
  type GameConfig,
  type StageConfig,
  type CustomerOrder,
} from '../types';

export class PlayScene extends Phaser.Scene {
  private stageNum: number = 1;
  private stageConfig!: StageConfig;
  private gameConfig?: GameConfig;

  // Game state
  private phase: GamePhase = GamePhase.IDLE;
  private board!: Board;
  private score: number = 0;
  private combo: number = 0;
  private customersServed: number = 0;
  private currentOrder: CustomerOrder | null = null;
  private timeLeft: number = 0;

  // Visual grid
  private tileGrid: (ProductTile | null)[][] = [];
  private tileSize: number = 48;
  private boardStartX: number = 0;
  private boardStartY: number = 0;

  // Order display (inside Phaser)
  private orderContainer!: Phaser.GameObjects.Container;
  private orderIcons: Phaser.GameObjects.Image[] = [];
  private orderChecks: Phaser.GameObjects.Text[] = [];
  private orderLabel!: Phaser.GameObjects.Text;

  // Timer
  private timerEvent?: Phaser.Time.TimerEvent;

  // BGM
  private bgm?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number }): void {
    // TODO: Use Phaser registry or scene data for better type safety
    const gameConfig = this.game.registry.get('dreamstoreConfig') as GameConfig;
    this.stageNum = data?.stage ?? gameConfig?.stage ?? 1;
    this.gameConfig = gameConfig;
  }

  preload(): void {
    const base = '/assets/';
    for (const key of PRODUCT_IMAGES) {
      this.load.image(key, `${base}tiles/${key}.png`);
    }
    this.load.audio('bgm1', `${base}audio/Spring_Loaded_Waltz.mp3`);
  }

  create(): void {
    const dpr = this.game.registry.get('dpr') || 1;
    const { width, height } = this.scale;

    // Reset state
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.combo = 0;
    this.customersServed = 0;
    this.currentOrder = null;
    this.orderIcons = [];
    this.orderChecks = [];

    // Load stage config
    this.stageConfig = getStageConfig(this.stageNum);
    this.timeLeft = this.stageConfig.timeLimit;

    // Background — soft pastel pink store theme
    this.cameras.main.setBackgroundColor('#fff5f7');

    // Order display area at top
    const orderAreaHeight = 70 * dpr;
    this.orderContainer = this.add.container(width / 2, orderAreaHeight / 2);

    this.orderLabel = this.add.text(-width / 2 + 16 * dpr, -12 * dpr, '🛒 Order:', {
      fontSize: `${14 * dpr}px`,
      color: '#be185d',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    });
    this.orderContainer.add(this.orderLabel);

    // Calculate tile size to fit board below order area
    const padding = 12 * dpr;
    const availableW = width - padding * 2;
    const availableH = height - orderAreaHeight - padding * 2;
    this.tileSize = Math.floor(
      Math.min(
        availableW / this.stageConfig.cols,
        availableH / this.stageConfig.rows,
        70 * dpr,
      ),
    );

    // Center the board below order area
    const totalW = this.stageConfig.cols * this.tileSize;
    const totalH = this.stageConfig.rows * this.tileSize;
    this.boardStartX = (width - totalW) / 2 + this.tileSize / 2;
    this.boardStartY = orderAreaHeight + (availableH - totalH) / 2 + this.tileSize / 2;

    // Create board data
    this.board = createBoard(this.stageConfig);

    // Create tile visuals
    this.tileGrid = [];
    for (let r = 0; r < this.stageConfig.rows; r++) {
      this.tileGrid[r] = [];
      for (let c = 0; c < this.stageConfig.cols; c++) {
        const { x, y } = this.gridToPixel(r, c);
        const tile = new ProductTile(this, x, y, this.board[r][c], r, c, this.tileSize);
        this.tileGrid[r][c] = tile;
        this.setupTileInput(tile);
      }
    }

    // Spawn first customer
    this.nextCustomer();

    // Start timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTick,
      callbackScope: this,
      loop: true,
    });

    // Emit initial state
    this.emitScore();
    this.emitTime();

    // Stop existing BGM if any
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
      this.bgm = undefined;
    }

    // BGM with error handling
    try {
      this.bgm = this.sound.add('bgm1', { loop: true, volume: 0.2 });
      this.bgm.play();
    } catch (e) {
      console.warn('Failed to play BGM:', e);
    }

    this.events.on('shutdown', this.shutdown, this);

    this.input.once('pointerdown', () => {
      if ((this.sound as Phaser.Sound.WebAudioSoundManager).context?.state === 'suspended') {
        (this.sound as Phaser.Sound.WebAudioSoundManager).context.resume();
      }
    });
  }

  // ─── COORDINATE HELPERS ──────────────────────────────

  private gridToPixel(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardStartX + col * this.tileSize,
      y: this.boardStartY + row * this.tileSize,
    };
  }

  // ─── CUSTOMER ORDER DISPLAY ──────────────────────────

  private displayOrder(): void {
    // Clear previous order icons
    for (const icon of this.orderIcons) icon.destroy();
    for (const check of this.orderChecks) check.destroy();
    this.orderIcons = [];
    this.orderChecks = [];

    if (!this.currentOrder) return;

    const dpr = (this.game as any).__dpr || 1;
    const iconSize = 32 * dpr;
    const gap = 8 * dpr;
    const totalWidth = this.currentOrder.items.length * (iconSize + gap) - gap;
    const startX = -totalWidth / 2;

    for (let i = 0; i < this.currentOrder.items.length; i++) {
      const x = startX + i * (iconSize + gap) + iconSize / 2;
      const y = 10 * dpr;
      const imageKey = PRODUCT_IMAGES[this.currentOrder.items[i] % PRODUCT_IMAGES.length];

      const icon = this.add.image(x, y, imageKey);
      icon.setDisplaySize(iconSize, iconSize);
      if (this.currentOrder.fulfilled[i]) {
        icon.setAlpha(0.3);
      }
      this.orderContainer.add(icon);
      this.orderIcons.push(icon);

      // Checkmark for fulfilled
      if (this.currentOrder.fulfilled[i]) {
        const check = this.add.text(x, y, '✓', {
          fontSize: `${20 * dpr}px`,
          color: '#10b981',
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.orderContainer.add(check);
        this.orderChecks.push(check);
      }
    }
  }

  // ─── CUSTOMER MANAGEMENT ─────────────────────────────

  private nextCustomer(): void {
    if (this.customersServed >= this.stageConfig.customerCount) {
      this.stageClear();
      return;
    }

    this.currentOrder = generateCustomer(
      this.stageConfig.productTypes,
      this.stageConfig.orderSize,
    );
    this.combo = 0;
    this.displayOrder();
    this.updateHighlights();
    this.emitCustomer();
  }

  // ─── TILE HIGHLIGHTING ──────────────────────────────

  private updateHighlights(): void {
    if (!this.currentOrder) return;

    // Find which product types are still needed
    const needed = new Set<number>();
    for (let i = 0; i < this.currentOrder.items.length; i++) {
      if (!this.currentOrder.fulfilled[i]) {
        needed.add(this.currentOrder.items[i]);
      }
    }

    // Highlight matching tiles
    for (let r = 0; r < this.stageConfig.rows; r++) {
      for (let c = 0; c < this.stageConfig.cols; c++) {
        const tile = this.tileGrid[r][c];
        if (tile) {
          if (needed.has(tile.productType)) {
            tile.highlight();
          } else {
            tile.unhighlight();
          }
        }
      }
    }
  }

  // ─── INPUT ──────────────────────────────────────────────

  private setupTileInput(tile: ProductTile): void {
    tile.on('pointerdown', () => {
      if (this.phase !== GamePhase.PLAYING || !this.currentOrder) return;

      const product = tile.productType;
      const idx = fulfillItem(this.currentOrder, product);

      if (idx === -1) {
        // Wrong product — shake feedback and reset combo
        this.combo = 0;
        this.emitScore();

        this.tweens.add({
          targets: tile,
          x: tile.x + 4,
          duration: 50,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.inOut',
        });
        return;
      }

      // Correct product — animate and process
      this.combo++;
      this.score += 50 * Math.max(1, this.combo);
      this.emitScore();

      tile.animateBounce();
      this.processCorrectTap(tile.gridRow, tile.gridCol);
    });
  }

  private async processCorrectTap(row: number, col: number): Promise<void> {
    this.phase = GamePhase.ANIMATING;

    // Remove tile
    const tile = this.tileGrid[row][col];
    if (tile) {
      await new Promise<void>((res) => {
        tile.animateDestroy(() => {
          tile.destroy();
          this.tileGrid[row][col] = null;
          res();
        });
      });
    }

    removeCell(this.board, row, col);

    // Update order display
    this.displayOrder();

    // Check if order is complete
    if (this.currentOrder && isOrderComplete(this.currentOrder)) {
      this.customersServed++;
      this.score += 200; // Bonus for completing order
      this.emitScore();
      this.emitCustomer();

      // Short celebration
      this.cameras.main.flash(200, 16, 185, 129, false, undefined, this);
    }

    // Gravity
    const gravityMoves = applyGravity(this.board);
    const gravityPromises = gravityMoves.map(({ from, to }) => {
      const t = this.tileGrid[from.row][from.col];
      if (t) {
        this.tileGrid[from.row][from.col] = null;
        this.tileGrid[to.row][to.col] = t;
        t.gridRow = to.row;
        t.gridCol = to.col;
        const pos = this.gridToPixel(to.row, to.col);
        return new Promise<void>((res) => t.animateMoveTo(pos.x, pos.y, () => res()));
      }
      return Promise.resolve();
    });
    await Promise.all(gravityPromises);

    // Fill empty
    const filled = fillEmpty(this.board, this.stageConfig.productTypes);
    for (const { row: r, col: c } of filled) {
      const pos = this.gridToPixel(r, c);
      const newTile = new ProductTile(this, pos.x, pos.y, this.board[r][c], r, c, this.tileSize);
      this.tileGrid[r][c] = newTile;
      this.setupTileInput(newTile);
      newTile.animateSpawn();
    }

    await this.delay(200);

    // Next customer if order complete
    if (this.currentOrder && isOrderComplete(this.currentOrder)) {
      this.nextCustomer();
    } else {
      this.updateHighlights();
    }

    const currentPhase = this.phase as GamePhase;
    if (currentPhase !== GamePhase.CLEAR && currentPhase !== GamePhase.GAME_OVER) {
      this.phase = GamePhase.PLAYING;
    }
  }

  // ─── TIMER ──────────────────────────────────────────────

  private onTick(): void {
    if (this.phase !== GamePhase.PLAYING && this.phase !== GamePhase.ANIMATING) return;

    this.timeLeft--;
    this.emitTime();

    if (this.timeLeft <= 0) {
      this.gameOver();
    }
  }

  // ─── GAME FLOW ──────────────────────────────────────────

  private stageClear(): void {
    this.phase = GamePhase.CLEAR;
    if (this.timerEvent) this.timerEvent.destroy();
    this.gameConfig?.onClear?.();
    this.game.events.emit('stage-clear', {
      score: this.score,
      timeLeft: this.timeLeft,
    });
  }

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;
    if (this.timerEvent) this.timerEvent.destroy();
    this.gameConfig?.onGameOver?.();
    this.game.events.emit('game-over', {
      score: this.score,
    });
  }

  // ─── EMITTERS ──────────────────────────────────────────

  private emitScore(): void {
    this.game.events.emit('score-update', {
      score: this.score,
      combo: this.combo,
    });
  }

  private emitTime(): void {
    this.game.events.emit('time-update', {
      timeLeft: this.timeLeft,
    });
  }

  private emitCustomer(): void {
    this.game.events.emit('customer-update', {
      served: this.customersServed,
      total: this.stageConfig.customerCount,
      currentOrder: this.currentOrder ? {
        items: [...this.currentOrder.items],
        fulfilled: [...this.currentOrder.fulfilled],
      } : null,
    });
  }

  // ─── UTILS ──────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise((res) => this.time.delayedCall(ms, () => res()));
  }

  shutdown(): void {
    this.tweens.killAll();
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
      this.bgm = undefined;
    }
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = undefined;
    }
    this.tileGrid = [];
  }
}
