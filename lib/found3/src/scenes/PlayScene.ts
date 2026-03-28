/**
 * PlayScene for found3
 *
 * Phaser handles ONLY the tile board rendering and interaction.
 * HUD, slot bar, item bar, title, and clear screens are handled by React.
 *
 * Events emitted (React listens via game.events.on):
 *   'tile-selected'  — { slotItems, remainingTiles, totalTiles, score, combo }
 *   'slot-matched'   — { slotItems, score, combo }
 *   'slot-full'      — (game over trigger)
 *   'stage-clear'    — { score, elapsedMs }
 *   'game-over'      — { score, elapsedMs }
 *   'time-update'    — { elapsedMs }
 *
 * Public methods (React calls):
 *   doShuffle(), doUndo(), doMagnet()
 */

import Phaser from 'phaser';
import { getStageConfig } from '../logic/stage';
import { generateBoard, getBoardLayout, gridToPixel, resetIdCounter } from '../logic/board';
import { addToSlotAndMatch } from '../logic/matcher';
import { Tile } from '../objects/Tile';
import {
  SlotItem,
  GamePhase,
  GameConfig,
  StageConfig,
  ItemCounts,
  UndoEntry,
  DEFAULT_ITEM_COUNTS,
  TILE_IMAGES,
} from '../types';

const BASE_TILE_GAP_RATIO = 0.08;

export class PlayScene extends Phaser.Scene {
  private stageNum: number = 1;
  private stageConfig!: StageConfig;
  private gameConfig?: GameConfig;

  // Game state
  private phase: GamePhase = GamePhase.IDLE;
  private score: number = 0;
  private combo: number = 0;
  private slotItems: SlotItem[] = [];
  private remainingTiles: number = 0;
  private totalTiles: number = 0;
  private elapsedMs: number = 0;

  // Item state
  private itemCounts!: ItemCounts;
  private undoHistory: UndoEntry[] = [];

  // Game objects
  private tiles: Tile[] = [];

  // BGM
  private bgm?: Phaser.Sound.BaseSound;

  // Lock to prevent rapid-fire clicks during animations
  private inputLocked: boolean = false;

