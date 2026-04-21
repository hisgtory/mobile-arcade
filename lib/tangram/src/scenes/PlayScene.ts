import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  getStageConfig,
  isUpTriangle,
  getRotatedCells,
  getRotationVariants,
  type GameConfig,
  type BoardState,
  type PieceDef,
  type TriCell,
} from '../types';
import {
  createBoard,
  canPlace,
  placePiece,
  removePiece,
  resetBoard,
  isWon,
  getTriangleVertices,
  getTriangleCenter,
  pixelToCell,
} from '../logic/board';

type GamePhase = 'idle' | 'dragging' | 'celebrating';

const SILHOUETTE_COLOR = 0xe2e8f0;
const SILHOUETTE_BORDER = 0x94a3b8;
const GRID_LINE_COLOR = 0xcbd5e1;
const EMPTY_BG = 0xf8fafc;

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;
  private stageConfig!: ReturnType<typeof getStageConfig>;

  // Layout
  private triSize = 40;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  private trayY = 0;

  // Pieces
  private availablePieces: PieceDef[] = [];
  private placedPieceIds = new Set<number>();
  /** Current rotation index per piece id */
  private pieceRotations = new Map<number, number>();

  // Drag state
  private phase: GamePhase = 'idle';
  private dragPiece: PieceDef | null = null;
  private dragCells: TriCell[] = [];
  private dragGraphics: Phaser.GameObjects.Graphics | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // Visuals
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private piecesGraphics!: Phaser.GameObjects.Graphics;
  private trayGraphics!: Phaser.GameObjects.Graphics;
  private highlightGraphics!: Phaser.GameObjects.Graphics;

  // Stats
  private score = 0;
  private moves = 0;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    const stage = this.config.stage ?? 1;
    this.stageConfig = getStageConfig(stage);
    this.board = createBoard(this.stageConfig);
    this.availablePieces = this.stageConfig.pieces.map((p) => ({
      ...p,
      cells: p.cells.map((c) => ({ ...c })),
    }));
    this.placedPieceIds = new Set();
    this.pieceRotations = new Map();
    for (const p of this.availablePieces) {
      this.pieceRotations.set(p.id, 0);
    }
    this.phase = 'idle';
    this.dragPiece = null;
    this.dragCells = [];
    this.score = 0;
    this.moves = 0;

    this.calculateLayout();

    // Create graphics layers
    this.boardGraphics = this.add.graphics();
    this.piecesGraphics = this.add.graphics();
    this.trayGraphics = this.add.graphics();
    this.highlightGraphics = this.add.graphics();

    this.drawBoard();
    this.drawTray();
    this.setupInput();
    this.emitState();
  }

  // ─── Layout Calculation ────────────────────────────────

  private calculateLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const scale = this.dpr;

    // Calculate triangle size to fit the grid in ~55% of screen height
    const availableH = h * 0.55;
    const availableW = w * 0.9;

    const triH = availableH / (this.stageConfig.gridRows + 1);

    // triSize from height: h = triSize * sqrt(3) / 2
    const triSizeFromH = (triH * 2) / Math.sqrt(3);

    // triSize from width: total width = (gridCols + 1) * triSize / 2
    const triSizeFromW = (availableW * 2) / (this.stageConfig.gridCols + 1);

    // No extra * scale — w and h already include dpr
    this.triSize = Math.min(triSizeFromH, triSizeFromW);

    // Center the grid
    const gridW = (this.stageConfig.gridCols + 1) * (this.triSize / 2);
    const gridH = this.stageConfig.gridRows * (this.triSize * Math.sqrt(3)) / 2;

    this.gridOffsetX = (w - gridW) / 2;
    this.gridOffsetY = (h * 0.05) + ((availableH - gridH) / 2);
    this.trayY = this.gridOffsetY + gridH + 30 * scale;
  }

  // ─── Drawing ───────────────────────────────────────────

  private drawBoard() {
    this.boardGraphics.clear();
    this.piecesGraphics.clear();

    const { gridRows, gridCols, silhouette, grid } = this.board;

    // Draw silhouette cells
    const silhouetteSet = new Set(silhouette.map((c) => `${c.row},${c.col}`));

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const verts = getTriangleVertices(r, c, this.triSize, this.gridOffsetX, this.gridOffsetY);

        if (silhouetteSet.has(`${r},${c}`)) {
          // Silhouette cell
          if (grid[r][c] >= 0) {
            // Filled with a piece
            const placed = this.board.placedPieces.find((p) => p.pieceId === grid[r][c]);
            if (placed) {
              const hex = parseInt(placed.color.replace('#', ''), 16);
              this.piecesGraphics.fillStyle(hex, 0.85);
              this.piecesGraphics.beginPath();
              this.piecesGraphics.moveTo(verts[0].x, verts[0].y);
              this.piecesGraphics.lineTo(verts[1].x, verts[1].y);
              this.piecesGraphics.lineTo(verts[2].x, verts[2].y);
              this.piecesGraphics.closePath();
              this.piecesGraphics.fillPath();

              this.piecesGraphics.lineStyle(1, 0xffffff, 0.4);
              this.piecesGraphics.beginPath();
              this.piecesGraphics.moveTo(verts[0].x, verts[0].y);
              this.piecesGraphics.lineTo(verts[1].x, verts[1].y);
              this.piecesGraphics.lineTo(verts[2].x, verts[2].y);
              this.piecesGraphics.closePath();
              this.piecesGraphics.strokePath();
            }
          } else {
            // Empty silhouette cell
            this.boardGraphics.fillStyle(SILHOUETTE_COLOR, 1);
            this.boardGraphics.beginPath();
            this.boardGraphics.moveTo(verts[0].x, verts[0].y);
            this.boardGraphics.lineTo(verts[1].x, verts[1].y);
            this.boardGraphics.lineTo(verts[2].x, verts[2].y);
            this.boardGraphics.closePath();
            this.boardGraphics.fillPath();

            this.boardGraphics.lineStyle(1.5, SILHOUETTE_BORDER, 0.6);
            this.boardGraphics.beginPath();
            this.boardGraphics.moveTo(verts[0].x, verts[0].y);
            this.boardGraphics.lineTo(verts[1].x, verts[1].y);
            this.boardGraphics.lineTo(verts[2].x, verts[2].y);
            this.boardGraphics.closePath();
            this.boardGraphics.strokePath();
          }
        } else {
          // Background grid cell (very subtle)
          this.boardGraphics.lineStyle(0.5, GRID_LINE_COLOR, 0.2);
          this.boardGraphics.beginPath();
          this.boardGraphics.moveTo(verts[0].x, verts[0].y);
          this.boardGraphics.lineTo(verts[1].x, verts[1].y);
          this.boardGraphics.lineTo(verts[2].x, verts[2].y);
          this.boardGraphics.closePath();
          this.boardGraphics.strokePath();
        }
      }
    }
  }

  private drawTray() {
    this.trayGraphics.clear();
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * this.dpr;

    // Draw tray background
    this.trayGraphics.fillStyle(EMPTY_BG, 1);
    this.trayGraphics.fillRoundedRect(
      20 * scale,
      this.trayY - 10 * scale,
      w - 40 * scale,
      120 * scale,
      12 * scale,
    );
    this.trayGraphics.lineStyle(1, SILHOUETTE_BORDER, 0.3);
    this.trayGraphics.strokeRoundedRect(
      20 * scale,
      this.trayY - 10 * scale,
      w - 40 * scale,
      120 * scale,
      12 * scale,
    );

    // Draw available pieces in tray
    const unplaced = this.availablePieces.filter((p) => !this.placedPieceIds.has(p.id));
    if (unplaced.length === 0) return;

    const trayPieceSize = this.triSize * 0.55;
    const spacing = 20 * scale;
    const totalW = unplaced.length * (trayPieceSize * 3) + (unplaced.length - 1) * spacing;
    let startX = (w - totalW) / 2;

    for (const piece of unplaced) {
      const rotation = this.pieceRotations.get(piece.id) ?? 0;
      const cells = getRotatedCells(piece.cells, rotation);
      this.drawPieceInTray(piece, cells, startX, this.trayY + 30 * scale, trayPieceSize);

      // Draw rotation indicator (small arc icon)
      const numVariants = getRotationVariants(piece.cells).length;
      if (numVariants > 1) {
        const cx = startX + trayPieceSize * 1.5;
        const cy = this.trayY + 80 * scale;
        this.trayGraphics.lineStyle(1.5, 0x6b7280, 0.6);
        this.trayGraphics.beginPath();
        this.trayGraphics.arc(cx, cy, 6 * scale, 0, Math.PI * 1.5);
        this.trayGraphics.strokePath();
        // Arrow tip
        this.trayGraphics.fillStyle(0x6b7280, 0.6);
        this.trayGraphics.fillTriangle(
          cx - 3 * scale, cy - 6 * scale,
          cx + 3 * scale, cy - 6 * scale,
          cx, cy - 10 * scale,
        );
      }

      startX += trayPieceSize * 3 + spacing;
    }
  }

  private drawPieceInTray(piece: PieceDef, cells: TriCell[], x: number, y: number, size: number) {
    const hex = parseInt(piece.color.replace('#', ''), 16);

    for (const cell of cells) {
      const verts = getTriangleVertices(cell.row, cell.col, size, x, y);

      this.trayGraphics.fillStyle(hex, 0.9);
      this.trayGraphics.beginPath();
      this.trayGraphics.moveTo(verts[0].x, verts[0].y);
      this.trayGraphics.lineTo(verts[1].x, verts[1].y);
      this.trayGraphics.lineTo(verts[2].x, verts[2].y);
      this.trayGraphics.closePath();
      this.trayGraphics.fillPath();

      this.trayGraphics.lineStyle(1, 0xffffff, 0.5);
      this.trayGraphics.beginPath();
      this.trayGraphics.moveTo(verts[0].x, verts[0].y);
      this.trayGraphics.lineTo(verts[1].x, verts[1].y);
      this.trayGraphics.lineTo(verts[2].x, verts[2].y);
      this.trayGraphics.closePath();
      this.trayGraphics.strokePath();
    }
  }

  // ─── Input Handling ────────────────────────────────────

  private setupInput() {
    let pointerDownTime = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'idle') return;

      pointerDownTime = Date.now();
      pointerDownX = pointer.x;
      pointerDownY = pointer.y;

      // Check if tapping a placed piece on the board (to remove it)
      const boardCell = pixelToCell(
        pointer.x, pointer.y,
        this.board.gridRows, this.board.gridCols,
        this.triSize, this.gridOffsetX, this.gridOffsetY,
      );

      if (boardCell && this.board.grid[boardCell.row][boardCell.col] >= 0) {
        const pieceId = this.board.grid[boardCell.row][boardCell.col];
        this.board = removePiece(this.board, pieceId);
        this.placedPieceIds.delete(pieceId);
        this.drawBoard();
        this.drawTray();
        this.emitState();
        return;
      }

      // Check if tapping a piece in the tray
      const trayPiece = this.findTrayPiece(pointer.x, pointer.y);
      if (trayPiece) {
        this.startDrag(trayPiece, pointer.x, pointer.y);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'dragging' || !this.dragPiece) return;
      this.updateDrag(pointer.x, pointer.y);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'dragging' || !this.dragPiece) {
        // Check if this was a quick tap on tray piece (for rotation)
        const elapsed = Date.now() - pointerDownTime;
        const dx = pointer.x - pointerDownX;
        const dy = pointer.y - pointerDownY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (elapsed < 200 && dist < 10 * this.dpr && this.phase === 'idle') {
          const trayPiece = this.findTrayPiece(pointer.x, pointer.y);
          if (trayPiece) {
            this.rotateTrayPiece(trayPiece);
          }
        }
        return;
      }
      this.endDrag(pointer.x, pointer.y);
    });
  }

  /** Rotate a piece in the tray by cycling to next variant */
  private rotateTrayPiece(piece: PieceDef) {
    const current = this.pieceRotations.get(piece.id) ?? 0;
    const variants = getRotationVariants(piece.cells);
    if (variants.length <= 1) return;
    this.pieceRotations.set(piece.id, (current + 1) % variants.length);
    this.drawTray();
  }

  /** Get current rotated cells for a piece */
  private getPieceCells(piece: PieceDef): TriCell[] {
    const rotation = this.pieceRotations.get(piece.id) ?? 0;
    return getRotatedCells(piece.cells, rotation);
  }

  private findTrayPiece(px: number, py: number): PieceDef | null {
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * this.dpr;
    const unplaced = this.availablePieces.filter((p) => !this.placedPieceIds.has(p.id));
    if (unplaced.length === 0) return null;

    const trayPieceSize = this.triSize * 0.55;
    const spacing = 20 * scale;
    const totalW = unplaced.length * (trayPieceSize * 3) + (unplaced.length - 1) * spacing;
    let startX = (w - totalW) / 2;

    for (const piece of unplaced) {
      const rotation = this.pieceRotations.get(piece.id) ?? 0;
      const cells = getRotatedCells(piece.cells, rotation);
      // Check if point is within bounding box of piece in tray
      const pieceBounds = this.getPieceBounds(cells, startX, this.trayY + 30 * scale, trayPieceSize);
      if (
        px >= pieceBounds.minX - 10 * scale &&
        px <= pieceBounds.maxX + 10 * scale &&
        py >= pieceBounds.minY - 10 * scale &&
        py <= pieceBounds.maxY + 10 * scale
      ) {
        return piece;
      }
      startX += trayPieceSize * 3 + spacing;
    }

    return null;
  }

  private getPieceBounds(
    cells: TriCell[],
    offsetX: number,
    offsetY: number,
    size: number,
  ): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const cell of cells) {
      const verts = getTriangleVertices(cell.row, cell.col, size, offsetX, offsetY);
      for (const v of verts) {
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
      }
    }
    return { minX, maxX, minY, maxY };
  }

  private startDrag(piece: PieceDef, px: number, py: number) {
    this.phase = 'dragging';
    this.dragPiece = piece;
    this.dragCells = this.getPieceCells(piece);

    // Create drag graphics
    this.dragGraphics = this.add.graphics();
    this.dragGraphics.setDepth(100);

    // Offset so piece centers on pointer
    const bounds = this.getPieceBounds(this.dragCells, 0, 0, this.triSize);
    this.dragOffsetX = -(bounds.minX + bounds.maxX) / 2;
    this.dragOffsetY = -(bounds.minY + bounds.maxY) / 2;

    this.updateDrag(px, py);
    this.drawTray(); // Hide the piece from tray visually
  }

  private updateDrag(px: number, py: number) {
    if (!this.dragGraphics || !this.dragPiece) return;

    this.dragGraphics.clear();
    this.highlightGraphics.clear();

    const hex = parseInt(this.dragPiece.color.replace('#', ''), 16);

    // Draw piece at cursor position
    const drawX = px + this.dragOffsetX;
    const drawY = py + this.dragOffsetY - 40 * this.dpr; // Lift above finger

    for (const cell of this.dragCells) {
      const verts = getTriangleVertices(cell.row, cell.col, this.triSize, drawX, drawY);

      this.dragGraphics.fillStyle(hex, 0.7);
      this.dragGraphics.beginPath();
      this.dragGraphics.moveTo(verts[0].x, verts[0].y);
      this.dragGraphics.lineTo(verts[1].x, verts[1].y);
      this.dragGraphics.lineTo(verts[2].x, verts[2].y);
      this.dragGraphics.closePath();
      this.dragGraphics.fillPath();

      this.dragGraphics.lineStyle(2, 0xffffff, 0.6);
      this.dragGraphics.beginPath();
      this.dragGraphics.moveTo(verts[0].x, verts[0].y);
      this.dragGraphics.lineTo(verts[1].x, verts[1].y);
      this.dragGraphics.lineTo(verts[2].x, verts[2].y);
      this.dragGraphics.closePath();
      this.dragGraphics.strokePath();
    }

    // Show placement preview on board
    this.showPlacementPreview(px, py - 40 * this.dpr);
  }

  private showPlacementPreview(px: number, py: number) {
    if (!this.dragPiece || this.dragCells.length === 0) return;

    // Find the board cell under the center of the dragged piece
    const centerCell = pixelToCell(
      px, py,
      this.board.gridRows, this.board.gridCols,
      this.triSize, this.gridOffsetX, this.gridOffsetY,
    );

    if (!centerCell) return;

    // Calculate offset: first cell of piece maps to this board cell
    const firstCell = this.dragCells[0];
    const offsetRow = centerCell.row - firstCell.row;
    const offsetCol = centerCell.col - firstCell.col;

    const valid = canPlace(this.board, this.dragCells, offsetRow, offsetCol);
    const color = valid ? 0x22c55e : 0xef4444;
    const alpha = valid ? 0.3 : 0.2;

    for (const cell of this.dragCells) {
      const r = cell.row + offsetRow;
      const c = cell.col + offsetCol;
      if (r < 0 || r >= this.board.gridRows || c < 0 || c >= this.board.gridCols) continue;

      const verts = getTriangleVertices(r, c, this.triSize, this.gridOffsetX, this.gridOffsetY);
      this.highlightGraphics.fillStyle(color, alpha);
      this.highlightGraphics.beginPath();
      this.highlightGraphics.moveTo(verts[0].x, verts[0].y);
      this.highlightGraphics.lineTo(verts[1].x, verts[1].y);
      this.highlightGraphics.lineTo(verts[2].x, verts[2].y);
      this.highlightGraphics.closePath();
      this.highlightGraphics.fillPath();
    }
  }

  private endDrag(px: number, py: number) {
    if (!this.dragPiece || this.dragCells.length === 0) return;

    const adjustedY = py - 40 * this.dpr;

    // Find the board cell under the center of the dragged piece
    const centerCell = pixelToCell(
      px, adjustedY,
      this.board.gridRows, this.board.gridCols,
      this.triSize, this.gridOffsetX, this.gridOffsetY,
    );

    let placed = false;

    if (centerCell) {
      const firstCell = this.dragCells[0];
      const offsetRow = centerCell.row - firstCell.row;
      const offsetCol = centerCell.col - firstCell.col;

      if (canPlace(this.board, this.dragCells, offsetRow, offsetCol)) {
        this.board = placePiece(this.board, this.dragPiece, this.dragCells, offsetRow, offsetCol);
        this.placedPieceIds.add(this.dragPiece.id);
        this.score += 50;
        this.moves++;
        placed = true;

        // Snap animation effect
        this.snapEffect(this.dragPiece, this.dragCells, offsetRow, offsetCol);
      }
    }

    // Clean up drag graphics
    this.dragGraphics?.destroy();
    this.dragGraphics = null;
    this.highlightGraphics.clear();
    this.dragPiece = null;
    this.dragCells = [];
    this.phase = 'idle';

    this.drawBoard();
    this.drawTray();
    this.emitState();

    // Check win
    if (placed && isWon(this.board)) {
      this.phase = 'celebrating';
      this.score += 500; // Stage clear bonus
      this.emitState();
      this.time.delayedCall(400, () => {
        this.celebrateWin();
      });
    }
  }

  // ─── Effects ───────────────────────────────────────────

  private snapEffect(piece: PieceDef, cells: TriCell[], offsetRow: number, offsetCol: number) {
    const hex = parseInt(piece.color.replace('#', ''), 16);

    for (const cell of cells) {
      const r = cell.row + offsetRow;
      const c = cell.col + offsetCol;
      const center = getTriangleCenter(r, c, this.triSize, this.gridOffsetX, this.gridOffsetY);

      // Small flash particle
      const flash = this.add.circle(center.x, center.y, 4 * this.dpr, hex, 0.8);
      flash.setDepth(50);
      this.tweens.add({
        targets: flash,
        scale: 2.5,
        alpha: 0,
        duration: 300,
        ease: 'Cubic.easeOut',
        onComplete: () => flash.destroy(),
      });
    }
  }

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    // Confetti burst
    for (let i = 0; i < 30; i++) {
      const colors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (4 + Math.random() * 6) * this.dpr;
      const p = this.add.rectangle(
        w / 2 + (Math.random() - 0.5) * 60 * this.dpr,
        h / 2,
        size,
        size * 1.5,
        color,
      );
      p.setDepth(300);
      p.setRotation(Math.random() * Math.PI);

      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * w * 0.8,
        y: p.y + (Math.random() - 0.5) * h * 0.6,
        rotation: p.rotation + (Math.random() - 0.5) * 4,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    // Emit stage clear
    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        moves: this.moves,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Public Methods ────────────────────────────────────

  public resetPieces() {
    this.board = resetBoard(this.board);
    this.placedPieceIds.clear();
    // Reset rotations too
    for (const p of this.availablePieces) {
      this.pieceRotations.set(p.id, 0);
    }
    this.score = 0;
    this.moves = 0;
    this.drawBoard();
    this.drawTray();
    this.emitState();
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Cleanup ──────────────────────────────────────────

  shutdown() {
    this.tweens.killAll();
    this.input.off('pointerdown');
    this.input.off('pointermove');
    this.input.off('pointerup');
  }

  // ─── Events ────────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
  }
}
