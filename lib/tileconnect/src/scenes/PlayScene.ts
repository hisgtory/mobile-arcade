/**
 * PlayScene for TileConnect
 *
 * Mahjong Connect / Shisen-Sho style puzzle.
 * Tap matching tile pairs connected by a path with ≤ 2 bends.
 *
 * Events emitted on `this.game.events`:
 *   'score-update'  — { score, combo }
 *   'time-update'   — { elapsedMs, timeLimit }
 *   'tiles-update'  — { remaining, total }
 *   'stage-clear'   — { score, elapsedMs }
 *   'game-over'     — { score, elapsedMs }
 */

import Phaser from 'phaser';
import {
  generateBoard,
  tilesToBoard,
  findPath,
  hasValidMoves,
  findAnyPair,
  shuffleRemaining,
  countRemaining,
} from '../logic/board';
import { getStageConfig } from '../logic/stage';
import {
  GamePhase,
  TILE_IMAGES,
  TILE_COLORS,
  type GameConfig,
  type TileType,
  type TileData,
  type StageConfig,
  type PathPoint,
} from '../types';

const CELL_BORDER_COLOR = 0xd0d0d0;
const CELL_BG_COLOR = 0xffffff;
const GRID_BG_COLOR = 0xeef0f3;
const SELECTED_GLOW_COLOR = 0xffd54f;
const PATH_LINE_COLOR = 0xff7043;
const COMBO_WINDOW_MS = 3000; // 3 seconds for combo
const BASE_PAIR_SCORE = 100;
const COMBO_BONUS = 50;
const MAX_TILE_APPEAR_DELAY_MS = 600;

export class PlayScene extends Phaser.Scene {
  private gameConfig?: GameConfig;
  private stageConfig!: StageConfig;
  private phase: GamePhase = GamePhase.PLAYING;

  // Board state
  private board!: (TileType | null)[][];
  private totalTiles: number = 0;

  // Scoring
  private score: number = 0;
  private combo: number = 0;
  private lastMatchTime: number = 0;

  // Timer
  private startTime: number = 0;
  private elapsedMs: number = 0;

  // Visual
  private dpr: number = 1;
  private cellSize: number = 32;
  private gridStartX: number = 0;
  private gridStartY: number = 0;

  // Tile visuals: container with bg rect + icon image
  private tileContainers: (Phaser.GameObjects.Container | null)[][] = [];

  // Selection
  private selectedTile: { row: number; col: number } | null = null;
  private selectionHighlight: Phaser.GameObjects.Rectangle | null = null;

