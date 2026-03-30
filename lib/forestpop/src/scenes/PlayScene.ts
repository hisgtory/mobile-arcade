/**
 * PlayScene for ForestPop
 *
 * Tap connected groups of same-type forest animals to pop them.
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
  findConnectedGroup,
  removeCells,
  applyGravity,
  fillEmpty,
  calcPopScore,
  hasValidMoves,
  type Board,
} from '../logic/board';
import { Tile } from '../objects/Tile';
import { GamePhase, type GameConfig, type StageConfig, type CellPos } from '../types';

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

  // Highlight tracking
  private highlightedCells: CellPos[] = [];

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number; gameConfig?: GameConfig }): void {
    this.stageNum = data?.stage ?? 1;
    this.gameConfig = data?.gameConfig ?? (this.game as any).__forestpopConfig;
  }

  create(): void {
    const dpr = (this.game as any).__dpr || 1;
    const { width, height } = this.scale;

    // Reset state
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.combo = 0;
    this.movesUsed = 0;
    this.highlightedCells = [];

    // Load stage
    this.stageConfig = getStageConfig(this.stageNum);
    this.movesLeft = this.stageConfig.maxMoves;

    // Background
    this.cameras.main.setBackgroundColor('#f0f9f4');

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
      this.showGroupHighlight(tile.gridRow, tile.gridCol);
    });

    tile.on('pointerout', () => {
      this.clearHighlight();
    });

    tile.on('pointerdown', () => {
      if (this.phase !== GamePhase.PLAYING) return;
      this.tryPop(tile.gridRow, tile.gridCol);
    });
  }

  private showGroupHighlight(row: number, col: number): void {
    this.clearHighlight();
    const group = findConnectedGroup(this.board, row, col);
    if (group.length >= this.stageConfig.minGroupSize) {
      this.highlightedCells = group;
      for (const cell of group) {
        const t = this.tileGrid[cell.row]?.[cell.col];
        if (t) t.highlight(true);
      }
    }
  }

  private clearHighlight(): void {
    for (const cell of this.highlightedCells) {
      const t = this.tileGrid[cell.row]?.[cell.col];
      if (t) t.highlight(false);
    }
    this.highlightedCells = [];
  }

  // ─── POP LOGIC ──────────────────────────────────────────

  private async tryPop(row: number, col: number): Promise<void> {
    if (this.phase !== GamePhase.PLAYING) return;

    const group = findConnectedGroup(this.board, row, col);
    if (group.length < this.stageConfig.minGroupSize) return;

    this.phase = GamePhase.ANIMATING;
    this.clearHighlight();

    // Consume a move and reset combo for this tap
    this.movesLeft--;
    this.movesUsed++;
    this.combo = 1;
    this.emitMoves();

    // Calculate score
    const popScore = calcPopScore(group.length, this.combo);
    this.score += popScore;
    this.emitScore();
    this.game.events.emit('group-popped');

    // Animate destroy
    const destroyPromises = group.map(
      ({ row: r, col: c }) =>
        new Promise<void>((res) => {
          const tile = this.tileGrid[r][c];
          if (tile) {
            tile.animateDestroy(() => {
              tile.destroy();
              this.tileGrid[r][c] = null;
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
    for (const { row: r, col: c } of filled) {
      const pos = this.gridToPixel(r, c);
      const tile = new Tile(this, pos.x, pos.y, this.board[r][c], r, c, this.tileSize);
      this.tileGrid[r][c] = tile;
      this.setupTileInput(tile);
      tile.animateSpawn();
    }

    // Wait for spawn animation
    await this.delay(300);

    // Check game state
    if (this.score >= this.stageConfig.targetScore) {
      this.stageClear();
    } else if (this.movesLeft <= 0) {
      this.gameOver();
    } else if (!hasValidMoves(this.board, this.stageConfig.minGroupSize)) {
      // No valid moves — reshuffle
      await this.reshuffleBoard();
      this.phase = GamePhase.PLAYING;
    } else {
      this.phase = GamePhase.PLAYING;
    }
  }

  private async reshuffleBoard(): Promise<void> {
    // Animate all tiles out
    const allTiles: Tile[] = [];
    for (let r = 0; r < this.stageConfig.rows; r++) {
      for (let c = 0; c < this.stageConfig.cols; c++) {
        const tile = this.tileGrid[r][c];
        if (tile) allTiles.push(tile);
      }
    }

    await Promise.all(
      allTiles.map(
        (tile) =>
          new Promise<void>((res) => {
            this.tweens.add({
              targets: tile,
              alpha: 0,
              duration: 150,
              onComplete: () => { tile.destroy(); res(); },
            });
          }),
      ),
    );

    // Recreate board
    this.board = createBoard(this.stageConfig);
    this.tileGrid = [];
    for (let r = 0; r < this.stageConfig.rows; r++) {
      this.tileGrid[r] = [];
      for (let c = 0; c < this.stageConfig.cols; c++) {
        const { x, y } = this.gridToPixel(r, c);
        const tile = new Tile(this, x, y, this.board[r][c], r, c, this.tileSize);
        this.tileGrid[r][c] = tile;
        this.setupTileInput(tile);
        tile.animateSpawn();
      }
    }

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
    this.tileGrid = [];
    this.highlightedCells = [];
  }
}
