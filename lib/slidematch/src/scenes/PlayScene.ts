/**
 * PlayScene for SlidingMatch
 *
 * Sliding puzzle + match-3 hybrid. Player swipes to slide entire rows/columns.
 * Phaser handles the tile board. HUD is handled by React.
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
  slideRowLeft,
  slideRowRight,
  slideColUp,
  slideColDown,
  undoSlide,
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
  private movesLeft: number = 0;
  private movesUsed: number = 0;

  // Visual grid
  private tileGrid: (Tile | null)[][] = [];
  private tileSize: number = 48;
  private boardStartX: number = 0;
  private boardStartY: number = 0;

  // Swipe tracking
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isDragging: boolean = false;

  // BGM
  private bgm?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number; gameConfig?: GameConfig }): void {
    this.stageNum = data?.stage ?? 1;
    this.gameConfig = data?.gameConfig ?? this.game.registry.get('slidematchConfig');
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
    this.movesUsed = 0;
    this.isDragging = false;

    // Load stage
    this.stageConfig = getStageConfig(this.stageNum);
    this.movesLeft = this.stageConfig.maxMoves;

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
      }
    }

    // Global swipe input (anywhere on the board)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== GamePhase.PLAYING) return;
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.phase !== GamePhase.PLAYING) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const threshold = this.tileSize * 0.4;

      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      this.isDragging = false;

      // Determine which row/col to slide based on drag start position
      const gridPos = this.pixelToGrid(this.dragStartX, this.dragStartY);
      if (!gridPos) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal slide
        const direction = dx > 0 ? 'right' : 'left';
        this.trySlide(direction, gridPos.row);
      } else {
        // Vertical slide
        const direction = dy > 0 ? 'down' : 'up';
        this.trySlide(direction, gridPos.col);
      }
    });

    // Emit initial state
    this.emitMoves();
    this.emitScore();

    // BGM — stop any existing instance before creating new one
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
    }
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

  private pixelToGrid(px: number, py: number): CellPos | null {
    const col = Math.floor((px - this.boardStartX + this.tileSize / 2) / this.tileSize);
    const row = Math.floor((py - this.boardStartY + this.tileSize / 2) / this.tileSize);

    if (row < 0 || row >= this.stageConfig.rows || col < 0 || col >= this.stageConfig.cols) {
      return null;
    }

    return { row, col };
  }

  // ─── SLIDE + MATCH ─────────────────────────────────

  private async trySlide(
    direction: 'left' | 'right' | 'up' | 'down',
    index: number,
  ): Promise<void> {
    if (this.phase !== GamePhase.PLAYING) return;
    this.phase = GamePhase.ANIMATING;

    // Perform slide on data
    this.applySlide(direction, index);

    // Animate tiles to new positions
    await this.animateSlideVisuals(direction, index);

    // Check for matches
    const matches = findAllMatches(this.board);

    if (matches.length === 0) {
      // No match — undo slide
      undoSlide(this.board, direction, index);
      await this.animateUndoVisuals(direction, index);
      this.phase = GamePhase.PLAYING;
      return;
    }

    // Valid slide — consume a move
    this.movesLeft--;
    this.movesUsed++;
    this.combo = 0;
    this.emitMoves();

    // Process matches + cascade
    await this.processMatches(matches);

    // Check game state
    if (this.score >= this.stageConfig.targetScore) {
      this.stageClear();
    } else if (this.movesLeft <= 0) {
      this.gameOver();
    } else {
      this.phase = GamePhase.PLAYING;
    }
  }

  private applySlide(direction: 'left' | 'right' | 'up' | 'down', index: number): void {
    switch (direction) {
      case 'left':
        slideRowLeft(this.board, index);
        break;
      case 'right':
        slideRowRight(this.board, index);
        break;
      case 'up':
        slideColUp(this.board, index);
        break;
      case 'down':
        slideColDown(this.board, index);
        break;
    }
  }

  /**
   * Slide the tile grid references to match the board data.
   * We directly rotate the tile array (same as the board logic),
   * then animate each tile to its new grid position.
   */
  private async animateSlideVisuals(
    direction: 'left' | 'right' | 'up' | 'down',
    index: number,
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    if (direction === 'left') {
      const row = index;
      const first = this.tileGrid[row][0];
      for (let c = 0; c < this.stageConfig.cols - 1; c++) {
        this.tileGrid[row][c] = this.tileGrid[row][c + 1];
      }
      this.tileGrid[row][this.stageConfig.cols - 1] = first;
    } else if (direction === 'right') {
      const row = index;
      const last = this.tileGrid[row][this.stageConfig.cols - 1];
      for (let c = this.stageConfig.cols - 1; c > 0; c--) {
        this.tileGrid[row][c] = this.tileGrid[row][c - 1];
      }
      this.tileGrid[row][0] = last;
    } else if (direction === 'up') {
      const col = index;
      const first = this.tileGrid[0][col];
      for (let r = 0; r < this.stageConfig.rows - 1; r++) {
        this.tileGrid[r][col] = this.tileGrid[r + 1][col];
      }
      this.tileGrid[this.stageConfig.rows - 1][col] = first;
    } else {
      // down
      const col = index;
      const last = this.tileGrid[this.stageConfig.rows - 1][col];
      for (let r = this.stageConfig.rows - 1; r > 0; r--) {
        this.tileGrid[r][col] = this.tileGrid[r - 1][col];
      }
      this.tileGrid[0][col] = last;
    }

    // Animate all affected tiles to their new grid positions
    if (direction === 'left' || direction === 'right') {
      const row = index;
      for (let c = 0; c < this.stageConfig.cols; c++) {
        const tile = this.tileGrid[row][c];
        if (tile) {
          tile.gridRow = row;
          tile.gridCol = c;
          const pos = this.gridToPixel(row, c);
          promises.push(
            new Promise<void>((res) => tile.animateSlide(pos.x, pos.y, () => res())),
          );
        }
      }
    } else {
      const col = index;
      for (let r = 0; r < this.stageConfig.rows; r++) {
        const tile = this.tileGrid[r][col];
        if (tile) {
          tile.gridRow = r;
          tile.gridCol = col;
          const pos = this.gridToPixel(r, col);
          promises.push(
            new Promise<void>((res) => tile.animateSlide(pos.x, pos.y, () => res())),
          );
        }
      }
    }

    await Promise.all(promises);
  }

  /**
   * Undo: reverse-rotate the tile grid references and animate back.
   */
  private async animateUndoVisuals(
    direction: 'left' | 'right' | 'up' | 'down',
    index: number,
  ): Promise<void> {
    // Reverse rotation on the visual grid
    const reverseDir: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      left: 'right',
      right: 'left',
      up: 'down',
      down: 'up',
    };
    await this.animateSlideVisuals(reverseDir[direction], index);
  }

  // ─── MATCH PROCESSING ─────────────────────────────────

  private static readonly MAX_CASCADE_DEPTH = 10;

  private async processMatches(matches: CellPos[][], depth: number = 0): Promise<void> {
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

    // Animate destroy — set tileGrid to null first, then animate
    const destroyPromises = allCells.map(
      ({ row, col }) =>
        new Promise<void>((res) => {
          const tile = this.tileGrid[row][col];
          this.tileGrid[row][col] = null;
          if (tile) {
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

    // Remove from data
    removeCells(this.board, allCells);

    // Gravity — process moves bottom-to-top per column to avoid overwriting
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
      tile.animateSpawn();
    }

    // Wait for spawn animation
    await this.delay(300);

    // Check for cascade (with depth limit to prevent infinite loops)
    if (depth < PlayScene.MAX_CASCADE_DEPTH) {
      const newMatches = findAllMatches(this.board);
      if (newMatches.length > 0) {
        await this.processMatches(newMatches, depth + 1);
      }
    }
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