  // Path line graphics
  private pathGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { gameConfig?: GameConfig }): void {
    this.gameConfig = data?.gameConfig ?? (this.game as any).__tileconnectConfig;
  }

  preload(): void {
    const base = '/assets/';
    for (const key of TILE_IMAGES) {
      this.load.image(key, `${base}tiles/${key}.png`);
    }
  }

  create(): void {
    this.dpr = (this.game as any).__dpr || 1;
    const { width, height } = this.scale;

    const stageNum = this.gameConfig?.stage ?? 1;
    this.stageConfig = getStageConfig(stageNum);
    const { rows, cols } = this.stageConfig;

    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.combo = 0;
    this.lastMatchTime = 0;
    this.startTime = this.time.now;
    this.elapsedMs = 0;
    this.selectedTile = null;
    this.selectionHighlight = null;

    this.cameras.main.setBackgroundColor('#f0f2f5');

    // Calculate cell size to fit the grid
    const padding = 16 * this.dpr;
    const gridAreaH = height * 0.85; // more space for grid since no piece slots
    this.cellSize = Math.floor(
      Math.min((width - padding * 2) / cols, gridAreaH / rows),
    );
    const gridTotalW = this.cellSize * cols;
    const gridTotalH = this.cellSize * rows;
    this.gridStartX = (width - gridTotalW) / 2;
    this.gridStartY = (height - gridTotalH) / 2;

    // Draw grid background
    this.add
      .rectangle(
        this.gridStartX + gridTotalW / 2,
        this.gridStartY + gridTotalH / 2,
        gridTotalW + 6,
        gridTotalH + 6,
        GRID_BG_COLOR,
      )
      .setStrokeStyle(2, CELL_BORDER_COLOR);

    // Generate board with solvability guarantee
    const tiles = this.generateSolvableBoard();
    this.totalTiles = tiles.length;
    this.board = tilesToBoard(tiles, rows, cols);

    // Create tile visuals
    this.tileContainers = Array.from({ length: rows }, () =>
      new Array(cols).fill(null),
    );
    for (const tile of tiles) {
      this.createTileVisual(tile.row, tile.col, tile.type);
    }

    // Path graphics layer
    this.pathGraphics = this.add.graphics();
    this.pathGraphics.setDepth(50);

    // Input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTap(pointer.x, pointer.y);
    });

    // Timer update
    this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => this.updateTimer(),
    });

    this.emitTilesUpdate();
    this.emitScore();
  }

  // --- Board generation with solvability ---

  private generateSolvableBoard(): TileData[] {
    const { rows, cols } = this.stageConfig;
    let tiles = generateBoard(this.stageConfig);
    let board = tilesToBoard(tiles, rows, cols);

    // Retry up to 50 times if no valid moves
    let attempts = 0;
    while (!hasValidMoves(board, rows, cols) && attempts < 50) {
      tiles = generateBoard(this.stageConfig);
      board = tilesToBoard(tiles, rows, cols);
      attempts++;
    }
    return tiles;
  }

  // --- Tile visual creation ---

  private createTileVisual(row: number, col: number, type: TileType): void {
    const x = this.gridStartX + col * this.cellSize + this.cellSize / 2;
    const y = this.gridStartY + row * this.cellSize + this.cellSize / 2;

    const container = this.add.container(x, y);
    container.setDepth(10);

    // Background rectangle
    const bgColor = TILE_COLORS[type % TILE_COLORS.length];
    const bg = this.add.rectangle(0, 0, this.cellSize - 3, this.cellSize - 3, bgColor);
    bg.setStrokeStyle(1, 0xbbbbbb, 0.6);
    container.add(bg);

    // Tile icon
    const imageKey = TILE_IMAGES[type % TILE_IMAGES.length];
    if (this.textures.exists(imageKey)) {
      const icon = this.add.image(0, 0, imageKey);
      const iconSize = this.cellSize * 0.6;
      icon.setDisplaySize(iconSize, iconSize);
      container.add(icon);
    }

    // Make interactive
    bg.setInteractive();
    container.setSize(this.cellSize - 3, this.cellSize - 3);

    // Pop in animation (cap delay so large boards don't wait too long)
    const tileIndex = row * this.stageConfig.cols + col;
    const totalCells = this.stageConfig.rows * this.stageConfig.cols;
    const delayPerTile = Math.min(15, MAX_TILE_APPEAR_DELAY_MS / totalCells);
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
      delay: tileIndex * delayPerTile,
    });

    this.tileContainers[row][col] = container;
  }

  // --- Input handling ---

  private handleTap(px: number, py: number): void {
    if (this.phase !== GamePhase.PLAYING) return;

    const gridPos = this.pixelToGrid(px, py);
    if (!gridPos) return;

    const { row, col } = gridPos;

    // Must tap a tile that exists
    if (this.board[row][col] === null) return;

    if (this.selectedTile === null) {
      // Select first tile
      this.selectTile(row, col);
    } else if (this.selectedTile.row === row && this.selectedTile.col === col) {
      // Tap same tile → deselect
      this.deselectTile();
    } else {
      // Try to match
      const a = this.selectedTile;
      const b = { row, col };

      if (this.board[a.row][a.col] !== this.board[b.row][b.col]) {
        // Different type → select the new tile instead
        this.deselectTile();
        this.selectTile(row, col);
        return;
      }

      const path = findPath(this.board, this.stageConfig.rows, this.stageConfig.cols, a, b);
      if (path) {
        this.matchPair(a, b, path);
      } else {
        // Same type but no valid path → select the new tile
        this.deselectTile();
        this.selectTile(row, col);
      }
    }
  }

  private selectTile(row: number, col: number): void {
    this.selectedTile = { row, col };

    // Show glow
    const x = this.gridStartX + col * this.cellSize + this.cellSize / 2;
    const y = this.gridStartY + row * this.cellSize + this.cellSize / 2;
    this.selectionHighlight = this.add.rectangle(
      x, y,
      this.cellSize + 2, this.cellSize + 2,
      SELECTED_GLOW_COLOR, 0.0,
    );
    this.selectionHighlight.setStrokeStyle(3, SELECTED_GLOW_COLOR, 1);
    this.selectionHighlight.setDepth(20);

    // Pulse animation
    this.tweens.add({
      targets: this.selectionHighlight,
      alpha: { from: 1, to: 0.5 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Slight scale pop on tile
    const container = this.tileContainers[row][col];
    if (container) {
      this.tweens.add({
        targets: container,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 120,
        ease: 'Back.easeOut',
      });
    }
  }

  private deselectTile(): void {
    if (this.selectedTile) {
      const { row, col } = this.selectedTile;
      const container = this.tileContainers[row][col];
      if (container) {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
        });
      }
    }
    if (this.selectionHighlight) {
      this.selectionHighlight.destroy();
      this.selectionHighlight = null;
    }
    this.selectedTile = null;
  }

  // --- Match pair ---

  private matchPair(
    a: { row: number; col: number },
    b: { row: number; col: number },
    path: PathPoint[],
  ): void {
    this.phase = GamePhase.ANIMATING;
    this.deselectTile();

    // Combo logic
    const now = this.time.now;
    if (now - this.lastMatchTime < COMBO_WINDOW_MS && this.lastMatchTime > 0) {
      this.combo++;
    } else {
      this.combo = 1;
    }
    this.lastMatchTime = now;

    // Score
    const pairScore = BASE_PAIR_SCORE + Math.max(0, this.combo - 1) * COMBO_BONUS;
    this.score += pairScore;

    // Draw path line
    this.drawPath(path);

    // Show score popup
    this.showMatchPopup(a, b, pairScore);

    // Remove tiles after brief delay for path visibility
    // Capture tile colors before board state changes
    const colorA = TILE_COLORS[(this.board[a.row][a.col] ?? 0) % TILE_COLORS.length];
    const colorB = TILE_COLORS[(this.board[b.row][b.col] ?? 0) % TILE_COLORS.length];

    this.time.delayedCall(300, () => {
      this.removeTileAnimated(a.row, a.col, colorA);
      this.removeTileAnimated(b.row, b.col, colorB);

      // Clear path
      this.pathGraphics?.clear();

      // Update board state
      this.board[a.row][a.col] = null;
      this.board[b.row][b.col] = null;

      this.emitScore();
      this.emitTilesUpdate();

      // Check win/lose
      const remaining = countRemaining(
        this.board,
        this.stageConfig.rows,
        this.stageConfig.cols,
      );

      if (remaining === 0) {
        this.stageClear();
        return;
      }

      // Check if valid moves exist
      if (!hasValidMoves(this.board, this.stageConfig.rows, this.stageConfig.cols)) {
        // Auto-shuffle
        this.doShuffle();
        // After shuffle, if still no moves → game over
        if (!hasValidMoves(this.board, this.stageConfig.rows, this.stageConfig.cols)) {
          this.gameOver();
          return;
        }
      }

      this.phase = GamePhase.PLAYING;
    });
  }

  // --- Path rendering ---

  private drawPath(path: PathPoint[]): void {
    if (!this.pathGraphics || path.length < 2) return;
    this.pathGraphics.clear();
    this.pathGraphics.lineStyle(4, PATH_LINE_COLOR, 0.9);
    this.pathGraphics.beginPath();

    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const x = this.gridStartX + p.col * this.cellSize + this.cellSize / 2;
      const y = this.gridStartY + p.row * this.cellSize + this.cellSize / 2;
      if (i === 0) {
        this.pathGraphics.moveTo(x, y);
      } else {
        this.pathGraphics.lineTo(x, y);
      }
    }
    this.pathGraphics.strokePath();
  }

  // --- Tile removal animation ---

  private removeTileAnimated(row: number, col: number, particleColor: number): void {
    const container = this.tileContainers[row][col];
    if (!container) return;

    const cx = container.x;
    const cy = container.y;

    // Particles
    this.spawnParticles(cx, cy, particleColor);

    // Shrink + fade
    this.tweens.add({
      targets: container,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 250,
      ease: 'Back.easeIn',
      onComplete: () => {
        container.destroy();
      },
    });

    this.tileContainers[row][col] = null;
  }

  // --- Score popup ---

  private showMatchPopup(
    a: { row: number; col: number },
    b: { row: number; col: number },
    score: number,
  ): void {
    const midX =
      this.gridStartX +
      ((a.col + b.col) / 2) * this.cellSize +
      this.cellSize / 2;
    const midY =
      this.gridStartY +
      ((a.row + b.row) / 2) * this.cellSize +
      this.cellSize / 2;

    const comboText = this.combo > 1 ? ` x${this.combo}` : '';
    const text = this.add
      .text(midX, midY, `+${score}${comboText}`, {
        fontSize: `${Math.min(18 + this.combo * 2, 32)}px`,
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
        color: '#ff7043',
        stroke: '#ffffff',
        strokeThickness: 3,
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

  // --- Particles ---

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
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  // --- Timer ---

  private updateTimer(): void {
    if (this.phase === GamePhase.GAME_OVER || this.phase === GamePhase.CLEAR) return;

    this.elapsedMs = this.time.now - this.startTime;
    this.game.events.emit('time-update', {
      elapsedMs: this.elapsedMs,
      timeLimit: this.stageConfig.timeLimit,
    });

    // Check time limit
    if (this.stageConfig.timeLimit > 0) {
      const elapsedSec = this.elapsedMs / 1000;
      if (elapsedSec >= this.stageConfig.timeLimit) {
        this.gameOver();
      }
    }
  }

  // --- Game flow ---

  private stageClear(): void {
    this.phase = GamePhase.CLEAR;

    this.cameras.main.flash(400, 255, 255, 200);

    // Emit events
    this.game.events.emit('stage-clear', {
      score: this.score,
      elapsedMs: this.elapsedMs,
    });
    this.gameConfig?.onClear?.();
  }

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;

    this.cameras.main.shake(300, 0.008);
    this.cameras.main.fade(600, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1) {
        this.game.events.emit('game-over', {
          score: this.score,
          elapsedMs: this.elapsedMs,
        });
        this.gameConfig?.onGameOver?.();
      }
    });
  }

  private emitScore(): void {
    this.game.events.emit('score-update', {
      score: this.score,
      combo: this.combo,
    });
  }

  private emitTilesUpdate(): void {
    const remaining = countRemaining(
      this.board,
      this.stageConfig.rows,
      this.stageConfig.cols,
    );
    this.game.events.emit('tiles-update', {
      remaining,
      total: this.totalTiles,
    });
  }

  // --- Public methods for React to call ---

  public doShuffle(): void {
    if (this.phase !== GamePhase.PLAYING) return;

    this.deselectTile();

    const { rows, cols } = this.stageConfig;
    const newTiles = shuffleRemaining(this.board, rows, cols);

    // Remove all existing tile visuals
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const container = this.tileContainers[r][c];
        if (container) {
          container.destroy();
          this.tileContainers[r][c] = null;
        }
      }
    }

    // Rebuild visuals
    for (const tile of newTiles) {
      this.createTileVisual(tile.row, tile.col, tile.type);
    }

    // Camera feedback
    this.cameras.main.shake(150, 0.003);
  }

  public doHint(): void {
    if (this.phase !== GamePhase.PLAYING) return;

    const { rows, cols } = this.stageConfig;
    const result = findAnyPair(this.board, rows, cols);
    if (!result) return;

    const { a, b } = result;

    // Briefly highlight both tiles
    const highlights: Phaser.GameObjects.Rectangle[] = [];
    for (const pos of [a, b]) {
      const x = this.gridStartX + pos.col * this.cellSize + this.cellSize / 2;
      const y = this.gridStartY + pos.row * this.cellSize + this.cellSize / 2;
      const h = this.add.rectangle(
        x, y,
        this.cellSize + 2, this.cellSize + 2,
        0x4fc3f7, 0.0,
      );
      h.setStrokeStyle(3, 0x4fc3f7, 1);
      h.setDepth(20);
      highlights.push(h);

      // Pulse
      this.tweens.add({
        targets: h,
        alpha: { from: 1, to: 0.3 },
        duration: 300,
        yoyo: true,
        repeat: 2,
        onComplete: () => h.destroy(),
      });
    }
  }

  // --- Helpers ---

  private pixelToGrid(
    px: number,
    py: number,
  ): { row: number; col: number } | null {
    const { rows, cols } = this.stageConfig;
    const col = Math.floor((px - this.gridStartX) / this.cellSize);
    const row = Math.floor((py - this.gridStartY) / this.cellSize);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    return { row, col };
  }

  shutdown(): void {
    this.tileContainers = [];
    this.selectionHighlight = null;
    this.pathGraphics = null;
    this.selectedTile = null;
  }
}
