/**
 * PlayScene for Block Puzzle
 *
 * 8×8 grid with drag-and-drop piece placement.
 * Phaser handles board + piece rendering only (ADR-002).
 *
 * Events emitted:
 *   'state-update'   — { score, combo, phase }
 *   'piece-placed'   — (haptic: piece drop)
 *   'line-cleared'   — (haptic: line clear)
 *   'combo-cleared'  — (haptic: multi-line clear)
 *   'game-over'      — { score }
 */

import Phaser from 'phaser';
import {
  BOARD_ROWS,
  BOARD_COLS,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  JEWEL_COLORS,
  type Piece,
  type PieceShape,
  type GameConfig,
  type GamePhase,
} from '../types';
import {
  createBoard,
  canPlace,
  placePiece,
  checkAndClear,
  canPlaceAny,
  generatePieces,
  pieceSize,
  calculateClearScore,
  type Board,
} from '../logic/board';

// ─── Colors ──────────────────────────────────────────────

const BG_COLOR = 0xf0f2f5;
const GRID_BG = 0xe5e7eb;
const EMPTY_CELL = 0xf3f4f6;
const GRID_LINE = 0xd1d5db;
const PREVIEW_VALID = 0x86efac;
const PREVIEW_INVALID = 0xfca5a5;

const DRAG_OFFSET_Y = -60; // Lift piece above finger

export class PlayScene extends Phaser.Scene {
  private config!: GameConfig;
  private dpr = 1;

  private board!: Board;
  private phase: GamePhase = 'playing';
  private score = 0;
  private combo = 0;

  // Candidate pieces
  private candidates: (Piece | null)[] = [];
  private candidateGraphics: Phaser.GameObjects.Container[] = [];

  // Grid rendering
  private cellSize = 0;
  private gridStartX = 0;
  private gridStartY = 0;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private cellRects: Phaser.GameObjects.Rectangle[][] = [];

  // Drag state
  private dragging = false;
  private dragIndex = -1;
  private dragContainer: Phaser.GameObjects.Container | null = null;
  private previewCells: Phaser.GameObjects.Rectangle[] = [];
  private lastPreviewRow = -1;
  private lastPreviewCol = -1;

  // Input lock
  private inputLocked = false;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    this.board = createBoard();
    this.phase = 'playing';
    this.score = 0;
    this.combo = 0;
    this.dragging = false;
    this.dragIndex = -1;
    this.inputLocked = false;

    this.cameras.main.setBackgroundColor('#f0f2f5');

    this.calculateLayout();
    this.drawBoard();
    this.spawnCandidates();
    this.setupInput();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private calculateLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const padding = 16 * this.dpr;
    const availW = w - padding * 2;

