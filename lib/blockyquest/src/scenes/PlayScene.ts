/**
 * PlayScene for BlockyQuest
 *
 * Stage-based block puzzle: 10x10 grid + 3 piece slots.
 * Drag pieces onto the grid. Full rows/cols clear.
 * Reach the target score within the move limit to clear the stage.
 *
 * Events emitted:
 *   'score-update' — { score, combo }
 *   'moves-update' — { movesLeft, maxMoves }
 *   'stage-clear'  — { score, movesUsed }
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
import { getStageConfig } from '../logic/stage';
import { GamePhase, GRID_SIZE, randomPiece, type GameConfig, type PieceShape, type StageConfig } from '../types';

const CELL_BORDER_COLOR = 0xe5e7eb;
const CELL_BG_COLOR = 0xffffff;
const GRID_BG_COLOR = 0xf3f4f6;

export class PlayScene extends Phaser.Scene {
  private gameConfig?: GameConfig;
  private stageConfig!: StageConfig;
  private phase: GamePhase = GamePhase.PLAYING;
  private board!: Board;
  private score: number = 0;
  private movesLeft: number = 0;
  private movesUsed: number = 0;
  private consecutiveClears: number = 0;

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

  init(data: { stage?: number }): void {
    this.gameConfig = (this.game as any).__blockyquestConfig;
    const stage = data?.stage ?? this.gameConfig?.stage ?? 1;
    this.stageConfig = getStageConfig(stage);
  }

  create(): void {
    const dpr = (this.game as any).__dpr || 1;
    const { width, height } = this.scale;

    this.phase = GamePhase.PLAYING;
    this.board = createBoard();
    this.score = 0;
    this.movesLeft = this.stageConfig.maxMoves;
    this.movesUsed = 0;
    this.consecutiveClears = 0;

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
    this.emitMoves();
  }

  // -- PIECE SLOTS --

  private spawnPieceSlots(): void {
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
    this.dragPiece.slotIndex = slot.slotIndex;
    slot.setVisible(false);
  }

  private updateDrag(px: number, py: number): void {
    if (!this.dragPiece) return;
    this.dragPiece.moveTo(px, py - this.cellSize * 2);

    const gridPos = this.pixelToGrid(px, py - this.cellSize * 2);
    this.clearHighlights();
    if (gridPos && canPlace(this.board, this.dragPiece.piece, gridPos.row, gridPos.col)) {
      this.showHighlight(this.dragPiece.piece, gridPos.row, gridPos.col);
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
      // Valid placement — consume a move
      const placed = placePiece(this.board, piece, gridPos.row, gridPos.col);
      this.movesUsed++;
      this.movesLeft--;

      // Update visual grid
      for (const { row, col } of placed) {
        this.gridCells[row][col].setFillStyle(piece.color);
        this.gridCells[row][col].setStrokeStyle(1, 0xffffff, 0.3);
      }

      this.pieceSlots[slotIndex].markUsed();

      // Placement pop animation
      for (const { row, col } of placed) {
        const cell = this.gridCells[row][col];
        cell.setScale(0.5);
        this.tweens.add({
          targets: cell,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Back.easeOut',
        });
      }

      // Check for line clears
      const lines = findFullLines(this.board);
      if (lines.rows.length > 0 || lines.cols.length > 0) {
        this.phase = GamePhase.ANIMATING;
        this.consecutiveClears++;
        const cleared = clearLines(this.board, lines);
        const lineCount = lines.rows.length + lines.cols.length;
        const clearScore = calcClearScore(lineCount, cleared.length) * Math.max(1, this.consecutiveClears);
        this.score += clearScore + placed.length;

        const shakeIntensity = Math.min(3 + this.consecutiveClears * 2, 12);
        this.cameras.main.shake(200, shakeIntensity / 1000);

        for (const { row, col } of cleared) {
          this.gridCells[row][col].setFillStyle(0xffffff);
        }

        this.showComboText(lineCount, this.consecutiveClears, clearScore);

        this.time.delayedCall(100, () => {
          let completed = 0;
          cleared.forEach(({ row, col }, i) => {
            this.time.delayedCall(i * 20, () => {
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
                duration: 250,
                ease: 'Back.easeIn',
                onComplete: () => {
                  cell.setScale(1);
                  cell.setAlpha(1);
                  cell.setFillStyle(CELL_BG_COLOR);
                  cell.setStrokeStyle(1, CELL_BORDER_COLOR, 0.5);
                  completed++;
                  if (completed === cleared.length) {
                    this.phase = GamePhase.PLAYING;
                    this.checkStageResult();
                  }
                },
              });
            });
          });
        });
      } else {
        this.consecutiveClears = 0;
        this.score += placed.length;
        this.checkStageResult();
      }

      this.emitScore();
      this.emitMoves();

      // Check if all 3 pieces used → spawn new set
      if (this.pieceSlots.every((s) => s.used)) {
        this.time.delayedCall(300, () => {
          if (this.phase === GamePhase.CLEAR || this.phase === GamePhase.GAME_OVER) return;
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

  private showHighlight(piece: PieceShape, startRow: number, startCol: number): void {
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

  // -- JUICE EFFECTS --

  private showComboText(lineCount: number, combo: number, score: number): void {
    const { width } = this.scale;
    const gridCenterY = this.gridStartY + (this.cellSize * GRID_SIZE) / 2;

    const messages = ['Nice!', 'Great!', 'Awesome!', 'AMAZING!', 'INCREDIBLE!'];
    const msgIdx = Math.min(combo - 1, messages.length - 1);
    const msg = lineCount > 1 ? `${messages[msgIdx]} x${lineCount}` : messages[msgIdx];

    const colors = [0xfa6c41, 0x2563eb, 0x8b5cf6, 0xf43f5e, 0xd97706];
    const color = colors[Math.min(combo - 1, colors.length - 1)];

    const text = this.add.text(width / 2, gridCenterY - 30, msg, {
      fontSize: `${Math.min(28 + combo * 4, 48)}px`,
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200);

    const scoreText = this.add.text(width / 2, gridCenterY + 10, `+${score}`, {
      fontSize: '20px',
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
      color: '#374151',
    }).setOrigin(0.5).setDepth(200);

    for (const t of [text, scoreText]) {
      this.tweens.add({
        targets: t,
        y: t.y - 60,
        alpha: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 800,
        ease: 'Power2',
        onComplete: () => t.destroy(),
      });
    }
  }

  private spawnParticles(x: number, y: number, color: number): void {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 80 + Math.random() * 60;
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

  // -- GAME FLOW --

  private checkStageResult(): void {
    if (this.phase === GamePhase.CLEAR || this.phase === GamePhase.GAME_OVER) return;

    // Win: reached target score
    if (this.score >= this.stageConfig.targetScore) {
      this.stageClear();
      return;
    }

    // Lose: out of moves
    if (this.movesLeft <= 0) {
      this.gameOver();
    }
  }

  private checkGameOver(): void {
    if (this.phase === GamePhase.CLEAR || this.phase === GamePhase.GAME_OVER) return;

    const remaining = this.pieceSlots.filter((s) => !s.used).map((s) => s.piece);
    if (remaining.length > 0 && !canPlaceAny(this.board, remaining)) {
      this.gameOver();
    }
  }

  private stageClear(): void {
    this.phase = GamePhase.CLEAR;
    this.game.events.emit('stage-clear', { score: this.score, movesUsed: this.movesUsed });
  }

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;

    this.cameras.main.shake(300, 0.008);
    this.cameras.main.fade(600, 0, 0, 0, false, (_cam: any, progress: number) => {
      if (progress >= 1) {
        this.game.events.emit('game-over', { score: this.score });
      }
    });
  }

  private emitScore(): void {
    this.game.events.emit('score-update', { score: this.score, combo: this.consecutiveClears });
  }

  private emitMoves(): void {
    this.game.events.emit('moves-update', { movesLeft: this.movesLeft, maxMoves: this.stageConfig.maxMoves });
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

    const hitW = (maxC + 1) * cellSize + 20;
    const hitH = (maxR + 1) * cellSize + 20;
    const hitArea = scene.add.rectangle(0, 0, hitW, hitH, 0x000000, 0);
    hitArea.setInteractive({ draggable: true });
    this.container.add(hitArea);

    hitArea.on('dragstart', () => {
      this.onDragStart?.();
    });

    hitArea.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.onDragMove?.(_pointer.x, _pointer.y);
    });

    hitArea.on('dragend', (_pointer: Phaser.Input.Pointer) => {
      this.onDragEnd?.(_pointer.x, _pointer.y);
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
