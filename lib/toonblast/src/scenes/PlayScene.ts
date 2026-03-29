/**
 * PlayScene for Toon Blast
 *
 * Phaser handles the block board. HUD is handled by React.
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
  crushGroup,
  applyGravity,
  collapseColumns,
  calcGroupScore,
  getSpecialForGroup,
  hasValidMoves,
  type Board,
} from '../logic/board';
import {
  GamePhase,
  BLOCK_COLORS,
  EMPTY,
  ROCKET,
  BOMB,
  DISCO,
  type GameConfig,
  type StageConfig,
  type CellPos,
} from '../types';

/* ── Block visual: Container with rounded-rect background ─────────── */

class Block extends Phaser.GameObjects.Container {
  public blockType: number;
  public gridRow: number;
  public gridCol: number;
  private bg: Phaser.GameObjects.Graphics;
  private specialIcon: Phaser.GameObjects.Graphics | null = null;
  private blockSize: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: number,
    row: number,
    col: number,
    size: number,
  ) {
    super(scene, x, y);
    this.blockType = type;
    this.gridRow = row;
    this.gridCol = col;
    this.blockSize = size;

    this.bg = scene.add.graphics();
    this.add(this.bg);
    this.drawBlock(type);

    this.setSize(size, size);
    this.setInteractive();
    scene.add.existing(this);
  }

  private drawBlock(type: number): void {
    const s = this.blockSize;
    const half = s / 2;
    const inset = 2;
    const r = 6;

    this.bg.clear();

    if (type === ROCKET) {
      this.bg.fillStyle(0xfbbf24, 1);
      this.bg.fillRoundedRect(-half + inset, -half + inset, s - inset * 2, s - inset * 2, r);
      this.drawRocketIcon(s);
    } else if (type === BOMB) {
      this.bg.fillStyle(0x1f2937, 1);
      this.bg.fillRoundedRect(-half + inset, -half + inset, s - inset * 2, s - inset * 2, r);
      this.drawBombIcon(s);
    } else if (type === DISCO) {
      // Rainbow gradient approximation
      this.bg.fillStyle(0xff6b6b, 1);
      this.bg.fillRoundedRect(-half + inset, -half + inset, s - inset * 2, s - inset * 2, r);
      this.drawDiscoIcon(s);
    } else if (type >= 0 && type < BLOCK_COLORS.length) {
      const color = BLOCK_COLORS[type];
      this.bg.fillStyle(color, 1);
      this.bg.fillRoundedRect(-half + inset, -half + inset, s - inset * 2, s - inset * 2, r);
      // Highlight stripe for depth
      this.bg.fillStyle(0xffffff, 0.25);
      this.bg.fillRoundedRect(-half + inset + 3, -half + inset + 3, s - inset * 2 - 6, (s - inset * 2) * 0.3, r);
    }
  }

  private drawRocketIcon(s: number): void {
    const g = this.bg;
    const hs = s * 0.18;
    // Arrow pointing up
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(0, -hs * 1.5, -hs, hs * 0.5, hs, hs * 0.5);
    g.fillRect(-hs * 0.35, hs * 0.5, hs * 0.7, hs);
  }

  private drawBombIcon(s: number): void {
    const g = this.bg;
    const radius = s * 0.2;
    // Star shape
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(0, 0, radius);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(0, 0, radius * 0.4);
  }

  private drawDiscoIcon(s: number): void {
    const g = this.bg;
    const radius = s * 0.18;
    // Rainbow circles
    const colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const cx = Math.cos(angle) * radius;
      const cy = Math.sin(angle) * radius;
      g.fillStyle(colors[i], 0.9);
      g.fillCircle(cx, cy, radius * 0.45);
    }
  }

  updateType(type: number): void {
    this.blockType = type;
    this.drawBlock(type);
  }

  setHighlight(on: boolean): void {
    if (on) {
      this.setAlpha(0.75);
      this.setScale(1.05);
    } else {
      this.setAlpha(1);
      this.setScale(1);
    }
  }

  animateDestroy(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete,
    });
  }

  animateMoveTo(x: number, y: number, onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: 150,
      ease: 'Power2',
      onComplete,
    });
  }
}

