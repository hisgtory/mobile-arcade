/**
 * PlayScene for ForestPop
 *
 * Tap-to-pop mechanic: tap on connected groups of 3+ same tiles to pop them.
 *
 * Events emitted:
 *   'score-update'  — { score, combo }
 *   'moves-update'  — { movesLeft, maxMoves }
 *   'stage-clear'   — { score, movesUsed }
 *   'game-over'     — { score }
 */

import Phaser from 'phaser';
import { getStageConfig } from '../logic/stage';
import {
  createBoard,
  findGroup,
  findConnectedGroups,
  removeCells,
  applyGravity,
  fillEmpty,
  calcPopScore,
  type Board,
} from '../logic/board';
import { Tile } from '../objects/Tile';
import { GamePhase, TILE_IMAGES, type GameConfig, type StageConfig, type CellPos } from '../types';

const MIN_GROUP_SIZE = 3;

export class PlayScene extends Phaser.Scene {
  private stageNum: number = 1;
  private stageConfig!: StageConfig;
  private gameConfig?: GameConfig;

  // Game state
  private phase: GamePhase = GamePhase.IDLE;
  private board!: Board;
  private score: number = 0;
  private combo: number = 0;
  private movesLeft: number = 0;
  private movesUsed: number = 0;

  // Visual grid
  private tileGrid: (Tile | null)[][] = [];
  private tileSize: number = 48;
  private boardStartX: number = 0;
  private boardStartY: number = 0;

  // Hover highlight
  private highlightedGroup: CellPos[] = [];

