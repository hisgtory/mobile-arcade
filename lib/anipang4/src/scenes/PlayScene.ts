/**
 * PlayScene for Anipang4
 *
 * Time-based match-3 game (vs Crunch3's move-based approach).
 * Phaser handles the tile board. HUD is handled by React.
 *
 * Events emitted:
 *   'score-update'  — { score, combo }
 *   'time-update'   — { timeLeft, maxTime }
 *   'stage-clear'   — { score, timeUsed }
 *   'game-over'     — { score }
 */

import Phaser from 'phaser';
import { getStageConfig } from '../logic/stage';
import {
  createBoard,
  swap,
  findAllMatches,
  removeCells,
  applyGravity,
  fillEmpty,
  calcMatchScore,
  type Board,
} from '../logic/board';
import { Tile } from '../objects/Tile';
import { GamePhase, TILE_IMAGES, type GameConfig, type StageConfig, type CellPos } from '../types';

export class PlayScene extends Phaser.Scene {
  private stageNum: number = 1;
  private stageConfig!: StageConfig;
  private gameConfig?: GameConfig;

  // Game state
  private phase: GamePhase = GamePhase.IDLE;
  private board!: Board;
  private score: number = 0;
  private combo: number = 0;
  private timeLeft: number = 60;
  private timerEvent?: Phaser.Time.TimerEvent;

  // Visual grid
  private tileGrid: (Tile | null)[][] = [];
  private tileSize: number = 48;
  private boardStartX: number = 0;
  private boardStartY: number = 0;