/* ── PlayScene ────────────────────────────────────────────────────── */

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
  private blockGrid: (Block | null)[][] = [];
  private blockSize: number = 48;
  private boardStartX: number = 0;
  private boardStartY: number = 0;

  // Hover highlight
  private highlightedCells: CellPos[] = [];

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number; gameConfig?: GameConfig }): void {
    this.stageNum = data?.stage ?? 1;
    this.gameConfig = data?.gameConfig ?? (this.game as any).__toonblastConfig;
  }

  /* No preload needed — no images, just colored shapes */

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
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Calculate block size to fit board
    const padding = 20 * dpr;
    const boardW = width - padding * 2;
    const boardH = height - padding * 2;
    this.blockSize = Math.floor(
      Math.min(
        boardW / this.stageConfig.cols,
        boardH / this.stageConfig.rows,
        60 * dpr,
      ),
    );

    // Center the board
    const totalW = this.stageConfig.cols * this.blockSize;
    const totalH = this.stageConfig.rows * this.blockSize;
    this.boardStartX = (width - totalW) / 2 + this.blockSize / 2;
    this.boardStartY = (height - totalH) / 2 + this.blockSize / 2;

    // Create board data
    this.board = createBoard(this.stageConfig);

    // Create block visuals
    this.blockGrid = [];
    for (let r = 0; r < this.stageConfig.rows; r++) {
      this.blockGrid[r] = [];
      for (let c = 0; c < this.stageConfig.cols; c++) {
        const { x, y } = this.gridToPixel(r, c);
        const block = new Block(this, x, y, this.board[r][c], r, c, this.blockSize);
        this.blockGrid[r][c] = block;
        this.setupBlockInput(block);
      }
    }

    // Emit initial state
    this.emitMoves();
    this.emitScore();
  }

  // ─── COORDINATE HELPERS ──────────────────────────────

  private gridToPixel(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardStartX + col * this.blockSize,
      y: this.boardStartY + row * this.blockSize,
    };
  }

  // ─── INPUT ──────────────────────────────────────────────

  private setupBlockInput(block: Block): void {
    block.on('pointerover', () => {
      if (this.phase !== GamePhase.PLAYING) return;
      const group = findGroup(this.board, block.gridRow, block.gridCol);
      this.clearHighlight();
      if (group.length >= 2) {
        this.highlightedCells = group;
        for (const { row, col } of group) {
          this.blockGrid[row]?.[col]?.setHighlight(true);
        }
      }
    });

    block.on('pointerout', () => {
      this.clearHighlight();
    });

    block.on('pointerdown', () => {
      if (this.phase !== GamePhase.PLAYING) return;
      this.tryCrush(block.gridRow, block.gridCol);
    });
  }

  private clearHighlight(): void {
    for (const { row, col } of this.highlightedCells) {
      this.blockGrid[row]?.[col]?.setHighlight(false);
    }
    this.highlightedCells = [];
  }

  // ─── CRUSH LOGIC ──────────────────────────────────────

  private async tryCrush(row: number, col: number): Promise<void> {
    if (this.phase !== GamePhase.PLAYING) return;

    const group = findGroup(this.board, row, col);
    if (group.length < 2) return;

    this.phase = GamePhase.ANIMATING;
    this.clearHighlight();

    // Consume a move
    this.movesLeft--;
    this.movesUsed++;
    this.combo = 0;
    this.emitMoves();

    // Determine special block
    const specialType = getSpecialForGroup(group.length);

    // Score
    this.combo++;
    const groupScore = calcGroupScore(group.length);
    this.score += groupScore;
    this.emitScore();

    // Screen shake on big crushes
    if (group.length >= 7) {
      this.cameras.main.shake(200, 0.005 * Math.min(group.length, 15));
    }

    // Animate destroy with particles
    await this.animateCrush(group);

    // Remove from data
    crushGroup(this.board, group);

    // Handle special creation and immediate activation
    if (specialType) {
      await this.activateSpecial(specialType, row, col);
    }

    // Gravity + collapse loop
    await this.settleBoard();

    // Check game state
    if (this.score >= this.stageConfig.targetScore) {
      this.stageClear();
    } else if (this.movesLeft <= 0) {
      this.gameOver();
    } else if (!hasValidMoves(this.board)) {
      this.gameOver();
    } else {
      this.phase = GamePhase.PLAYING;
    }
  }

  private async animateCrush(cells: CellPos[]): Promise<void> {
    // Flash white then destroy
    const flashPromises = cells.map(
      ({ row, col }) =>
        new Promise<void>((res) => {
          const block = this.blockGrid[row][col];
          if (!block) { res(); return; }
          // Flash white
          this.tweens.add({
            targets: block,
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            onComplete: () => res(),
          });
        }),
    );
    await Promise.all(flashPromises);

    // Emit particles at crush locations
    for (const { row, col } of cells) {
      const block = this.blockGrid[row][col];
      if (!block) continue;
      const colorIdx = block.blockType;
      const color = (colorIdx >= 0 && colorIdx < BLOCK_COLORS.length) ? BLOCK_COLORS[colorIdx] : 0xffffff;
      const { x, y } = this.gridToPixel(row, col);
      this.emitParticles(x, y, color);
    }

    // Scale down and destroy
    const destroyPromises = cells.map(
      ({ row, col }) =>
        new Promise<void>((res) => {
          const block = this.blockGrid[row][col];
          if (block) {
            block.animateDestroy(() => {
              block.destroy();
              this.blockGrid[row][col] = null;
              res();
            });
          } else {
            res();
          }
        }),
    );
    await Promise.all(destroyPromises);
  }

  private emitParticles(x: number, y: number, color: number): void {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const size = this.blockSize * 0.12;
      const p = this.add.rectangle(x, y, size, size, color);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = this.blockSize * (0.5 + Math.random() * 0.5);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 350,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  private async activateSpecial(
    type: 'rocket' | 'bomb' | 'disco',
    tapRow: number,
    tapCol: number,
  ): Promise<void> {
    const cellsToDestroy: CellPos[] = [];

    if (type === 'rocket') {
      // Clear entire row OR column randomly
      if (Math.random() < 0.5) {
        for (let c = 0; c < this.stageConfig.cols; c++) {
          if (this.board[tapRow]?.[c] !== undefined && this.board[tapRow][c] !== EMPTY) {
            cellsToDestroy.push({ row: tapRow, col: c });
          }
        }
      } else {
        for (let r = 0; r < this.stageConfig.rows; r++) {
          if (this.board[r]?.[tapCol] !== undefined && this.board[r][tapCol] !== EMPTY) {
            cellsToDestroy.push({ row: r, col: tapCol });
          }
        }
      }
    } else if (type === 'bomb') {
      // Clear 3×3 area
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = tapRow + dr;
          const c = tapCol + dc;
          if (r >= 0 && r < this.stageConfig.rows && c >= 0 && c < this.stageConfig.cols) {
            if (this.board[r][c] !== EMPTY) {
              cellsToDestroy.push({ row: r, col: c });
            }
          }
        }
      }
    } else if (type === 'disco') {
      // Clear all blocks of one random color
      const colorsOnBoard: Set<number> = new Set();
      for (let r = 0; r < this.stageConfig.rows; r++) {
        for (let c = 0; c < this.stageConfig.cols; c++) {
          const v = this.board[r][c];
          if (v >= 0 && v < BLOCK_COLORS.length) {
            colorsOnBoard.add(v);
          }
        }
      }
      if (colorsOnBoard.size > 0) {
        const colorArr = Array.from(colorsOnBoard);
        const target = colorArr[Math.floor(Math.random() * colorArr.length)];
        for (let r = 0; r < this.stageConfig.rows; r++) {
          for (let c = 0; c < this.stageConfig.cols; c++) {
            if (this.board[r][c] === target) {
              cellsToDestroy.push({ row: r, col: c });
            }
          }
        }
      }
    }

    if (cellsToDestroy.length > 0) {
      // Score bonus from special
      const bonus = calcGroupScore(cellsToDestroy.length);
      this.score += bonus;
      this.combo++;
      this.emitScore();

      // Screen shake for special activation
      this.cameras.main.shake(250, 0.008);

      await this.animateCrush(cellsToDestroy);
      crushGroup(this.board, cellsToDestroy);
    }
  }

  private async settleBoard(): Promise<void> {
    // Gravity
    const gravityMoves = applyGravity(this.board);

    const gravityPromises = gravityMoves.map(({ from, to }) => {
      const block = this.blockGrid[from.row][from.col];
      if (block) {
        this.blockGrid[from.row][from.col] = null;
        this.blockGrid[to.row][to.col] = block;
        block.gridRow = to.row;
        block.gridCol = to.col;
        const pos = this.gridToPixel(to.row, to.col);
        return new Promise<void>((res) => block.animateMoveTo(pos.x, pos.y, () => res()));
      }
      return Promise.resolve();
    });
    await Promise.all(gravityPromises);

    // Column collapse
    const colShifts = collapseColumns(this.board);

    if (colShifts.length > 0) {
      // Rebuild visual positions for shifted columns
      const movePromises: Promise<void>[] = [];
      for (const { fromCol, toCol } of colShifts) {
        for (let r = 0; r < this.stageConfig.rows; r++) {
          const block = this.blockGrid[r][fromCol];
          if (block) {
            this.blockGrid[r][fromCol] = null;
            this.blockGrid[r][toCol] = block;
            block.gridCol = toCol;
            const pos = this.gridToPixel(r, toCol);
            movePromises.push(
              new Promise<void>((res) => block.animateMoveTo(pos.x, pos.y, () => res())),
            );
          }
        }
      }
      await Promise.all(movePromises);
    }

    await this.delay(100);
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
    this.blockGrid = [];
    this.highlightedCells = [];
  }
}