  // Dynamically computed tile size
  private tileSize: number = 56;
  private tileGap: number = 6;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number; gameConfig?: GameConfig }): void {
    this.stageNum = data?.stage ?? 1;
    this.gameConfig = data?.gameConfig ?? (this.game as any).__found3Config;
  }

  preload(): void {
    // Use absolute path to avoid issues with nested routes like /stage/:id
    const base = '/games/found3/v1/';
    for (const key of TILE_IMAGES) {
      this.load.image(key, `${base}assets/tiles/${key}.png`);
    }
    this.load.audio('bgm1', `${base}assets/audio/Spring_Loaded_Scoundrel.mp3`);
    this.load.audio('bgm2', `${base}assets/audio/Spring_Loaded_Waltz.mp3`);
  }

  create(): void {
    const dpr = (this.game as any).__dpr || 1;
    const { width, height } = this.scale;
    const centerX = width / 2;

    // Reset state
    resetIdCounter();
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.combo = 0;
    this.slotItems = [];
    this.inputLocked = false;
    this.tiles = [];
    this.undoHistory = [];
    this.itemCounts = { ...DEFAULT_ITEM_COUNTS };
    this.elapsedMs = 0;

    // Load stage config
    this.stageConfig = getStageConfig(this.stageNum);
    this.remainingTiles = this.stageConfig.tileCount;
    this.totalTiles = this.stageConfig.tileCount;

    // Board uses full canvas with small padding
    const padding = 20 * dpr;
    const boardAvailH = height - padding * 2;
    const boardAvailW = width - padding * 2;

    const extraOffset = (this.stageConfig.layers - 1) * 0.5;
    const effectiveCols = this.stageConfig.cols + extraOffset;
    const effectiveRows = this.stageConfig.rows + extraOffset;

    const maxTileW = boardAvailW / (effectiveCols + (effectiveCols - 1) * BASE_TILE_GAP_RATIO);
    const maxTileH = boardAvailH / (effectiveRows + (effectiveRows - 1) * BASE_TILE_GAP_RATIO);
    const maxCap = 70 * dpr;
    this.tileSize = Math.floor(Math.min(maxTileW, maxTileH, maxCap));
    this.tileGap = Math.floor(this.tileSize * BASE_TILE_GAP_RATIO);

    // Background
    this.cameras.main.setBackgroundColor('#f0f2f5');

    // Create board
    this._createBoard(dpr, centerX);

    // Initial selectability
    this._updateSelectability();

    // BGM — pick a random track and loop
    const bgmKey = Math.random() > 0.5 ? 'bgm1' : 'bgm2';
    this.bgm = this.sound.add(bgmKey, { loop: true, volume: 0.3 });
    this.bgm.play();

    // Mobile AudioContext resume on first touch
    this.input.once('pointerdown', () => {
      if ((this.sound as Phaser.Sound.WebAudioSoundManager).context?.state === 'suspended') {
        (this.sound as Phaser.Sound.WebAudioSoundManager).context.resume();
      }
    });
  }

  update(_time: number, delta: number): void {
    if (this.phase === GamePhase.PLAYING) {
      this.elapsedMs += delta;
      this.game.events.emit('time-update', { elapsedMs: this.elapsedMs });
    }
  }

  // ─── BOARD ─────────────────────────────────────────────────

  private _createBoard(dpr: number, centerX: number): void {
    const { height } = this.scale;
    const boardCenterY = height / 2;

    const layout = getBoardLayout(
      this.stageConfig,
      this.tileSize,
      this.tileGap,
      centerX,
      boardCenterY,
    );

    const boardData = generateBoard(this.stageConfig);

    for (const td of boardData) {
      const pos = gridToPixel(
        td.col,
        td.row,
        layout.tileSize,
        layout.gap,
        layout.startX,
        layout.startY,
      );

      const tile = new Tile(this, pos.x, pos.y, td, this.tileSize);
      tile.on('pointerdown', () => this._onTileSelect(tile));
      this.tiles.push(tile);
    }
  }

  // ─── TILE SELECTION ────────────────────────────────────────

  private _updateSelectability(): void {
    const step = this.tileSize + this.tileGap;

    for (const tile of this.tiles) {
      const tLayer = tile.tileData.layer;
      const tCol = tile.tileData.col;
      const tRow = tile.tileData.row;

      const tLeft = tCol * step;
      const tRight = tLeft + this.tileSize;
      const tTop = tRow * step;
      const tBottom = tTop + this.tileSize;

      let blocked = false;

      for (const other of this.tiles) {
        if (other === tile) continue;
        if (other.tileData.layer <= tLayer) continue;

        const oCol = other.tileData.col;
        const oRow = other.tileData.row;
        const oLeft = oCol * step;
        const oRight = oLeft + this.tileSize;
        const oTop = oRow * step;
        const oBottom = oTop + this.tileSize;

        const margin = this.tileSize * 0.1;
        if (
          tLeft < oRight - margin &&
          tRight > oLeft + margin &&
          tTop < oBottom - margin &&
          tBottom > oTop + margin
        ) {
          blocked = true;
          break;
        }
      }

      tile.setSelectable(!blocked);
    }
  }

  private _onTileSelect(tile: Tile): void {
    if (this.phase !== GamePhase.PLAYING) return;
    if (this.inputLocked) return;
    if (!tile.isSelectable) return;

    this.inputLocked = true;

    const slotItem: SlotItem = {
      id: tile.tileData.id,
      type: tile.tileData.type,
    };

    // Save undo entry before removing
    this.undoHistory.push({
      slotItem,
      tileData: { ...tile.tileData },
      x: tile.x,
      y: tile.y,
    });

    // Animate tile removal from board
    tile.setSelectable(false);
    tile.removeInteractive();

    tile.animateSelect(() => {
      tile.destroy();
      this.tiles = this.tiles.filter((t) => t !== tile);

      this._updateSelectability();

      const result = addToSlotAndMatch(this.slotItems, slotItem);
      this.slotItems = result.slotItems;
      this.remainingTiles--;

      if (result.matched) {
        this.combo++;
        this.score += 100 * this.combo;
        this.undoHistory = [];

        this.game.events.emit('slot-matched', {
          slotItems: [...this.slotItems],
          score: this.score,
          combo: this.combo,
        });

        this._checkWinCondition();
        this.inputLocked = false;
      } else {
        this.combo = 0;

        this.game.events.emit('tile-selected', {
          slotItems: [...this.slotItems],
          remainingTiles: this.remainingTiles,
          totalTiles: this.totalTiles,
          score: this.score,
          combo: this.combo,
        });

        if (result.slotFull) {
          this._gameOver();
          return;
        }

        this._checkWinCondition();
        this.inputLocked = false;
      }
    });
  }

  // ─── PUBLIC ITEM ACTIONS (called by React) ─────────────────

  public doShuffle(): void {
    if (this.inputLocked) return;
    if (this.phase !== GamePhase.PLAYING) return;
    if (this.tiles.length === 0) return;

    this.inputLocked = true;

    const tileTypes = this.tiles.map((t) => t.tileData.type);

    for (let i = tileTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileTypes[i], tileTypes[j]] = [tileTypes[j], tileTypes[i]];
    }

    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      tile.tileData.type = tileTypes[i];
      tile.updateVisual();
    }

    this.cameras.main.flash(200, 255, 255, 255, false, undefined, this);
    this.undoHistory = [];

    this.time.delayedCall(250, () => {
      this.inputLocked = false;
    });
  }

  public doUndo(): void {
    if (this.inputLocked) return;
    if (this.phase !== GamePhase.PLAYING) return;
    if (this.undoHistory.length === 0) return;

    this.inputLocked = true;

    const entry = this.undoHistory.pop()!;

    const idx = this.slotItems.findIndex((s) => s.id === entry.slotItem.id);
    if (idx >= 0) {
      this.slotItems.splice(idx, 1);
    }

    const tile = new Tile(this, entry.x, entry.y, entry.tileData, this.tileSize);
    tile.on('pointerdown', () => this._onTileSelect(tile));
    this.tiles.push(tile);

    tile.setScale(0.3);
    tile.setAlpha(0);
    this.tweens.add({
      targets: tile,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    this.remainingTiles++;
    this._updateSelectability();

    this.game.events.emit('tile-selected', {
      slotItems: [...this.slotItems],
      remainingTiles: this.remainingTiles,
      totalTiles: this.totalTiles,
      score: this.score,
      combo: this.combo,
    });

    this.time.delayedCall(250, () => {
      this.inputLocked = false;
    });
  }

  public doMagnet(): void {
    if (this.inputLocked) return;
    if (this.phase !== GamePhase.PLAYING) return;

    const selectableTiles = this.tiles.filter((t) => t.isSelectable);
    const typeMap = new Map<number, Tile[]>();
    for (const t of selectableTiles) {
      const arr = typeMap.get(t.tileData.type) || [];
      arr.push(t);
      typeMap.set(t.tileData.type, arr);
    }

    let hintTiles: Tile[] | null = null;
    for (const [, tiles] of typeMap) {
      if (tiles.length >= 3) {
        hintTiles = tiles.slice(0, 3);
        break;
      }
    }

    if (!hintTiles) {
      for (const [, tiles] of typeMap) {
        if (tiles.length >= 2) {
          hintTiles = tiles.slice(0, Math.min(3, tiles.length));
          break;
        }
      }
    }

    if (!hintTiles || hintTiles.length === 0) return;

    for (const t of hintTiles) {
      this.tweens.add({
        targets: t,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // ─── GAME FLOW ─────────────────────────────────────────────

  private _checkWinCondition(): void {
    if (this.remainingTiles <= 0) {
      this._stageClear();
    }
  }

  private _stageClear(): void {
    this.phase = GamePhase.CLEAR;
    this.score += 500;

    this.gameConfig?.onClear?.();

    this.game.events.emit('stage-clear', {
      score: this.score,
      elapsedMs: this.elapsedMs,
    });
  }

  private _gameOver(): void {
    this.phase = GamePhase.GAME_OVER;
    this.inputLocked = true;

    this.gameConfig?.onGameOver?.();

    this.game.events.emit('slot-full');
    this.game.events.emit('game-over', {
      score: this.score,
      elapsedMs: this.elapsedMs,
    });
  }

  shutdown(): void {
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
      this.bgm = undefined;
    }
    this.tiles = [];
    this.slotItems = [];
    this.undoHistory = [];
  }
}
