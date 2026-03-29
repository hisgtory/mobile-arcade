/**
 * PlayScene for HelloTown merge game
 *
 * Phaser handles the merge board. HUD is handled by React.
 *
 * Events emitted:
 *   'score-update'   — { score, combo, maxLevel }
 *   'moves-update'   — { movesLeft, maxMoves }
 *   'stage-clear'    — { score, movesUsed }
 *   'game-over'      — { score }
 */

import Phaser from 'phaser';
import { getStageConfig } from '../logic/stage';
import {
  createBoard,
  canMerge,
  executeMerge,
  applyGravity,
  hasMergeablePair,
  getMaxLevel,
  calcMergeScore,
  EMPTY,
  type Board,
} from '../logic/board';
import { MergeItem } from '../objects/MergeItem';
import { GamePhase, ITEM_COLORS, type GameConfig, type StageConfig, type CellPos } from '../types';

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
  private maxLevel: number = 0;

  // Visual grid
  private itemGrid: (MergeItem | null)[][] = [];
  private cellSize: number = 48;
  private boardStartX: number = 0;
  private boardStartY: number = 0;
  private gridBgs: Phaser.GameObjects.Rectangle[][] = [];

  // Drag/select tracking
  private selectedItem: MergeItem | null = null;
  private dragItem: MergeItem | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isDragging: boolean = false;

  // Highlight for valid merge targets
  private highlightGraphics?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number; gameConfig?: GameConfig }): void {
    this.stageNum = data?.stage ?? 1;
    this.gameConfig = data?.gameConfig ?? (this.game as any).__hellotownConfig;
  }

  create(): void {
    const dpr = (this.game as any).__dpr || 1;
    const { width, height } = this.scale;

    // Reset state
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.combo = 0;
    this.movesUsed = 0;
    this.maxLevel = 0;
    this.selectedItem = null;
    this.dragItem = null;
    this.isDragging = false;

    // Load stage
    this.stageConfig = getStageConfig(this.stageNum);
    this.movesLeft = this.stageConfig.maxMoves;

    // Background
    this.cameras.main.setBackgroundColor('#F5F0EB');

    // Calculate cell size to fit board
    const padding = 24 * dpr;
    const boardW = width - padding * 2;
    const boardH = height - padding * 2;
    this.cellSize = Math.floor(
      Math.min(
        boardW / this.stageConfig.cols,
        boardH / this.stageConfig.rows,
        80 * dpr,
      ),
    );

    // Center the board
    const totalW = this.stageConfig.cols * this.cellSize;
    const totalH = this.stageConfig.rows * this.cellSize;
    this.boardStartX = (width - totalW) / 2 + this.cellSize / 2;
    this.boardStartY = (height - totalH) / 2 + this.cellSize / 2;

    // Draw grid background
    this.gridBgs = [];
    for (let r = 0; r < this.stageConfig.rows; r++) {
      this.gridBgs[r] = [];
      for (let c = 0; c < this.stageConfig.cols; c++) {
        const { x, y } = this.gridToPixel(r, c);
        const bg = this.add.rectangle(x, y, this.cellSize - 2, this.cellSize - 2, 0xEDE8E3, 1);
        bg.setStrokeStyle(1, 0xD5CFC9, 0.6);
        this.gridBgs[r][c] = bg;
      }
    }

    // Create highlight graphics
    this.highlightGraphics = this.add.graphics();

    // Create board data
    this.board = createBoard(this.stageConfig);

    // Create item visuals
    this.itemGrid = [];
    for (let r = 0; r < this.stageConfig.rows; r++) {
      this.itemGrid[r] = [];
      for (let c = 0; c < this.stageConfig.cols; c++) {
        if (this.board[r][c] !== EMPTY) {
          const { x, y } = this.gridToPixel(r, c);
          const item = new MergeItem(this, x, y, this.board[r][c], r, c, this.cellSize);
          this.itemGrid[r][c] = item;
        } else {
          this.itemGrid[r][c] = null;
        }
      }
    }

    // Setup input
    this.setupInput();

    // Emit initial state
    this.maxLevel = getMaxLevel(this.board);
    this.emitMoves();
    this.emitScore();
  }

  // ─── COORDINATE HELPERS ──────────────────────────────

  private gridToPixel(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardStartX + col * this.cellSize,
      y: this.boardStartY + row * this.cellSize,
    };
  }

  private pixelToGrid(px: number, py: number): CellPos | null {
    const col = Math.round((px - this.boardStartX) / this.cellSize);
    const row = Math.round((py - this.boardStartY) / this.cellSize);
    if (row < 0 || row >= this.stageConfig.rows || col < 0 || col >= this.stageConfig.cols) {
      return null;
    }
    return { row, col };
  }

  // ─── INPUT ──────────────────────────────────────────────

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== GamePhase.PLAYING) return;

      const cell = this.pixelToGrid(pointer.x, pointer.y);
      if (!cell) return;

      const item = this.itemGrid[cell.row][cell.col];
      if (!item) return;

      this.selectedItem = item;
      this.dragItem = item;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.isDragging = false;

      item.animateSelect();
      this.highlightMergeTargets(cell);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragItem || this.phase !== GamePhase.PLAYING) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const threshold = this.cellSize * 0.3;

      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      if (!this.isDragging) {
        this.isDragging = true;
      }

      // Determine swipe direction
      let targetRow = this.dragItem.gridRow;
      let targetCol = this.dragItem.gridCol;

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
        this.clearSelection();
        return;
      }

      const fromPos: CellPos = { row: this.dragItem.gridRow, col: this.dragItem.gridCol };
      const toPos: CellPos = { row: targetRow, col: targetCol };

      const item = this.dragItem;
      this.clearSelection();
      this.tryMergeOrMove(fromPos, toPos, item);
    });

    this.input.on('pointerup', () => {
      this.clearSelection();
    });
  }

  private highlightMergeTargets(cell: CellPos): void {
    if (!this.highlightGraphics) return;
    this.highlightGraphics.clear();

    const level = this.board[cell.row][cell.col];
    if (level === EMPTY) return;

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const color = ITEM_COLORS[level % ITEM_COLORS.length];

    for (const [dr, dc] of dirs) {
      const nr = cell.row + dr;
      const nc = cell.col + dc;
      if (nr < 0 || nr >= this.stageConfig.rows || nc < 0 || nc >= this.stageConfig.cols) continue;
      if (this.board[nr][nc] === level) {
        const { x, y } = this.gridToPixel(nr, nc);
        this.highlightGraphics.lineStyle(3, color, 0.8);
        this.highlightGraphics.strokeRoundedRect(
          x - this.cellSize / 2 + 2,
          y - this.cellSize / 2 + 2,
          this.cellSize - 4,
          this.cellSize - 4,
          8,
        );
      }
    }
  }

  private clearSelection(): void {
    if (this.selectedItem) {
      this.selectedItem.animateDeselect();
      this.selectedItem = null;
    }
    this.dragItem = null;
    this.isDragging = false;
    this.highlightGraphics?.clear();
  }

  // ─── MERGE + MOVE LOGIC ────────────────────────────────

  private async tryMergeOrMove(from: CellPos, to: CellPos, _fromItem: MergeItem): Promise<void> {
    if (this.phase !== GamePhase.PLAYING) return;
    this.phase = GamePhase.ANIMATING;

    const fromItem = this.itemGrid[from.row][from.col];
    const toItem = this.itemGrid[to.row][to.col];

    if (!fromItem) {
      this.phase = GamePhase.PLAYING;
      return;
    }

    // Case 1: Merge (same level items)
    if (canMerge(this.board, from, to)) {
      // Consume a move
      this.movesLeft--;
      this.movesUsed++;
      this.combo++;
      this.emitMoves();

      // Animate merge: fromItem moves to toItem position
      const toPos = this.gridToPixel(to.row, to.col);

      await new Promise<void>((res) => fromItem.animateMerge(toPos.x, toPos.y, () => res()));

      // Execute merge in data
      const newLevel = executeMerge(this.board, from, to);
      this.maxLevel = Math.max(this.maxLevel, newLevel);

      // Remove fromItem visual
      fromItem.destroy();
      this.itemGrid[from.row][from.col] = null;

      // Update toItem visual
      if (toItem) {
        toItem.updateLevel(newLevel);
        await new Promise<void>((res) => toItem.animateLevelUp(() => res()));
      }

      // Calculate score
      const mergeScore = calcMergeScore(newLevel, this.combo);
      this.score += mergeScore;
      this.emitScore();

      // Apply gravity
      await this.doGravity();

      // Check game state
      this.checkGameState();
      return;
    }

    // Case 2: Move to empty cell
    if (this.board[to.row][to.col] === EMPTY) {
      // Consume a move
      this.movesLeft--;
      this.movesUsed++;
      this.combo = 0;
      this.emitMoves();

      const toPixel = this.gridToPixel(to.row, to.col);

      await new Promise<void>((res) => fromItem.animateMoveTo(toPixel.x, toPixel.y, () => res()));

      // Update data
      this.board[to.row][to.col] = this.board[from.row][from.col];
      this.board[from.row][from.col] = EMPTY;
      this.itemGrid[to.row][to.col] = fromItem;
      this.itemGrid[from.row][from.col] = null;
      fromItem.gridRow = to.row;
      fromItem.gridCol = to.col;

      // Apply gravity
      await this.doGravity();

      // Check game state
      this.checkGameState();
      return;
    }

    // Case 3: Different level items — invalid, do nothing
    this.phase = GamePhase.PLAYING;
  }

  private async doGravity(): Promise<void> {
    const gravityMoves = applyGravity(this.board);

    const gravityPromises = gravityMoves.map(({ from, to }) => {
      const item = this.itemGrid[from.row][from.col];
      if (item) {
        this.itemGrid[from.row][from.col] = null;
        this.itemGrid[to.row][to.col] = item;
        item.gridRow = to.row;
        item.gridCol = to.col;
        const pos = this.gridToPixel(to.row, to.col);
        return new Promise<void>((res) => item.animateMoveTo(pos.x, pos.y, () => res()));
      }
      return Promise.resolve();
    });

    await Promise.all(gravityPromises);
  }

  private checkGameState(): void {
    // Check if target level reached
    if (this.maxLevel >= this.stageConfig.targetLevel) {
      this.stageClear();
      return;
    }

    // Check if out of moves
    if (this.movesLeft <= 0) {
      this.gameOver();
      return;
    }

    // Check if any merges possible (if not, game over)
    if (!hasMergeablePair(this.board)) {
      // Still has moves but no possible merges → game over
      this.gameOver();
      return;
    }

    this.phase = GamePhase.PLAYING;
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
      maxLevel: this.maxLevel,
    });
  }

  private emitMoves(): void {
    this.game.events.emit('moves-update', {
      movesLeft: this.movesLeft,
      maxMoves: this.stageConfig.maxMoves,
    });
  }

  // ─── UTILS ──────────────────────────────────────────────

  shutdown(): void {
    this.itemGrid = [];
    this.gridBgs = [];
    this.highlightGraphics?.destroy();
    this.highlightGraphics = undefined;
  }
}
