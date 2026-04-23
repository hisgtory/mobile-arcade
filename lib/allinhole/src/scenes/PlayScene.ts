/**
 * PlayScene for All in Hole
 *
 * Phaser handles the board with balls, holes, and walls.
 * HUD is handled by React.
 *
 * Events emitted:
 *   'moves-update'  — { movesLeft, maxMoves }
 *   'balls-update'  — { remaining, total }
 *   'stage-clear'   — { movesUsed }
 *   'game-over'     — { movesUsed }
 */

import Phaser from 'phaser';
import { getStageConfig } from '../logic/stage';
import {
  createBoard,
  slideAll,
  allSunk,
  activeBallCount,
  type Grid,
} from '../logic/board';
import { Ball } from '../objects/Ball';
import { CellType, GamePhase, type GameConfig, type StageConfig, type BallData, type Direction } from '../types';

export class PlayScene extends Phaser.Scene {
  private stageNum: number = 1;
  private stageConfig!: StageConfig;
  private gameConfig?: GameConfig;

  // Game state
  private phase: GamePhase = GamePhase.IDLE;
  private grid!: Grid;
  private ballsData: BallData[] = [];
  private movesLeft: number = 0;
  private movesUsed: number = 0;

  // Visual
  private ballObjects: Map<number, Ball> = new Map();
  private cellSize: number = 48;
  private boardStartX: number = 0;
  private boardStartY: number = 0;

