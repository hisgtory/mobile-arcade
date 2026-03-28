/**
 * PlayScene for BlockRush
 *
 * 10x10 grid + 3 piece slots at bottom.
 * Drag pieces onto the grid. Full rows/cols clear.
 *
 * Events emitted:
 *   'score-update' — { score }
 *   'game-over'    — { score }
 */

import Phaser from 'phaser';
import {
  createBoard,
  canPlace,
  placePiece,
  findFullLines,
  clearLines,
  calcClearScore,
  canPlaceAny,
  type Board,
} from '../logic/board';
import { GamePhase, GRID_SIZE, randomPiece, type GameConfig, type PieceShape } from '../types';

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
  private pieceSlots: PieceSlot[] = [];

  // Drag state
  private dragPiece: DragPieceVisual | null = null;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { gameConfig?: GameConfig }): void {
    this.gameConfig = data?.gameConfig ?? (this.game as any).__blockrushConfig;
  }

  create(): void {
    const dpr = (this.game as any).__dpr || 1;
    const { width, height } = this.scale;

    this.phase = GamePhase.PLAYING;
    this.board = createBoard();
    this.score = 0;

    this.cameras.main.setBackgroundColor('#f0f2f5');

    // Calculate cell size to fit grid with space for pieces below
    const gridAreaH = height * 0.65;
    const padding = 16 * dpr;
    this.cellSize = Math.floor(Math.min((width - padding * 2) / GRID_SIZE, gridAreaH / GRID_SIZE));
    const gridTotalW = this.cellSize * GRID_SIZE;
    const gridTotalH = this.cellSize * GRID_SIZE;
    this.gridStartX = (width - gridTotalW) / 2;
    this.gridStartY = padding;

    // Draw grid background
    this.add.rectangle(
      this.gridStartX + gridTotalW / 2,
      this.gridStartY + gridTotalH / 2,
      gridTotalW + 4,
      gridTotalH + 4,
      GRID_BG_COLOR,
    ).setStrokeStyle(1, CELL_BORDER_COLOR);

    // Draw grid cells
    this.gridCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      this.gridCells[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = this.gridStartX + c * this.cellSize + this.cellSize / 2;
        const y = this.gridStartY + r * this.cellSize + this.cellSize / 2;
        const cell = this.add.rectangle(x, y, this.cellSize - 2, this.cellSize - 2, CELL_BG_COLOR);
        cell.setStrokeStyle(1, CELL_BORDER_COLOR, 0.5);
        this.gridCells[r][c] = cell;
      }
    }

    // Generate initial 3 pieces
    this.spawnPieceSlots();

    this.emitScore();
  }

  // -- PIECE SLOTS --

  private spawnPieceSlots(): void {
    // Clear old
    for (const slot of this.pieceSlots) {
      slot.destroy();
    }
    this.pieceSlots = [];

    const { width, height } = this.scale;
    const gridBottom = this.gridStartY + this.cellSize * GRID_SIZE;
    const slotAreaY = gridBottom + (height - gridBottom) / 2;
    const slotSpacing = width / 3;
    const previewCellSize = this.cellSize * 0.55;

    for (let i = 0; i < 3; i++) {
      const piece = randomPiece();
      const centerX = slotSpacing * (i + 0.5);
      const slot = new PieceSlot(this, centerX, slotAreaY, piece, previewCellSize, i);
      this.pieceSlots.push(slot);

      slot.onDragStart = () => this.startDrag(slot);
      slot.onDragMove = (px: number, py: number) => this.updateDrag(px, py);
      slot.onDragEnd = (px: number, py: number) => this.endDrag(px, py);
    }
  }

  // -- DRAG --

  private startDrag(slot: PieceSlot): void {
    if (this.phase !== GamePhase.PLAYING) return;

    this.dragPiece = new DragPieceVisual(this, slot.piece, this.cellSize);
    slot.setVisible(false);
  }

  private updateDrag(px: number, py: number): void {
    if (!this.dragPiece) return;
    // Offset up so finger doesn't cover the piece
    this.dragPiece.moveTo(px, py - this.cellSize * 2);

    // Highlight valid placement
    const gridPos = this.pixelToGrid(px, py - this.cellSize * 2);
    this.clearHighlights();
    if (gridPos && canPlace(this.board, this.dragPiece.piece, gridPos.row, gridPos.col)) {
      this.showHighlight(this.dragPiece.piece, gridPos.row, gridPos.col, true);
    }
  }

  private endDrag(px: number, py: number): void {
    if (!this.dragPiece) return;

    const gridPos = this.pixelToGrid(px, py - this.cellSize * 2);
    const slotIndex = this.dragPiece.slotIndex;
    const piece = this.dragPiece.piece;

    this.dragPiece.destroy();
    this.dragPiece = null;
    this.clearHighlights();

    if (gridPos && canPlace(this.board, piece, gridPos.row, gridPos.col)) {
      // Valid placement
      const placed = placePiece(this.board, piece, gridPos.row, gridPos.col);

      // Update visual grid
      for (const { row, col } of placed) {
        this.gridCells[row][col].setFillStyle(piece.color);
        this.gridCells[row][col].setStrokeStyle(1, 0xffffff, 0.3);
      }

      // Remove the used slot
      this.pieceSlots[slotIndex].markUsed();

      // Check for line clears
      const lines = findFullLines(this.board);
      if (lines.rows.length > 0 || lines.cols.length > 0) {
        const cleared = clearLines(this.board, lines);
        const lineCount = lines.rows.length + lines.cols.length;
        this.score += calcClearScore(lineCount, cleared.length);

        // Animate clear
        for (const { row, col } of cleared) {
          this.tweens.add({
            targets: this.gridCells[row][col],
            scaleX: 0,
            scaleY: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
              this.gridCells[row][col].setScale(1);
              this.gridCells[row][col].setFillStyle(CELL_BG_COLOR);
              this.gridCells[row][col].setStrokeStyle(1, CELL_BORDER_COLOR, 0.5);
            },
          });
        }

        this.score += placed.length; // bonus for placement
      } else {
        this.score += placed.length;
      }

      this.emitScore();

      // Check if all 3 pieces used → spawn new set
      if (this.pieceSlots.every((s) => s.used)) {
        this.time.delayedCall(300, () => {
          this.spawnPieceSlots();
          this.checkGameOver();
        });
      } else {
        this.checkGameOver();
      }
    } else {
      // Invalid — return piece to slot
      this.pieceSlots[slotIndex].setVisible(true);
    }
  }

  // -- GRID HELPERS --

  private pixelToGrid(px: number, py: number): { row: number; col: number } | null {
    const col = Math.floor((px - this.gridStartX) / this.cellSize);
    const row = Math.floor((py - this.gridStartY) / this.cellSize);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return { row, col };
  }

  private highlightRects: Phaser.GameObjects.Rectangle[] = [];

  private showHighlight(piece: PieceShape, startRow: number, startCol: number, valid: boolean): void {
    for (const cell of piece.cells) {
      const r = startRow + cell.row;
      const c = startCol + cell.col;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        const x = this.gridStartX + c * this.cellSize + this.cellSize / 2;
        const y = this.gridStartY + r * this.cellSize + this.cellSize / 2;
        const rect = this.add.rectangle(x, y, this.cellSize - 2, this.cellSize - 2, piece.color, 0.3);
        this.highlightRects.push(rect);
      }
    }
  }

  private clearHighlights(): void {
    for (const rect of this.highlightRects) rect.destroy();
    this.highlightRects = [];
  }

  // -- GAME FLOW --

  private checkGameOver(): void {
    const remaining = this.pieceSlots.filter((s) => !s.used).map((s) => s.piece);
    if (remaining.length > 0 && !canPlaceAny(this.board, remaining)) {
      this.gameOver();
    }
  }

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;
    this.gameConfig?.onGameOver?.();
    this.game.events.emit('game-over', { score: this.score });
  }

  private emitScore(): void {
    this.game.events.emit('score-update', { score: this.score });
  }

  shutdown(): void {
    this.pieceSlots = [];
    this.gridCells = [];
    this.highlightRects = [];
  }
}