  // Swipe tracking
  private selectedTile: Tile | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  // BGM
  private bgm?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number }): void {
    // TODO: Use Phaser registry or scene data for better type safety
    const gameConfig = this.game.registry.get('anipang4Config') as GameConfig;
    this.stageNum = data?.stage ?? gameConfig?.stage ?? 1;
    this.gameConfig = gameConfig;
  }

  preload(): void {
    const base = '/assets/';
    for (const key of TILE_IMAGES) {
      this.load.image(key, `${base}tiles/${key}.png`);
    }
    this.load.audio('bgm1', `${base}audio/Spring_Loaded_Scoundrel.mp3`);
  }

  create(): void {
    const dpr = this.game.registry.get('dpr') || 1;
    const { width, height } = this.scale;

    // Reset state
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.combo = 0;
    this.selectedTile = null;

    // Load stage
    this.stageConfig = getStageConfig(this.stageNum);
    this.timeLeft = this.stageConfig.timeLimit;

    // Background
    this.cameras.main.setBackgroundColor('#f0f2f5');

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
    this.emitTime();
    this.emitScore();

    // Start countdown timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });

    // Stop existing BGM if any
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
      this.bgm = undefined;
    }

    // BGM
    this.bgm = this.sound.add('bgm1', { loop: true, volume: 0.25 });
    this.bgm.play();

    this.events.on('shutdown', this.shutdown, this);

    this.input.once('pointerdown', () => {
      if ((this.sound as Phaser.Sound.WebAudioSoundManager).context?.state === 'suspended') {
        (this.sound as Phaser.Sound.WebAudioSoundManager).context.resume();
      }
    });
  }

  // ─── TIMER ──────────────────────────────────────────────

  private onTimerTick(): void {
    if (this.phase !== GamePhase.PLAYING && this.phase !== GamePhase.ANIMATING) return;

    this.timeLeft--;
    this.emitTime();

    if (this.timeLeft <= 0) {
      this.timerEvent?.remove();
      // Check if target reached
      if (this.score >= this.stageConfig.targetScore) {
        this.stageClear();
      } else {
        this.gameOver();
      }
    }
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
    tile.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== GamePhase.PLAYING) return;
      this.selectedTile = tile;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    });

    tile.on('pointerup', () => {
      this.selectedTile = null;
    });

    tile.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedTile || this.phase !== GamePhase.PLAYING) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const threshold = this.tileSize * 0.3;

      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      // Determine swipe direction
      let targetRow = this.selectedTile.gridRow;
      let targetCol = this.selectedTile.gridCol;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetCol += dx > 0 ? 1 : -1;
      } else {
        targetRow += dy > 0 ? 1 : -1;
      }

      // Validate target
      if (
        targetRow < 0 || targetRow >= this.stageConfig.rows ||
        targetCol < 0 || targetCol >= this.stageConfig.cols
      ) {
        this.selectedTile = null;
        return;
      }

      const fromPos: CellPos = { row: this.selectedTile.gridRow, col: this.selectedTile.gridCol };
      const toPos: CellPos = { row: targetRow, col: targetCol };

      this.selectedTile = null;
      this.trySwap(fromPos, toPos);
    });
  }

  // ─── SWAP + MATCH LOOP ─────────────────────────────────

  private async trySwap(a: CellPos, b: CellPos): Promise<void> {
    if (this.phase !== GamePhase.PLAYING) return;
    this.phase = GamePhase.ANIMATING;

    const tileA = this.tileGrid[a.row][a.col]!;
    const tileB = this.tileGrid[b.row][b.col]!;

    // Animate swap
    const posA = this.gridToPixel(a.row, a.col);
    const posB = this.gridToPixel(b.row, b.col);

    await Promise.all([
      new Promise<void>((res) => tileA.animateSwap(posB.x, posB.y, () => res())),
      new Promise<void>((res) => tileB.animateSwap(posA.x, posA.y, () => res())),
    ]);

    // Swap in data
    swap(this.board, a, b);
    this.tileGrid[a.row][a.col] = tileB;
    this.tileGrid[b.row][b.col] = tileA;
    tileA.gridRow = b.row;
    tileA.gridCol = b.col;
    tileB.gridRow = a.row;
    tileB.gridCol = a.col;

    // Check for matches
    const matches = findAllMatches(this.board);

    if (matches.length === 0) {
      // No match — swap back
      await Promise.all([
        new Promise<void>((res) => tileA.animateSwap(posA.x, posA.y, () => res())),
        new Promise<void>((res) => tileB.animateSwap(posB.x, posB.y, () => res())),
      ]);
      swap(this.board, a, b);
      this.tileGrid[a.row][a.col] = tileA;
      this.tileGrid[b.row][b.col] = tileB;
      tileA.gridRow = a.row;
      tileA.gridCol = a.col;
      tileB.gridRow = b.row;
      tileB.gridCol = b.col;

      this.phase = GamePhase.PLAYING;
      return;
    }

    // Valid swap — reset combo for this chain
    this.combo = 0;

    // Process matches + cascade
    await this.processMatches(matches);

    // Check if target reached early (clear before time runs out)
    if (this.score >= this.stageConfig.targetScore && this.timeLeft > 0) {
      if (this.timerEvent) {
        this.timerEvent.remove();
        this.timerEvent = undefined;
      }
      this.stageClear();
    } else if (this.timeLeft > 0) {
      this.phase = GamePhase.PLAYING;
    }
  }

  private async processMatches(matches: CellPos[][]): Promise<void> {
    // Remove matched tiles
    const allCells: CellPos[] = [];
    for (const group of matches) {
      this.combo++;
      const groupScore = calcMatchScore(group.length, this.combo);
      this.score += groupScore;

      for (const cell of group) {
        if (!allCells.some((c) => c.row === cell.row && c.col === cell.col)) {
          allCells.push(cell);
        }
      }
    }

    this.emitScore();

    // Remove from data immediately to stay in sync
    removeCells(this.board, allCells);

    // Animate destroy
    const destroyPromises = allCells.map(
      ({ row, col }) =>
        new Promise<void>((res) => {
          const tile = this.tileGrid[row][col];
          if (tile) {
            this.tileGrid[row][col] = null;
            tile.animateDestroy(() => {
              tile.destroy();
              res();
            });
          } else {
            res();
          }
        }),
    );
    await Promise.all(destroyPromises);

    // Gravity
    const gravityMoves = applyGravity(this.board);

    // Animate gravity - process in order to ensure tileGrid consistency
    const gravityPromises: Promise<void>[] = [];
    for (const { from, to } of gravityMoves) {
      const item = this.tileGrid[from.row][from.col];
      if (item) {
        this.tileGrid[from.row][from.col] = null;
        this.tileGrid[to.row][to.col] = item;
        item.gridRow = to.row;
        item.gridCol = to.col;
        const pos = this.gridToPixel(to.row, to.col);
        gravityPromises.push(new Promise<void>((res) => item.animateMoveTo(pos.x, pos.y, () => res())));
      }
    }
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

    // Check for cascade
    const newMatches = findAllMatches(this.board);
    if (newMatches.length > 0) {
      await this.processMatches(newMatches);
    }
  }

  // ─── GAME FLOW ──────────────────────────────────────────

  private stageClear(): void {
    this.phase = GamePhase.CLEAR;
    this.gameConfig?.onClear?.();
    this.game.events.emit('stage-clear', {
      score: this.score,
      timeUsed: this.stageConfig.timeLimit - this.timeLeft,
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

  private emitTime(): void {
    this.game.events.emit('time-update', {
      timeLeft: this.timeLeft,
      maxTime: this.stageConfig.timeLimit,
    });
  }

  // ─── UTILS ──────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise((res) => this.time.delayedCall(ms, () => res()));
  }

  shutdown(): void {
    this.tweens.killAll();
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = undefined;
    }
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
      this.bgm = undefined;
    }
    this.tileGrid = [];
  }
}