    this.cellSize = Math.floor(availW / BOARD_COLS);
    const gridW = this.cellSize * BOARD_COLS;
    this.gridStartX = (w - gridW) / 2;
    this.gridStartY = 16 * this.dpr;
  }

  // ─── Board Drawing ────────────────────────────────────

  private drawBoard() {
    this.boardGraphics?.destroy();
    this.boardGraphics = this.add.graphics();

    const gw = this.cellSize * BOARD_COLS;
    const gh = this.cellSize * BOARD_ROWS;

    // Grid background
    this.boardGraphics.fillStyle(GRID_BG, 1);
    this.boardGraphics.fillRect(this.gridStartX, this.gridStartY, gw, gh);

    // Cell rects
    this.cellRects = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      this.cellRects[r] = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        const x = this.gridStartX + c * this.cellSize + 1;
        const y = this.gridStartY + r * this.cellSize + 1;
        const size = this.cellSize - 2;

        const rect = this.add.rectangle(x + size / 2, y + size / 2, size, size, EMPTY_CELL);
        rect.setStrokeStyle(0.5, GRID_LINE, 0.3);
        this.cellRects[r][c] = rect;
      }
    }

    this.updateBoardDisplay();
  }

  private updateBoardDisplay() {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const val = this.board[r][c];
        const rect = this.cellRects[r][c];
        if (val !== 0) {
          rect.setFillStyle(val);
          rect.setAlpha(1);
        } else {
          rect.setFillStyle(EMPTY_CELL);
          rect.setAlpha(1);
        }
      }
    }
  }

  // ─── Candidates ───────────────────────────────────────

  private spawnCandidates() {
    // Clear old
    for (const cg of this.candidateGraphics) cg.destroy();
    this.candidateGraphics = [];

    this.candidates = generatePieces(3);
    this.drawCandidates();
  }

  private drawCandidates() {
    for (const cg of this.candidateGraphics) cg.destroy();
    this.candidateGraphics = [];

    const w = DEFAULT_WIDTH * this.dpr;
    const gridBottom = this.gridStartY + this.cellSize * BOARD_ROWS;
    const candidateY = gridBottom + 40 * this.dpr;
    const spacing = w / 3;
    const previewCellSize = Math.floor(this.cellSize * 0.55);

    for (let i = 0; i < this.candidates.length; i++) {
      const piece = this.candidates[i];
      if (!piece) {
        this.candidateGraphics.push(this.add.container(0, 0));
        continue;
      }

      const cx = spacing * i + spacing / 2;
      const container = this.add.container(cx, candidateY);

      // Calculate piece bounds for centering
      const rows = piece.shape.length;
      const cols = piece.shape[0].length;
      const pw = cols * previewCellSize;
      const ph = rows * previewCellSize;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!piece.shape[r][c]) continue;
          const bx = c * previewCellSize - pw / 2 + previewCellSize / 2;
          const by = r * previewCellSize - ph / 2 + previewCellSize / 2;
          const block = new Phaser.GameObjects.Rectangle(
            this,
            bx,
            by,
            previewCellSize - 2,
            previewCellSize - 2,
            piece.color,
          );
          block.setStrokeStyle(1, 0x00000020);
          container.add(block);
        }
      }

      container.setSize(pw + 10 * this.dpr, ph + 10 * this.dpr);
      container.setInteractive();
      this.candidateGraphics.push(container);
    }
  }

  // ─── Input / Drag ─────────────────────────────────────

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'playing' || this.inputLocked) return;
      this.tryStartDrag(pointer);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.updateDrag(pointer);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.endDrag(pointer);
    });
  }

  private tryStartDrag(pointer: Phaser.Input.Pointer) {
    for (let i = 0; i < this.candidateGraphics.length; i++) {
      const cg = this.candidateGraphics[i];
      if (!this.candidates[i]) continue;

      const bounds = cg.getBounds();
      if (bounds.contains(pointer.x, pointer.y)) {
        this.dragIndex = i;
        this.dragging = true;
        cg.setAlpha(0.3);
        this.createDragVisual(pointer);
        return;
      }
    }
  }

  private createDragVisual(pointer: Phaser.Input.Pointer) {
    const piece = this.candidates[this.dragIndex]!;
    this.dragContainer = this.add.container(pointer.x, pointer.y + DRAG_OFFSET_Y * this.dpr);
    this.dragContainer.setDepth(100);

    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const cs = this.cellSize;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!piece.shape[r][c]) continue;
        const bx = c * cs - (cols * cs) / 2 + cs / 2;
        const by = r * cs - (rows * cs) / 2 + cs / 2;
        const block = new Phaser.GameObjects.Rectangle(this, bx, by, cs - 2, cs - 2, piece.color, 0.85);
        this.dragContainer.add(block);
      }
    }
  }

  private updateDrag(pointer: Phaser.Input.Pointer) {
    if (!this.dragContainer) return;
    this.dragContainer.setPosition(pointer.x, pointer.y + DRAG_OFFSET_Y * this.dpr);

    // Grid snap preview
    const piece = this.candidates[this.dragIndex]!;
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;

    // Find grid position: center of piece maps to pointer
    const gridCol = Math.round(
      (pointer.x - this.gridStartX - (cols * this.cellSize) / 2) / this.cellSize,
    );
    const gridRow = Math.round(
      (pointer.y + DRAG_OFFSET_Y * this.dpr - this.gridStartY - (rows * this.cellSize) / 2) / this.cellSize,
    );

    if (gridRow === this.lastPreviewRow && gridCol === this.lastPreviewCol) return;
    this.lastPreviewRow = gridRow;
    this.lastPreviewCol = gridCol;

    this.clearPreview();

    const valid = canPlace(this.board, piece.shape, gridRow, gridCol);
    const color = valid ? PREVIEW_VALID : PREVIEW_INVALID;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!piece.shape[r][c]) continue;
        const br = gridRow + r;
        const bc = gridCol + c;
        if (br >= 0 && br < BOARD_ROWS && bc >= 0 && bc < BOARD_COLS) {
          const x = this.gridStartX + bc * this.cellSize + 1;
          const y = this.gridStartY + br * this.cellSize + 1;
          const size = this.cellSize - 2;
          const preview = this.add.rectangle(x + size / 2, y + size / 2, size, size, color, 0.5);
          preview.setDepth(50);
          this.previewCells.push(preview);
        }
      }
    }
  }

  private endDrag(_pointer: Phaser.Input.Pointer) {
    const piece = this.candidates[this.dragIndex]!;
    const gridRow = this.lastPreviewRow;
    const gridCol = this.lastPreviewCol;

    this.clearPreview();
    this.dragContainer?.destroy();
    this.dragContainer = null;

    if (canPlace(this.board, piece.shape, gridRow, gridCol)) {
      // Haptic: piece placed (before animation)
      this.game.events.emit('piece-placed');

      placePiece(this.board, piece.shape, gridRow, gridCol, piece.color);
      this.score += pieceSize(piece.shape) * 10;

      // Remove used candidate
      this.candidates[this.dragIndex] = null;
      this.candidateGraphics[this.dragIndex].setAlpha(0);

      this.updateBoardDisplay();

      // Check line clears
      const { cleared, lines } = checkAndClear(this.board);
      if (lines > 0) {
        this.combo++;
        const clearScore = calculateClearScore(lines, this.combo);
        this.score += clearScore;

        // Haptic: line/combo clear
        if (lines >= 2) {
          this.game.events.emit('combo-cleared');
        } else {
          this.game.events.emit('line-cleared');
        }

        this.animateClear(cleared);
      } else {
        this.combo = 0;
      }

      // Refill if all 3 used
      if (this.candidates.every((p) => p === null)) {
        this.spawnCandidates();
      }

      // Check game over
      const remaining = this.candidates.filter((p): p is Piece => p !== null);
      if (!canPlaceAny(this.board, remaining)) {
        this.phase = 'over';
        this.game.events.emit('game-over', { score: this.score });
      }

      this.emitState();
    } else {
      // Invalid placement — restore candidate visual
      this.candidateGraphics[this.dragIndex]?.setAlpha(1);
    }

    this.dragging = false;
    this.dragIndex = -1;
    this.lastPreviewRow = -1;
    this.lastPreviewCol = -1;
  }

  private clearPreview() {
    for (const p of this.previewCells) p.destroy();
    this.previewCells = [];
  }

  // ─── Effects ──────────────────────────────────────────

  private animateClear(cells: { row: number; col: number }[]) {
    this.inputLocked = true;

    for (const { row, col } of cells) {
      const rect = this.cellRects[row][col];
      this.tweens.add({
        targets: rect,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 250,
        ease: 'Power2',
        onComplete: () => {
          rect.setScale(1);
          rect.setAlpha(1);
          rect.setFillStyle(EMPTY_CELL);
        },
      });
    }

    this.time.delayedCall(300, () => {
      this.updateBoardDisplay();
      this.inputLocked = false;
    });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('state-update', {
      score: this.score,
      combo: this.combo,
      phase: this.phase,
    });
  }

  shutdown() {
    this.clearPreview();
    this.dragContainer?.destroy();
    this.cellRects = [];
    this.candidateGraphics = [];
  }
}
