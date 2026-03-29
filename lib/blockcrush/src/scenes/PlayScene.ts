/**
 * PlayScene for BlockCrush (SameGame / Collapse)
 *
 * 10x14 grid of colored blocks.
 * Tap a group of 2+ connected same-colored blocks to crush them.
 * Gravity pulls blocks down, empty columns collapse left.
 *
 * Events emitted:
 *   'score-update' — { score }
 *   'game-over'    — { score }
 */

import Phaser from 'phaser';
import {
  createBoard,
  findGroup,
  crushGroup,
  applyGravity,
  shiftColumnsLeft,
  hasValidMoves,
  calcGroupScore,
  type Board,
} from '../logic/board';
import { GamePhase, COLS, ROWS, type GameConfig } from '../types';

const CELL_BORDER_COLOR = 0xe5e7eb;
const CELL_BG_COLOR = 0xffffff;
const GRID_BG_COLOR = 0xf3f4f6;

export class PlayScene extends Phaser.Scene {
  private gameConfig?: GameConfig;
  private phase: GamePhase = GamePhase.PLAYING;
  private board!: Board;
  private score: number = 0;

  // Visual
  private cellSize: number = 32;
  private gridStartX: number = 0;
  private gridStartY: number = 0;
  private gridCells: Phaser.GameObjects.Rectangle[][] = [];
  private highlightRects: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { gameConfig?: GameConfig }): void {
    this.gameConfig = data?.gameConfig ?? (this.game as any).__blockcrushConfig;
  }

  create(): void {
    const dpr = (this.game as any).__dpr || 1;
    const { width, height } = this.scale;

    this.phase = GamePhase.PLAYING;
    this.board = createBoard();
    this.score = 0;

    this.cameras.main.setBackgroundColor('#f0f2f5');

    // Calculate cell size to fit grid on screen
    const padding = 16 * dpr;
    const availableW = width - padding * 2;
    const availableH = height - padding * 2;
    this.cellSize = Math.floor(Math.min(availableW / COLS, availableH / ROWS));
    const gridTotalW = this.cellSize * COLS;
    const gridTotalH = this.cellSize * ROWS;
    this.gridStartX = (width - gridTotalW) / 2;
    this.gridStartY = (height - gridTotalH) / 2;

    // Draw grid background
    this.add
      .rectangle(
        this.gridStartX + gridTotalW / 2,
        this.gridStartY + gridTotalH / 2,
        gridTotalW + 4,
        gridTotalH + 4,
        GRID_BG_COLOR,
      )
      .setStrokeStyle(1, CELL_BORDER_COLOR);

    // Draw grid cells
    this.gridCells = [];
    for (let r = 0; r < ROWS; r++) {
      this.gridCells[r] = [];
      for (let c = 0; c < COLS; c++) {
        const x = this.gridStartX + c * this.cellSize + this.cellSize / 2;
        const y = this.gridStartY + r * this.cellSize + this.cellSize / 2;
        const color = this.board[r][c];
        const cell = this.add.rectangle(x, y, this.cellSize - 2, this.cellSize - 2, color);
        cell.setStrokeStyle(1, 0xffffff, 0.3);
        this.gridCells[r][c] = cell;
      }
    }

    // Make the whole grid interactive
    const hitZone = this.add
      .rectangle(
        this.gridStartX + gridTotalW / 2,
        this.gridStartY + gridTotalH / 2,
        gridTotalW,
        gridTotalH,
        0x000000,
        0,
      )
      .setInteractive()
      .setDepth(10);

    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTap(pointer.x, pointer.y);
    });

    this.emitScore();
  }

  // -- TAP HANDLING --

  private handleTap(px: number, py: number): void {
    if (this.phase !== GamePhase.PLAYING) return;

    const gridPos = this.pixelToGrid(px, py);
    if (!gridPos) return;

    const { row, col } = gridPos;
    if (this.board[row][col] === 0) return;

    const group = findGroup(this.board, row, col);
    if (group.length < 2) {
      // Small shake feedback for invalid tap
      this.cameras.main.shake(80, 0.002);
      return;
    }

    this.phase = GamePhase.ANIMATING;

    // Calculate score
    const groupScore = calcGroupScore(group.length);
    this.score += groupScore;

    // Crush on the data model
    crushGroup(this.board, group);

    // Animate crush (shrink + particles), then gravity + shift
    this.animateCrush(group, groupScore);
  }

  private animateCrush(
    group: { row: number; col: number }[],
    groupScore: number,
  ): void {
    // Show score popup
    this.showScorePopup(group, groupScore);

    // Camera shake — intensity based on group size
    const shakeIntensity = Math.min(2 + group.length * 0.5, 10);
    this.cameras.main.shake(150, shakeIntensity / 1000);

    // Flash cells white briefly
    for (const { row, col } of group) {
      this.gridCells[row][col].setFillStyle(0xffffff);
    }

    // Staggered shrink animation with particles
    let completed = 0;
    const totalCells = group.length;

    this.time.delayedCall(60, () => {
      group.forEach(({ row, col }, i) => {
        this.time.delayedCall(i * 15, () => {
          const cell = this.gridCells[row][col];
          const cx = cell.x;
          const cy = cell.y;
          const color = cell.fillColor;

          this.spawnParticles(cx, cy, color);

          this.tweens.add({
            targets: cell,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
              cell.setScale(1);
              cell.setAlpha(1);
              cell.setFillStyle(CELL_BG_COLOR);
              cell.setStrokeStyle(1, CELL_BORDER_COLOR, 0.5);
              completed++;
              if (completed === totalCells) {
                this.onCrushComplete();
              }
            },
          });
        });
      });
    });
  }

  private onCrushComplete(): void {
    // Apply gravity to data model
    applyGravity(this.board);

    // Animate gravity (blocks falling to new positions)
    this.animateGravity(() => {
      // Shift columns in data model
      shiftColumnsLeft(this.board);

      // Animate column shift
      this.animateColumnShift(() => {
        this.emitScore();

        // Check game over
        if (!hasValidMoves(this.board)) {
          this.gameOver();
        } else {
          this.phase = GamePhase.PLAYING;
        }
      });
    });
  }

  private animateGravity(onComplete: () => void): void {
    // Update all cell visuals to match new board state with falling tween
    let tweenCount = 0;
    let tweenDone = 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = this.board[r][c];
        const cell = this.gridCells[r][c];
        const targetY = this.gridStartY + r * this.cellSize + this.cellSize / 2;

        if (color !== 0) {
          const prevColor = cell.fillColor;
          const prevY = cell.y;
          cell.setFillStyle(color);
          cell.setStrokeStyle(1, 0xffffff, 0.3);

          if (Math.abs(prevY - targetY) > 1 || prevColor !== color) {
            tweenCount++;
            this.tweens.add({
              targets: cell,
              y: targetY,
              duration: 150,
              ease: 'Bounce.easeOut',
              delay: c * 10,
              onComplete: () => {
                tweenDone++;
                if (tweenDone === tweenCount) onComplete();
              },
            });
          }
        } else {
          cell.setFillStyle(CELL_BG_COLOR);
          cell.setStrokeStyle(1, CELL_BORDER_COLOR, 0.5);
          cell.setPosition(
            this.gridStartX + c * this.cellSize + this.cellSize / 2,
            targetY,
          );
        }
      }
    }

    if (tweenCount === 0) onComplete();
  }

  private animateColumnShift(onComplete: () => void): void {
    // Snap all cells to correct positions based on board state
    let tweenCount = 0;
    let tweenDone = 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = this.board[r][c];
        const cell = this.gridCells[r][c];
        const targetX = this.gridStartX + c * this.cellSize + this.cellSize / 2;
        const targetY = this.gridStartY + r * this.cellSize + this.cellSize / 2;

        if (color !== 0) {
          cell.setFillStyle(color);
          cell.setStrokeStyle(1, 0xffffff, 0.3);
        } else {
          cell.setFillStyle(CELL_BG_COLOR);
          cell.setStrokeStyle(1, CELL_BORDER_COLOR, 0.5);
        }

        if (Math.abs(cell.x - targetX) > 1) {
          tweenCount++;
          this.tweens.add({
            targets: cell,
            x: targetX,
            duration: 120,
            ease: 'Power2',
            onComplete: () => {
              tweenDone++;
              if (tweenDone === tweenCount) onComplete();
            },
          });
        }

        cell.y = targetY;
      }
    }

    if (tweenCount === 0) onComplete();
  }

  // -- GRID HELPERS --

  private pixelToGrid(px: number, py: number): { row: number; col: number } | null {
    const col = Math.floor((px - this.gridStartX) / this.cellSize);
    const row = Math.floor((py - this.gridStartY) / this.cellSize);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return { row, col };
  }

  private clearHighlights(): void {
    for (const rect of this.highlightRects) rect.destroy();
    this.highlightRects = [];
  }

  // -- JUICE EFFECTS --

  private showScorePopup(
    group: { row: number; col: number }[],
    score: number,
  ): void {
    // Find center of the group
    let cx = 0;
    let cy = 0;
    for (const { row, col } of group) {
      cx += this.gridStartX + col * this.cellSize + this.cellSize / 2;
      cy += this.gridStartY + row * this.cellSize + this.cellSize / 2;
    }
    cx /= group.length;
    cy /= group.length;

    const messages = ['Nice!', 'Great!', 'Awesome!', 'AMAZING!', 'INCREDIBLE!'];
    const thresholds = [4, 8, 15, 25];
    let msgIdx = 0;
    for (const t of thresholds) {
      if (group.length >= t) msgIdx++;
    }
    msgIdx = Math.min(msgIdx, messages.length - 1);

    const colors = [0xfa6c41, 0x2563eb, 0x8b5cf6, 0xf43f5e, 0xd97706];
    const color = colors[msgIdx];

    if (group.length >= 4) {
      const text = this.add
        .text(cx, cy - 20, messages[msgIdx], {
          fontSize: `${Math.min(24 + msgIdx * 4, 44)}px`,
          fontFamily: 'system-ui, sans-serif',
          fontStyle: 'bold',
          color: `#${color.toString(16).padStart(6, '0')}`,
          stroke: '#ffffff',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(200);

      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 700,
        ease: 'Power2',
        onComplete: () => text.destroy(),
      });
    }

    // Score number popup
    const scoreText = this.add
      .text(cx, cy + 10, `+${score}`, {
        fontSize: '20px',
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
        color: '#374151',
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.tweens.add({
      targets: scoreText,
      y: scoreText.y - 40,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 600,
      ease: 'Power2',
      onComplete: () => scoreText.destroy(),
    });
  }

  private spawnParticles(x: number, y: number, color: number): void {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 60 + Math.random() * 50;
      const size = 3 + Math.random() * 3;

      const particle = this.add.rectangle(x, y, size, size, color);
      particle.setDepth(150);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 350 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  // -- GAME FLOW --

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;

    this.cameras.main.shake(300, 0.008);
    this.cameras.main.fade(600, 0, 0, 0, false, (_cam: unknown, progress: number) => {
      if (progress >= 1) {
        this.gameConfig?.onGameOver?.();
        this.game.events.emit('game-over', { score: this.score });
      }
    });
  }

  private emitScore(): void {
    this.game.events.emit('score-update', { score: this.score });
  }

  shutdown(): void {
    this.gridCells = [];
    this.highlightRects = [];
  }
}