  // BGM
  private bgm?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number; gameConfig?: GameConfig }): void {
    this.stageNum = data?.stage ?? 1;
    this.gameConfig = data?.gameConfig ?? (this.game as any).__forestpopConfig;
  }

  preload(): void {
    const base = '/assets/';
    for (const key of TILE_IMAGES) {
      this.load.image(key, `${base}tiles/${key}.png`);
    }
    this.load.audio('bgm1', `${base}audio/Spring_Loaded_Scoundrel.mp3`);
  }

  create(): void {
    const dpr = (this.game as any).__dpr || 1;
    const { width, height } = this.scale;

    // Reset state
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.combo = 0;
    this.movesUsed = 0;
    this.highlightedGroup = [];

    // Load stage
    this.stageConfig = getStageConfig(this.stageNum);
    this.movesLeft = this.stageConfig.maxMoves;

    // Forest-themed background
    this.cameras.main.setBackgroundColor('#e8f5e9');

    // Calculate tile size to fit board
    const padding = 20 * dpr;
    const boardW = width - padding * 2;
    const boardH = height - padding * 2;
    this.tileSize = Math.floor(
      Math.min(
        boardW / this.stageConfig.cols,
        boardH / this.stageConfig.rows,
        70 * dpr,
      ),
    );

    // Center the board
    const totalW = this.stageConfig.cols * this.tileSize;
    const totalH = this.stageConfig.rows * this.tileSize;
    this.boardStartX = (width - totalW) / 2 + this.tileSize / 2;
    this.boardStartY = (height - totalH) / 2 + this.tileSize / 2;

    // Create board data
    this.board = createBoard(this.stageConfig);

    // Create tile visuals
    this.tileGrid = [];
    for (let r = 0; r < this.stageConfig.rows; r++) {
      this.tileGrid[r] = [];
      for (let c = 0; c < this.stageConfig.cols; c++) {
        const { x, y } = this.gridToPixel(r, c);
        const tile = new Tile(this, x, y, this.board[r][c], r, c, this.tileSize);
        this.tileGrid[r][c] = tile;
        this.setupTileInput(tile);
      }
    }

    // Emit initial state
    this.emitMoves();
    this.emitScore();

    // BGM
    this.bgm = this.sound.add('bgm1', { loop: true, volume: 0.25 });
    this.bgm.play();

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

  // ─── INPUT ──────────────────────────────────────────────

  private setupTileInput(tile: Tile): void {
    tile.on('pointerover', () => {
      if (this.phase !== GamePhase.PLAYING) return;
      this.showGroupHighlight({ row: tile.gridRow, col: tile.gridCol });
    });

    tile.on('pointerout', () => {
      this.clearHighlight();
    });

    tile.on('pointerdown', () => {
      if (this.phase !== GamePhase.PLAYING) return;
      this.tryPop({ row: tile.gridRow, col: tile.gridCol });
    });
  }

  private showGroupHighlight(cell: CellPos): void {
    this.clearHighlight();
    const group = findGroup(this.board, cell);
    if (group.length >= MIN_GROUP_SIZE) {
      this.highlightedGroup = group;
      for (const { row, col } of group) {
        this.tileGrid[row]?.[col]?.highlight(true);
      }
    }
  }

  private clearHighlight(): void {
    for (const { row, col } of this.highlightedGroup) {
      this.tileGrid[row]?.[col]?.highlight(false);
    }
    this.highlightedGroup = [];
  }

  // ─── TAP-TO-POP LOOP ─────────────────────────────────

  private async tryPop(cell: CellPos): Promise<void> {
    if (this.phase !== GamePhase.PLAYING) return;

    const group = findGroup(this.board, cell);
    if (group.length < MIN_GROUP_SIZE) return;

    this.phase = GamePhase.ANIMATING;
    this.clearHighlight();

    // Consume a move
    this.movesLeft--;
    this.movesUsed++;
    this.combo = 0;
    this.emitMoves();

    // Process the pop + cascade
    await this.processPopGroup(group);

    // Auto-cascade: check for any new groups formed
    let cascadeGroups = findConnectedGroups(this.board, MIN_GROUP_SIZE);
    while (cascadeGroups.length > 0) {
      for (const g of cascadeGroups) {
        await this.processPopGroup(g);
      }
      cascadeGroups = findConnectedGroups(this.board, MIN_GROUP_SIZE);
    }

    // Check game state
    if (this.score >= this.stageConfig.targetScore) {
      this.stageClear();
    } else if (this.movesLeft <= 0) {
      this.gameOver();
    } else {
      this.phase = GamePhase.PLAYING;
    }
  }

  private async processPopGroup(group: CellPos[]): Promise<void> {
    this.combo++;
    const groupScore = calcPopScore(group.length, this.combo);
    this.score += groupScore;
    this.emitScore();

    // Animate destroy
    const destroyPromises = group.map(
      ({ row, col }) =>
        new Promise<void>((res) => {
          const tile = this.tileGrid[row][col];
          if (tile) {
            tile.animateDestroy(() => {
              tile.destroy();
              this.tileGrid[row][col] = null;
              res();
            });
          } else {
            res();
          }
        }),
    );
    await Promise.all(destroyPromises);

    // Remove from data
    removeCells(this.board, group);

    // Gravity
    const gravityMoves = applyGravity(this.board);

    // Animate gravity
    const gravityPromises = gravityMoves.map(({ from, to }) => {
      const tile = this.tileGrid[from.row][from.col];
      if (tile) {
        this.tileGrid[from.row][from.col] = null;
        this.tileGrid[to.row][to.col] = tile;
        tile.gridRow = to.row;
        tile.gridCol = to.col;
        const pos = this.gridToPixel(to.row, to.col);
        return new Promise<void>((res) => tile.animateMoveTo(pos.x, pos.y, () => res()));
      }
      return Promise.resolve();
    });
    await Promise.all(gravityPromises);

    // Fill empty
    const filled = fillEmpty(this.board, this.stageConfig.typeCount);
    for (const { row, col } of filled) {
      const pos = this.gridToPixel(row, col);
      const tile = new Tile(this, pos.x, pos.y, this.board[row][col], row, col, this.tileSize);
      this.tileGrid[row][col] = tile;
      this.setupTileInput(tile);
      tile.animateSpawn();
    }

    // Wait for spawn animation
    await this.delay(300);
  }

  // ─── GAME FLOW ──────────────────────────────────────────

  private stageClear(): void {
    this.phase = GamePhase.CLEAR;
    this.gameConfig?.onClear?.();
    this.game.events.emit('stage-clear', {
      score: this.score,
      movesUsed: this.movesUsed,
    });
  }

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;
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

  private emitMoves(): void {
    this.game.events.emit('moves-update', {
      movesLeft: this.movesLeft,
      maxMoves: this.stageConfig.maxMoves,
    });
  }

  // ─── UTILS ──────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise((res) => this.time.delayedCall(ms, () => res()));
  }

  shutdown(): void {
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
      this.bgm = undefined;
    }
    this.tileGrid = [];
  }
}
