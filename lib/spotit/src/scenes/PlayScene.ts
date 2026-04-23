/**
 * PlayScene for SpotIt — Hidden Object Game
 *
 * Phaser handles the item board. HUD is handled by React.
 *
 * Events emitted:
 *   'item-found'    — { foundCount, targetCount, score }
 *   'wrong-tap'     — { score, penalty }
 *   'time-update'   — { remainingMs, elapsedMs }
 *   'stage-clear'   — { score, elapsedMs }
 *   'game-over'     — { score, elapsedMs }
 *   'hint-used'     — {}
 */

import Phaser from 'phaser';
import { getStageConfig } from '../logic/stage';
import { generateBoard } from '../logic/board';
import { Item } from '../objects/Item';
import { GamePhase, ITEM_IMAGES, type GameConfig, type StageConfig, type ItemData, type ItemType } from '../types';

export class PlayScene extends Phaser.Scene {
  private stageNum: number = 1;
  private stageConfig!: StageConfig;
  private gameConfig?: GameConfig;

  // Game state
  private phase: GamePhase = GamePhase.IDLE;
  private score: number = 0;
  private foundCount: number = 0;
  private targetTypes: ItemType[] = [];
  private itemDataList: ItemData[] = [];

  // Timer
  private startTime: number = 0;
  private elapsedMs: number = 0;
  private timerEvent?: Phaser.Time.TimerEvent;

  // Visual objects
  private itemObjects: Item[] = [];
  private cellSize: number = 48;
  private boardStartX: number = 0;
  private boardStartY: number = 0;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number }): void {
    const gameConfig = this.game.registry.get('spotitConfig') as GameConfig;
    this.stageNum = data?.stage ?? gameConfig?.stage ?? 1;
    this.gameConfig = gameConfig;
  }

  preload(): void {
    const base = '/assets/';
    for (const key of ITEM_IMAGES) {
      this.load.image(key, `${base}tiles/${key}.png`);
    }
  }

  create(): void {
    const dpr = this.game.registry.get('dpr') || 1;
    const { width, height } = this.scale;

    // Reset state
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.foundCount = 0;
    this.elapsedMs = 0;

    // Load stage
    this.stageConfig = getStageConfig(this.stageNum);

    // Background
    this.cameras.main.setBackgroundColor('#f0f2f5');

    // Calculate cell size to fit board
    const padding = 16 * dpr;
    const boardW = width - padding * 2;
    const boardH = height - padding * 2;
    this.cellSize = Math.floor(
      Math.min(
        boardW / this.stageConfig.cols,
        boardH / this.stageConfig.rows,
        72 * dpr,
      ),
    );

    // Center the board
    const totalW = this.stageConfig.cols * this.cellSize;
    const totalH = this.stageConfig.rows * this.cellSize;
    this.boardStartX = (width - totalW) / 2 + this.cellSize / 2;
    this.boardStartY = (height - totalH) / 2 + this.cellSize / 2;

    // Generate board data
    const { items, targetTypes } = generateBoard(this.stageConfig);
    this.itemDataList = items;
    this.targetTypes = targetTypes;

    // Create item visuals
    this.itemObjects = [];
    for (const itemData of items) {
      const px = this.boardStartX + itemData.x * this.cellSize;
      const py = this.boardStartY + itemData.y * this.cellSize;
      const item = new Item(
        this, px, py, itemData.type, itemData.id,
        itemData.isTarget, this.cellSize, dpr,
      );
      item.animateSpawn();
      this.setupItemInput(item);
      this.itemObjects.push(item);
    }

    // Start timer using scene clock
    this.startTime = this.time.now;
    this.timerEvent = this.time.addEvent({
      delay: 200,
      loop: true,
      callback: this.onTimerTick,
      callbackScope: this,
    });

    this.events.on('shutdown', this.shutdown, this);

    // Emit initial state
    this.emitItemFound();
    this.emitTargetTypes();
  }

  // ─── INPUT ──────────────────────────────────────────────

  private setupItemInput(item: Item): void {
    item.on('pointerdown', () => {
      if (this.phase !== GamePhase.PLAYING) return;
      if (item.found) return;

      if (item.isTarget) {
        this.onCorrectTap(item);
      } else {
        this.onWrongTap(item);
      }
    });
  }

  private onCorrectTap(item: Item): void {
    item.markFound();
    this.foundCount++;
    this.score += 100;

    // Update corresponding data
    const data = this.itemDataList.find(d => d.id === item.itemId);
    if (data) data.found = true;

    this.emitItemFound();

    // Check if all targets found
    if (this.foundCount >= this.stageConfig.targetCount) {
      this.stageClear();
    }
  }

  private onWrongTap(item: Item): void {
    item.animateWrong();
    const penalty = 10;
    this.score = Math.max(0, this.score - penalty);
    this.game.events.emit('wrong-tap', { score: this.score, penalty });
  }

  // ─── PUBLIC METHODS (called from React) ─────────────────

  /** Reveal one unfound target */
  doHint(): void {
    if (this.phase !== GamePhase.PLAYING) return;
    const unfound = this.itemObjects.find(it => it.isTarget && !it.found);
    if (unfound) {
      unfound.animateHint();
      this.game.events.emit('hint-used', {});
    }
  }

  // ─── TIMER ──────────────────────────────────────────────

  private onTimerTick(): void {
    if (this.phase !== GamePhase.PLAYING) return;

    this.elapsedMs = this.time.now - this.startTime;
    const remainingMs = Math.max(0, this.stageConfig.timeLimit * 1000 - this.elapsedMs);

    this.game.events.emit('time-update', {
      remainingMs,
      elapsedMs: this.elapsedMs,
    });

    // Check time limit
    if (this.stageConfig.timeLimit > 0 && remainingMs <= 0) {
      this.gameOver();
    }
  }

  // ─── GAME FLOW ──────────────────────────────────────────

  private stageClear(): void {
    this.phase = GamePhase.CLEAR;
    if (this.timerEvent) this.timerEvent.remove();
    this.elapsedMs = this.time.now - this.startTime;

    // Time bonus
    if (this.stageConfig.timeLimit > 0) {
      const remainingSec = Math.max(0, this.stageConfig.timeLimit - this.elapsedMs / 1000);
      this.score += Math.round(remainingSec * 5);
    }
    this.score += 500; // stage clear bonus

    this.gameConfig?.onClear?.();
    this.game.events.emit('stage-clear', {
      score: this.score,
      elapsedMs: this.elapsedMs,
    });
  }

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;
    if (this.timerEvent) this.timerEvent.remove();
    this.elapsedMs = this.time.now - this.startTime;

    this.gameConfig?.onGameOver?.();
    this.game.events.emit('game-over', {
      score: this.score,
      elapsedMs: this.elapsedMs,
    });
  }

  // ─── EMITTERS ──────────────────────────────────────────

  private emitItemFound(): void {
    const foundTypes = this.itemDataList
      .filter((d) => d.isTarget && d.found)
      .map((d) => d.type);

    this.game.events.emit('item-found', {
      foundCount: this.foundCount,
      targetCount: this.stageConfig.targetCount,
      score: this.score,
      foundTypes,
    });
  }

  private emitTargetTypes(): void {
    this.game.events.emit('target-types', {
      targetTypes: this.targetTypes,
    });
  }

  // ─── CLEANUP ──────────────────────────────────────────

  shutdown(): void {
    this.tweens.killAll();
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = undefined;
    }
    this.itemObjects = [];
    this.itemDataList = [];
  }
}
