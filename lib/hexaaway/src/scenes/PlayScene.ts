/**
 * PlayScene for Hexa Away
 *
 * Hexagonal block puzzle. Drag hex-shaped pieces onto a hex grid.
 * Full lines in 3 axial directions clear.
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
  allCells,
  type Board,
} from '../logic/board';
import {
  GamePhase,
  BOARD_RADIUS,
  hexKey,
  hexToPixel,
  hexInBoard,
  randomPiece,
  type GameConfig,
  type PieceShape,
  type Hex,
} from '../types';

const CELL_BG_COLOR = 0xffffff;
const CELL_BORDER_COLOR = 0xd1d5db;
const GRID_BG_COLOR = 0xf3f4f6;

export class PlayScene extends Phaser.Scene {
  private gameConfig?: GameConfig;
  private phase: GamePhase = GamePhase.PLAYING;
  private board!: Board;
  private score: number = 0;
  private consecutiveClears: number = 0;

  // Visual
  private hexSize: number = 28;
  private gridCenterX: number = 0;
  private gridCenterY: number = 0;
  private cellGraphics: Map<string, Phaser.GameObjects.Polygon> = new Map();
  private pieceSlots: HexPieceSlot[] = [];
  private dpr: number = 1;

  // Drag state
  private dragPiece: DragHexVisual | null = null;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { gameConfig?: GameConfig; dpr?: number }): void {
    this.gameConfig = data?.gameConfig ?? (this.game as any).__hexaawayConfig;
    this.dpr = data?.dpr ?? (this.game as any).__dpr ?? 1;
  }

  create(): void {
    const { width, height } = this.scale;

    this.phase = GamePhase.PLAYING;
    this.board = createBoard();
    this.score = 0;
    this.consecutiveClears = 0;

    this.cameras.main.setBackgroundColor('#f0f2f5');

    // Calculate hex size to fit board in ~60% of screen height
    const gridAreaH = height * 0.58;
    const gridAreaW = width * 0.92;
    // For flat-top hex: total height ≈ sqrt(3) * size * (2*radius+1)
    // total width ≈ 3/2 * size * (2*radius) + size*2
    const maxByH = gridAreaH / (Math.sqrt(3) * (2 * BOARD_RADIUS + 1));
    const maxByW = gridAreaW / (3 / 2 * (2 * BOARD_RADIUS) + 2);
    this.hexSize = Math.floor(Math.min(maxByH, maxByW));

    this.gridCenterX = width / 2;
    this.gridCenterY = height * 0.33;

    // Draw grid background circle
    const bgRadius = this.hexSize * (BOARD_RADIUS + 0.8) * Math.sqrt(3);
    this.add.circle(this.gridCenterX, this.gridCenterY, bgRadius, GRID_BG_COLOR, 0.4);

    // Draw hex cells
    this.cellGraphics.clear();
    const cells = allCells();
    for (const { q, r } of cells) {
      const { x, y } = hexToPixel(q, r, this.hexSize);
      const px = this.gridCenterX + x;
      const py = this.gridCenterY + y;
      const poly = this.createHexPolygon(px, py, this.hexSize * 0.92, CELL_BG_COLOR);
      poly.setStrokeStyle(1, CELL_BORDER_COLOR, 0.6);
      this.cellGraphics.set(hexKey(q, r), poly);
    }

    // Spawn initial pieces
    this.spawnPieceSlots();
    this.emitScore();
  }

  /** Create a flat-top hexagon polygon */
  private createHexPolygon(cx: number, cy: number, size: number, color: number): Phaser.GameObjects.Polygon {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      points.push({
        x: size * Math.cos(angle),
        y: size * Math.sin(angle),
      });
    }
    const poly = this.add.polygon(cx, cy, points, color);
    poly.setOrigin(0.5, 0.5);
    return poly;
  }

  // ── PIECE SLOTS ──

  private spawnPieceSlots(): void {
    for (const slot of this.pieceSlots) slot.destroy();
    this.pieceSlots = [];

    const { width, height } = this.scale;
    const slotAreaY = height * 0.72;
    const slotSpacing = width / 3;
    const previewHexSize = this.hexSize * 0.55;

    for (let i = 0; i < 3; i++) {
      const piece = randomPiece();
      const cx = slotSpacing * (i + 0.5);
      const slot = new HexPieceSlot(this, cx, slotAreaY, piece, previewHexSize, i);
      this.pieceSlots.push(slot);

      slot.onDragStart = () => this.startDrag(slot);
      slot.onDragMove = (px: number, py: number) => this.updateDrag(px, py);
      slot.onDragEnd = (px: number, py: number) => this.endDrag(px, py);
    }
  }

  // ── DRAG ──

  private startDrag(slot: HexPieceSlot): void {
    if (this.phase !== GamePhase.PLAYING) return;
    this.dragPiece = new DragHexVisual(this, slot.piece, this.hexSize);
    this.dragPiece.slotIndex = slot.slotIndex;
    slot.setVisible(false);
  }

  private updateDrag(px: number, py: number): void {
    if (!this.dragPiece) return;
    const offsetY = this.hexSize * 2.5;
    this.dragPiece.moveTo(px, py - offsetY);

    // Highlight valid placement
    const anchor = this.pixelToHex(px, py - offsetY);
    this.clearHighlights();
    if (anchor && canPlace(this.board, this.dragPiece.piece, anchor.q, anchor.r)) {
      this.showHighlight(this.dragPiece.piece, anchor.q, anchor.r);
    }
  }

  private endDrag(px: number, py: number): void {
    if (!this.dragPiece) return;

    const offsetY = this.hexSize * 2.5;
    const anchor = this.pixelToHex(px, py - offsetY);
    const slotIndex = this.dragPiece.slotIndex;
    const piece = this.dragPiece.piece;

    this.dragPiece.destroy();
    this.dragPiece = null;
    this.clearHighlights();

    if (anchor && canPlace(this.board, piece, anchor.q, anchor.r)) {
      const placed = placePiece(this.board, piece, anchor.q, anchor.r);

      // Update visual cells
      for (const { q, r } of placed) {
        const poly = this.cellGraphics.get(hexKey(q, r));
        if (poly) {
          poly.setFillStyle(piece.color);
          poly.setStrokeStyle(1, 0xffffff, 0.3);
        }
      }

      // Placement pop animation
      for (const { q, r } of placed) {
        const poly = this.cellGraphics.get(hexKey(q, r));
        if (poly) {
          poly.setScale(0.5);
          this.tweens.add({
            targets: poly,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: 'Back.easeOut',
          });
        }
      }

      // Remove used slot
      this.pieceSlots[slotIndex].markUsed();

      // Check line clears
      const lines = findFullLines(this.board);
      const lineCount = lines.qLines.length + lines.rLines.length + lines.sLines.length;

      if (lineCount > 0) {
        this.phase = GamePhase.ANIMATING;
        this.consecutiveClears++;
        const cleared = clearLines(this.board, lines);
        const clearScore = calcClearScore(lineCount, cleared.length) * Math.max(1, this.consecutiveClears);
        this.score += clearScore + placed.length;

        // Screen shake
        const shakeIntensity = Math.min(3 + this.consecutiveClears * 2, 12);
        this.cameras.main.shake(200, shakeIntensity / 1000);

        // Flash cleared cells white
        for (const { q, r } of cleared) {
          const poly = this.cellGraphics.get(hexKey(q, r));
          if (poly) poly.setFillStyle(0xffffff);
        }

        // Combo text
        this.showComboText(lineCount, this.consecutiveClears, clearScore);

        // Staggered clear animation
        this.time.delayedCall(100, () => {
          let completed = 0;
          cleared.forEach(({ q, r }, i) => {
            this.time.delayedCall(i * 20, () => {
              const poly = this.cellGraphics.get(hexKey(q, r));
              if (!poly) { completed++; return; }
              const cx = poly.x;
              const cy = poly.y;
              const color = poly.fillColor;

              this.spawnParticles(cx, cy, color);

              this.tweens.add({
                targets: poly,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 250,
                ease: 'Back.easeIn',
                onComplete: () => {
                  poly.setScale(1);
                  poly.setAlpha(1);
                  poly.setFillStyle(CELL_BG_COLOR);
                  poly.setStrokeStyle(1, CELL_BORDER_COLOR, 0.6);
                  completed++;
                  if (completed === cleared.length) {
                    this.phase = GamePhase.PLAYING;
                  }
                },
              });
            });
          });
        });
      } else {
        this.consecutiveClears = 0;
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
      // Invalid — return piece
      this.pieceSlots[slotIndex].setVisible(true);
    }
  }

  // ── HEX ↔ PIXEL ──

  private pixelToHex(px: number, py: number): Hex | null {
    // Invert hexToPixel for flat-top
    const x = px - this.gridCenterX;
    const y = py - this.gridCenterY;
    const s = this.hexSize;
    const q = (2 / 3 * x) / s;
    const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / s;

    // Round to nearest hex
    const rq = Math.round(q);
    const rr = Math.round(r);
    const rs = Math.round(-q - r);
    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - (-q - r));

    let fq: number, fr: number;
    if (dq > dr && dq > ds) {
      fq = -rr - rs;
      fr = rr;
    } else if (dr > ds) {
      fq = rq;
      fr = -rq - rs;
    } else {
      fq = rq;
      fr = rr;
    }

    if (!hexInBoard(fq, fr, BOARD_RADIUS)) return null;
    return { q: fq, r: fr };
  }

  // ── HIGHLIGHTS ──

  private highlightPolys: Phaser.GameObjects.Polygon[] = [];

  private showHighlight(piece: PieceShape, anchorQ: number, anchorR: number): void {
    for (const cell of piece.cells) {
      const q = anchorQ + cell.q;
      const r = anchorR + cell.r;
      if (hexInBoard(q, r, BOARD_RADIUS)) {
        const { x, y } = hexToPixel(q, r, this.hexSize);
        const px = this.gridCenterX + x;
        const py = this.gridCenterY + y;
        const poly = this.createHexPolygon(px, py, this.hexSize * 0.92, piece.color);
        poly.setAlpha(0.35);
        poly.setDepth(50);
        this.highlightPolys.push(poly);
      }
    }
  }

  private clearHighlights(): void {
    for (const p of this.highlightPolys) p.destroy();
    this.highlightPolys = [];
  }

  // ── JUICE EFFECTS ──

  private showComboText(lineCount: number, combo: number, score: number): void {
    const { width } = this.scale;
    const messages = ['Nice!', 'Great!', 'Awesome!', 'AMAZING!', 'INCREDIBLE!'];
    const msgIdx = Math.min(combo - 1, messages.length - 1);
    const msg = lineCount > 1 ? `${messages[msgIdx]} x${lineCount}` : messages[msgIdx];

    const colors = [0xfa6c41, 0x2563eb, 0x8b5cf6, 0xf43f5e, 0xd97706];
    const color = colors[Math.min(combo - 1, colors.length - 1)];

    const text = this.add.text(width / 2, this.gridCenterY - 30, msg, {
      fontSize: `${Math.min(28 + combo * 4, 48)}px`,
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200);

    const scoreText = this.add.text(width / 2, this.gridCenterY + 10, `+${score}`, {
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
      const particle = this.add.rectangle(x, y, size, size, color).setDepth(150);
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

  // ── GAME FLOW ──

  private checkGameOver(): void {
    const remaining = this.pieceSlots.filter((s) => !s.used).map((s) => s.piece);
    if (remaining.length > 0 && !canPlaceAny(this.board, remaining)) {
      this.gameOver();
    }
  }

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;
    this.cameras.main.shake(300, 0.008);
    this.cameras.main.fade(600, 0, 0, 0, false, (_cam: any, progress: number) => {
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
    this.cellGraphics.clear();
    this.pieceSlots = [];
    this.highlightPolys = [];
  }
}

// ── HELPER CLASSES ──

class HexPieceSlot {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  public piece: PieceShape;
  public used: boolean = false;
  public slotIndex: number;

  onDragStart?: () => void;
  onDragMove?: (px: number, py: number) => void;
  onDragEnd?: (px: number, py: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, piece: PieceShape, hexSize: number, index: number) {
    this.scene = scene;
    this.piece = piece;
    this.slotIndex = index;
    this.container = scene.add.container(x, y);

    // Calculate bounds for centering
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const cell of piece.cells) {
      const { x: hx, y: hy } = hexToPixel(cell.q, cell.r, hexSize);
      minX = Math.min(minX, hx - hexSize);
      maxX = Math.max(maxX, hx + hexSize);
      minY = Math.min(minY, hy - hexSize);
      maxY = Math.max(maxY, hy + hexSize);
    }
    const offsetX = -(minX + maxX) / 2;
    const offsetY = -(minY + maxY) / 2;

    for (const cell of piece.cells) {
      const { x: hx, y: hy } = hexToPixel(cell.q, cell.r, hexSize);
      const poly = this.createHex(scene, offsetX + hx, offsetY + hy, hexSize * 0.9, piece.color);
      poly.setStrokeStyle(1, 0xffffff, 0.3);
      this.container.add(poly);
    }

    // Hit area
    const hitW = maxX - minX + 30;
    const hitH = maxY - minY + 30;
    const hitArea = scene.add.rectangle(0, 0, hitW, hitH, 0x000000, 0);
    hitArea.setInteractive({ draggable: true });
    this.container.add(hitArea);

    hitArea.on('dragstart', () => this.onDragStart?.());
    hitArea.on('drag', (pointer: Phaser.Input.Pointer) => {
      this.onDragMove?.(pointer.x, pointer.y);
    });
    hitArea.on('dragend', (pointer: Phaser.Input.Pointer) => {
      this.onDragEnd?.(pointer.x, pointer.y);
    });

    scene.input.setDraggable(hitArea);
  }

  private createHex(scene: Phaser.Scene, cx: number, cy: number, size: number, color: number): Phaser.GameObjects.Polygon {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      points.push({ x: size * Math.cos(angle), y: size * Math.sin(angle) });
    }
    const poly = scene.add.polygon(cx, cy, points, color);
    poly.setOrigin(0.5, 0.5);
    return poly;
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

class DragHexVisual {
  private container: Phaser.GameObjects.Container;
  public piece: PieceShape;
  public slotIndex: number = 0;

  constructor(scene: Phaser.Scene, piece: PieceShape, hexSize: number) {
    this.piece = piece;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    for (const cell of piece.cells) {
      const { x, y } = hexToPixel(cell.q, cell.r, hexSize);
      const points: { x: number; y: number }[] = [];
      const s = hexSize * 0.92;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i);
        points.push({ x: s * Math.cos(angle), y: s * Math.sin(angle) });
      }
      const poly = scene.add.polygon(x, y, points, piece.color, 0.8);
      poly.setOrigin(0.5, 0.5);
      poly.setStrokeStyle(1, 0xffffff, 0.4);
      this.container.add(poly);
    }
  }

  moveTo(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  destroy(): void {
    this.container.destroy();
  }
}