// -- HELPER CLASSES --

class PieceSlot {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  public piece: PieceShape;
  public used: boolean = false;
  public slotIndex: number;

  onDragStart?: () => void;
  onDragMove?: (px: number, py: number) => void;
  onDragEnd?: (px: number, py: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, piece: PieceShape, cellSize: number, index: number) {
    this.scene = scene;
    this.piece = piece;
    this.slotIndex = index;

    this.container = scene.add.container(x, y);

    // Calculate piece bounds for centering
    const maxR = Math.max(...piece.cells.map((c) => c.row));
    const maxC = Math.max(...piece.cells.map((c) => c.col));
    const offsetX = -(maxC + 1) * cellSize / 2;
    const offsetY = -(maxR + 1) * cellSize / 2;

    for (const cell of piece.cells) {
      const rect = scene.add.rectangle(
        offsetX + cell.col * cellSize + cellSize / 2,
        offsetY + cell.row * cellSize + cellSize / 2,
        cellSize - 2,
        cellSize - 2,
        piece.color,
      );
      rect.setStrokeStyle(1, 0xffffff, 0.3);
      this.container.add(rect);
    }

    // Make interactive
    const hitW = (maxC + 1) * cellSize + 20;
    const hitH = (maxR + 1) * cellSize + 20;
    const hitArea = scene.add.rectangle(0, 0, hitW, hitH, 0x000000, 0);
    hitArea.setInteractive({ draggable: true });
    this.container.add(hitArea);

    hitArea.on('dragstart', () => {
      this.onDragStart?.();
    });

    hitArea.on('drag', (_: any, dragX: number, dragY: number) => {
      this.onDragMove?.(this.container.x + dragX, this.container.y + dragY);
    });

    hitArea.on('dragend', () => {
      const pointer = scene.input.activePointer;
      this.onDragEnd?.(pointer.x, pointer.y);
    });

    scene.input.setDraggable(hitArea);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  markUsed(): void {
    this.used = true;
    this.container.setVisible(false);
  }

  destroy(): void {
    this.container.destroy();
  }
}

class DragPieceVisual {
  private container: Phaser.GameObjects.Container;
  public piece: PieceShape;
  public slotIndex: number = 0;

  constructor(scene: Phaser.Scene, piece: PieceShape, cellSize: number) {
    this.piece = piece;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    for (const cell of piece.cells) {
      const rect = scene.add.rectangle(
        cell.col * cellSize + cellSize / 2,
        cell.row * cellSize + cellSize / 2,
        cellSize - 2,
        cellSize - 2,
        piece.color,
        0.8,
      );
      rect.setStrokeStyle(1, 0xffffff, 0.4);
      this.container.add(rect);
    }
  }

  moveTo(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  destroy(): void {
    this.container.destroy();
  }
}