  // Swipe tracking
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isDragging: boolean = false;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number }): void {
    // TODO: Use Phaser registry or scene data for better type safety
    const gameConfig = this.game.registry.get('allinHoleConfig') as GameConfig;
    this.stageNum = data?.stage ?? gameConfig?.stage ?? 1;
    this.gameConfig = gameConfig;
  }

  preload(): void {
    // No external assets needed — using Phaser shapes
  }

  create(): void {
    const dpr = this.game.registry.get('dpr') || 1;
    const { width, height } = this.scale;

    // Reset state
    this.phase = GamePhase.PLAYING;
    this.movesUsed = 0;
    this.isDragging = false;
    this.ballObjects.clear();

    // Load stage
    this.stageConfig = getStageConfig(this.stageNum);
    this.movesLeft = this.stageConfig.maxMoves;

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Calculate cell size to fit board
    const padding = 30 * dpr;
    const boardW = width - padding * 2;
    const boardH = height - padding * 2;
    this.cellSize = Math.floor(
      Math.min(
        boardW / this.stageConfig.cols,
        boardH / this.stageConfig.rows,
        70 * dpr,
      ),
    );

    // Center the board
    const totalW = this.stageConfig.cols * this.cellSize;
    const totalH = this.stageConfig.rows * this.cellSize;
    this.boardStartX = (width - totalW) / 2 + this.cellSize / 2;
    this.boardStartY = (height - totalH) / 2 + this.cellSize / 2;

    // Create board data
    const { grid, balls } = createBoard(this.stageConfig);
    this.grid = grid;
    this.ballsData = balls;

    // Draw grid
    this.drawGrid();

    // Create ball visuals
    for (const ball of this.ballsData) {
      const { x, y } = this.gridToPixel(ball.row, ball.col);
      const ballObj = new Ball(this, x, y, ball.id, ball.color, ball.row, ball.col, this.cellSize);
      ballObj.animateSpawn();
      this.ballObjects.set(ball.id, ballObj);
    }

    // Setup global swipe input
    this.setupSwipeInput();

    // Emit initial state
    this.emitMoves();
    this.emitBalls();

    this.events.on('shutdown', this.shutdown, this);
  }

  // ─── COORDINATE HELPERS ──────────────────────────────

  private gridToPixel(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardStartX + col * this.cellSize,
      y: this.boardStartY + row * this.cellSize,
    };
  }

  // ─── DRAW GRID ──────────────────────────────────────────

  private drawGrid(): void {
    const { rows, cols } = this.stageConfig;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const { x, y } = this.gridToPixel(r, c);
        const cellType = this.grid[r][c];
        const size = this.cellSize - 4;

        if (cellType === CellType.WALL) {
          // Wall — dark solid block
          const wall = this.add.rectangle(x, y, size, size, 0x4a4a6a, 1);
          wall.setStrokeStyle(2, 0x6a6a8a, 1);
        } else if (cellType === CellType.HOLE) {
          // Hole — dark circle
          const hole = this.add.ellipse(x, y, size * 0.7, size * 0.7, 0x0a0a1a, 1);
          hole.setStrokeStyle(2, 0x3a3a5a, 1);
          // Inner shadow
          this.add.ellipse(x, y, size * 0.45, size * 0.45, 0x050510, 0.8);
        } else {
          // Empty cell — subtle grid square
          const cell = this.add.rectangle(x, y, size, size, 0x16213e, 0.6);
          cell.setStrokeStyle(1, 0x2a2a4a, 0.5);
        }
      }
    }
  }

  // ─── INPUT ──────────────────────────────────────────────

  private setupSwipeInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== GamePhase.PLAYING) return;
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.phase !== GamePhase.PLAYING) return;
      this.isDragging = false;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const threshold = this.cellSize * 0.3;

      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      let dir: Direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'right' : 'left';
      } else {
        dir = dy > 0 ? 'down' : 'up';
      }

      this.doSlide(dir);
    });
  }

  // ─── SLIDE LOGIC ────────────────────────────────────────

  private async doSlide(dir: Direction): Promise<void> {
    if (this.phase !== GamePhase.PLAYING) return;

    // Check if any balls can move
    const moves = slideAll(this.grid, this.ballsData, dir);
    if (moves.length === 0) return;

    this.phase = GamePhase.ANIMATING;

    // Consume a move
    this.movesLeft--;
    this.movesUsed++;
    this.emitMoves();

    // Animate each ball move
    const animPromises: Promise<void>[] = [];
    for (const move of moves) {
      const ballObj = this.ballObjects.get(move.ballId);
      if (!ballObj) continue;

      const { x, y } = this.gridToPixel(move.to.row, move.to.col);
      const dist = Math.abs(move.to.row - move.from.row) + Math.abs(move.to.col - move.from.col);
      const duration = Math.min(80 + dist * 50, 400);

      if (move.sunk) {
        // Move to hole then sink
        animPromises.push(
          new Promise<void>((res) => {
            ballObj.animateMoveTo(x, y, duration, () => {
              ballObj.animateSink(() => {
                ballObj.destroy();
                this.ballObjects.delete(move.ballId);
                res();
              });
            });
          }),
        );
      } else {
        animPromises.push(
          new Promise<void>((res) => {
            ballObj.animateMoveTo(x, y, duration, () => {
              ballObj.gridRow = move.to.row;
              ballObj.gridCol = move.to.col;
              res();
            });
          }),
        );
      }
    }

    await Promise.all(animPromises);
    this.emitBalls();

    // Check game state
    if (allSunk(this.ballsData)) {
      this.stageClear();
    } else if (this.movesLeft <= 0) {
      this.gameOver();
    } else {
      this.phase = GamePhase.PLAYING;
    }
  }

  // ─── GAME FLOW ──────────────────────────────────────────

  private stageClear(): void {
    this.phase = GamePhase.CLEAR;
    this.gameConfig?.onClear?.();
    this.game.events.emit('stage-clear', {
      movesUsed: this.movesUsed,
    });
  }

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;
    this.gameConfig?.onGameOver?.();
    this.game.events.emit('game-over', {
      movesUsed: this.movesUsed,
    });
  }

  // ─── EMITTERS ──────────────────────────────────────────

  private emitMoves(): void {
    this.game.events.emit('moves-update', {
      movesLeft: this.movesLeft,
      maxMoves: this.stageConfig.maxMoves,
    });
  }

  private emitBalls(): void {
    const remaining = activeBallCount(this.ballsData);
    const total = this.ballsData.length;
    this.game.events.emit('balls-update', {
      remaining,
      total,
    });
  }

  // ─── UTILS ──────────────────────────────────────────────

  shutdown(): void {
    this.tweens.killAll();
    this.input.off('pointerdown');
    this.input.off('pointerup');
    this.events.off('shutdown', this.shutdown, this);
    this.ballObjects.forEach((b) => b.destroy());
    this.ballObjects.clear();
    this.ballsData = [];
  }
}
