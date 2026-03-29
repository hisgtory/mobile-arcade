/**
 * PlayScene for Puzzle3Go (퍼즐쓰리고)
 *
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
  swap,
  findAllMatches,
  removeCells,
  applyGravity,
  fillEmpty,
  calcMatchScore,
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

  // Swipe tracking
  private selectedTile: Tile | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number; gameConfig?: GameConfig }): void {
    this.stageNum = data?.stage ?? 1;
    this.gameConfig = data?.gameConfig ?? (this.game as any).__puzzle3goConfig;
  }

  create(): void {
    const dpr = (this.game as any).__dpr || 1;
    const { width, height } = this.scale;

    // Reset state
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.combo = 0;
    this.movesUsed = 0;
    this.selectedTile = null;

    // Load stage
    this.stageConfig = getStageConfig(this.stageNum);
    this.movesLeft = this.stageConfig.maxMoves;

    // Background — 화투 테마 (warm ivory)
    this.cameras.main.setBackgroundColor('#faf3e0');

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

    // Valid swap — consume a move
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

    // Animate destroy
    const destroyPromises = allCells.map(
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
    removeCells(this.board, allCells);

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
  }
}
