/**
 * PlayScene for HexaAway
 *
 * Hexagonal grid + 3 piece slots at bottom.
 * Drag pieces onto the grid. Full lines clear.
 *
 * Events emitted:
 *   'state-update'   — { score, phase }
 *   'piece-placed'   — (haptic trigger)
 *   'line-cleared'   — (haptic trigger)
 *   'game-over'      — { score }
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
  hexKey,
  isValidCell,
  type HexBoard,
} from '../logic/board';
import {
  GamePhase,
  BOARD_RADIUS,
  randomPiece,
  type GameConfig,
  type HexCoord,
  type PieceShape,
} from '../types';

const CELL_BORDER_COLOR = 0xe5e7eb;
const CELL_BG_COLOR = 0xffffff;
const GRID_BG_COLOR = 0xf3f4f6;

const SQRT3 = Math.sqrt(3);

export class PlayScene extends Phaser.Scene {
  private gameConfig?: GameConfig;
  private phase: GamePhase = GamePhase.PLAYING;
  private board!: HexBoard;
  private score: number = 0;
  private consecutiveClears: number = 0;

  // Visual
  private hexSize: number = 20; // radius of each hex
  private gridCenterX: number = 0;
  private gridCenterY: number = 0;
  private cellGraphics: Map<string, Phaser.GameObjects.Polygon> = new Map();
  private pieceSlots: HexPieceSlot[] = [];

  // Drag state
  private dragPiece: DragHexVisual | null = null;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { gameConfig?: GameConfig }): void {
    this.gameConfig = data?.gameConfig ?? this.game.registry.get('hexaawayConfig');
  }

  create(): void {
    const dpr: number = this.game.registry.get('dpr') || 1;
    const { width, height } = this.scale;

    this.phase = GamePhase.PLAYING;
    this.board = createBoard();
    this.score = 0;
    this.consecutiveClears = 0;

    this.cameras.main.setBackgroundColor('#f0f2f5');

    // Calculate hex size to fit grid with space for pieces below
    const gridAreaH = height * 0.62;
    const padding = 16 * dpr;
    // The hex grid spans (2 * BOARD_RADIUS + 1) rows in the r direction
    // Height of pointy-top hex grid ~ SQRT3 * hexSize * (2 * BOARD_RADIUS + 1)
    const maxHexByH = gridAreaH / (SQRT3 * (2 * BOARD_RADIUS + 1));
    const maxHexByW = (width - padding * 2) / (1.5 * (2 * BOARD_RADIUS + 1) + 0.5);
    this.hexSize = Math.floor(Math.min(maxHexByH, maxHexByW));

    this.gridCenterX = width / 2;
    this.gridCenterY = padding + gridAreaH / 2;

    // Draw grid background circle
    const gridRadius = this.hexSize * (BOARD_RADIUS + 0.5) * 2;
    this.add.circle(this.gridCenterX, this.gridCenterY, gridRadius, GRID_BG_COLOR, 0.3);

    // Draw hex cells
    this.cellGraphics = new Map();
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
        if (!isValidCell(q, r)) continue;
        const { x, y } = this.hexToPixel(q, r);
        const hex = this.createHexPolygon(x, y, this.hexSize - 1, CELL_BG_COLOR);
        hex.setStrokeStyle(1, CELL_BORDER_COLOR, 0.5);
        this.cellGraphics.set(hexKey(q, r), hex);
      }
    }

    // Generate initial 3 pieces
    this.spawnPieceSlots();
    this.emitState();
  }

  // -- HEX COORDINATE CONVERSION (pointy-top) --

  private hexToPixel(q: number, r: number): { x: number; y: number } {
    const x = this.gridCenterX + this.hexSize * (SQRT3 * q + SQRT3 / 2 * r);
    const y = this.gridCenterY + this.hexSize * (3 / 2 * r);
    return { x, y };
  }

  private pixelToHex(px: number, py: number): HexCoord {
    const x = px - this.gridCenterX;
    const y = py - this.gridCenterY;
    const q = (SQRT3 / 3 * x - 1 / 3 * y) / this.hexSize;
    const r = (2 / 3 * y) / this.hexSize;
    return this.hexRound(q, r);
  }

  private hexRound(q: number, r: number): HexCoord {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    const rs = Math.round(s);

    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);

    if (dq > dr && dq > ds) {
      rq = -rr - rs;
    } else if (dr > ds) {
      rr = -rq - rs;
    }

    return { q: rq, r: rr };
  }

  /** Create a pointy-top hexagon polygon */
  private createHexPolygon(
    cx: number,
    cy: number,
    size: number,
    color: number,
    alpha: number = 1,
  ): Phaser.GameObjects.Polygon {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      points.push({
        x: size * Math.cos(angle),
        y: size * Math.sin(angle),
      });
    }
    const hex = this.add.polygon(cx, cy, points, color, alpha);
    hex.setOrigin(0.5, 0.5);
    return hex;
  }

  // -- PIECE SLOTS --

  private spawnPieceSlots(): void {
    for (const slot of this.pieceSlots) {
      slot.destroy();
    }
    this.pieceSlots = [];

    const { width, height } = this.scale;
    const gridAreaH = height * 0.62;
    const dpr: number = this.game.registry.get('dpr') || 1;
    const padding = 16 * dpr;
    const gridBottom = padding + gridAreaH;
    const slotAreaY = gridBottom + (height - gridBottom) / 2;
    const slotSpacing = width / 3;
    const previewHexSize = this.hexSize * 0.5;

    for (let i = 0; i < 3; i++) {
      const piece = randomPiece();
      const centerX = slotSpacing * (i + 0.5);
      const slot = new HexPieceSlot(this, centerX, slotAreaY, piece, previewHexSize, i);
      this.pieceSlots.push(slot);

      slot.onDragStart = () => this.startDrag(slot);
      slot.onDragMove = (px: number, py: number) => this.updateDrag(px, py);
      slot.onDragEnd = (px: number, py: number) => this.endDrag(px, py);
    }
  }

  // -- DRAG --

  private startDrag(slot: HexPieceSlot): void {
    if (this.phase !== GamePhase.PLAYING) return;

    this.dragPiece = new DragHexVisual(this, slot.piece, this.hexSize);
    this.dragPiece.slotIndex = slot.slotIndex;
    slot.setVisible(false);
  }

  private updateDrag(px: number, py: number): void {
    if (!this.dragPiece || this.phase !== GamePhase.PLAYING) return;
    const offsetY = this.hexSize * 3;
    this.dragPiece.moveTo(px, py - offsetY);

    // Highlight valid placement
    const hex = this.pixelToHex(px, py - offsetY);
    this.clearHighlights();
    if (canPlace(this.board, this.dragPiece.piece, hex.q, hex.r)) {
      this.showHighlight(this.dragPiece.piece, hex.q, hex.r);
    }
  }

  private endDrag(px: number, py: number): void {
    if (!this.dragPiece || this.phase !== GamePhase.PLAYING) return;

    const offsetY = this.hexSize * 3;
    const hex = this.pixelToHex(px, py - offsetY);
    const slotIndex = this.dragPiece.slotIndex;
    const piece = this.dragPiece.piece;

    this.dragPiece.destroy();
    this.dragPiece = null;
    this.clearHighlights();

    if (canPlace(this.board, piece, hex.q, hex.r)) {
      // Valid placement — emit haptic immediately before animation
      this.game.events.emit('piece-placed');

      const placed = placePiece(this.board, piece, hex.q, hex.r);

      // Update visual grid
      for (const c of placed) {
        const cell = this.cellGraphics.get(hexKey(c.q, c.r));
        if (cell) {
          cell.setFillStyle(piece.color);
          cell.setStrokeStyle(1, 0xffffff, 0.3);
        }
      }

      // Remove the used slot
      this.pieceSlots[slotIndex].markUsed();

      // Placement pop animation
      for (const c of placed) {
        const cell = this.cellGraphics.get(hexKey(c.q, c.r));
        if (cell) {
          cell.setScale(0.5);
          this.tweens.add({
            targets: cell,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: 'Back.easeOut',
          });
        }
      }

      // Check for line clears
      const lines = findFullLines(this.board);
      if (lines.length > 0) {
        this.phase = GamePhase.ANIMATING;
        this.consecutiveClears++;

        // Emit haptic event immediately before animation
        this.game.events.emit('line-cleared');

        const cleared = clearLines(this.board, lines);
        const lineCount = lines.length;
        const clearScore =
          calcClearScore(lineCount, cleared.length) *
          Math.max(1, this.consecutiveClears);
        this.score += clearScore + placed.length;

        // Screen shake
        const shakeIntensity = Math.min(3 + this.consecutiveClears * 2, 12);
        this.cameras.main.shake(200, shakeIntensity / 1000);

        // Flash cleared cells
        for (const c of cleared) {
          const cell = this.cellGraphics.get(hexKey(c.q, c.r));
          if (cell) cell.setFillStyle(0xffffff);
        }

        // Combo text
        this.showComboText(lineCount, this.consecutiveClears, clearScore);

        // Staggered destroy animation
        this.time.delayedCall(100, () => {
          let completed = 0;
          cleared.forEach((c, i) => {
            this.time.delayedCall(i * 20, () => {
              const cell = this.cellGraphics.get(hexKey(c.q, c.r));
              if (!cell) {
                completed++;
                if (completed === cleared.length) this.phase = GamePhase.PLAYING;
                return;
              }
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

      this.emitState();

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

  // -- HIGHLIGHTS --

  private highlightHexes: Phaser.GameObjects.Polygon[] = [];

  private showHighlight(piece: PieceShape, oq: number, offsetR: number): void {
    for (const c of piece.cells) {
      const q = oq + c.q;
      const r = offsetR + c.r;
      if (isValidCell(q, r)) {
        const { x, y } = this.hexToPixel(q, r);
        const hex = this.createHexPolygon(x, y, this.hexSize - 1, piece.color, 0.3);
        this.highlightHexes.push(hex);
      }
    }
  }

  private clearHighlights(): void {
    for (const hex of this.highlightHexes) hex.destroy();
    this.highlightHexes = [];
  }

  // -- JUICE EFFECTS --

  private showComboText(lineCount: number, combo: number, score: number): void {
    const { width } = this.scale;

    const messages = ['Nice!', 'Great!', 'Awesome!', 'AMAZING!', 'INCREDIBLE!'];
    const msgIdx = Math.min(combo - 1, messages.length - 1);
    const msg = lineCount > 1 ? `${messages[msgIdx]} x${lineCount}` : messages[msgIdx];

    const colors = [0xfa6c41, 0x2563eb, 0x8b5cf6, 0xf43f5e, 0xd97706];
    const color = colors[Math.min(combo - 1, colors.length - 1)];

    const text = this.add
      .text(width / 2, this.gridCenterY - 30, msg, {
        fontSize: `${Math.min(28 + combo * 4, 48)}px`,
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(200);

    const scoreText = this.add
      .text(width / 2, this.gridCenterY + 10, `+${score}`, {
        fontSize: '20px',
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
        color: '#374151',
      })
      .setOrigin(0.5)
      .setDepth(200);

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

  private checkGameOver(): void {
    const remaining = this.pieceSlots
      .filter((s) => !s.used)
      .map((s) => s.piece);
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

  private emitState(): void {
    this.game.events.emit('state-update', { score: this.score, phase: this.phase });
  }

  shutdown(): void {
    this.game.events.off('state-update');
    this.game.events.off('piece-placed');
    this.game.events.off('line-cleared');
    this.game.events.off('game-over');
    this.pieceSlots = [];
    this.cellGraphics.clear();
    this.highlightHexes = [];
  }
}

// -- HELPER CLASSES --

class HexPieceSlot {
  private scene: PlayScene;
  private container: Phaser.GameObjects.Container;
  public piece: PieceShape;
  public used: boolean = false;
  public slotIndex: number;

  onDragStart?: () => void;
  onDragMove?: (px: number, py: number) => void;
  onDragEnd?: (px: number, py: number) => void;

  constructor(
    scene: PlayScene,
    x: number,
    y: number,
    piece: PieceShape,
    hexSize: number,
    index: number,
  ) {
    this.scene = scene;
    this.piece = piece;
    this.slotIndex = index;

    this.container = scene.add.container(x, y);

    // Calculate piece bounds for centering
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const sqrt3 = Math.sqrt(3);
    const positions: { px: number; py: number }[] = [];
    for (const cell of piece.cells) {
      const px = hexSize * (sqrt3 * cell.q + sqrt3 / 2 * cell.r);
      const py = hexSize * (3 / 2 * cell.r);
      positions.push({ px, py });
      minX = Math.min(minX, px - hexSize);
      maxX = Math.max(maxX, px + hexSize);
      minY = Math.min(minY, py - hexSize);
      maxY = Math.max(maxY, py + hexSize);
    }

    const offsetX = -(minX + maxX) / 2;
    const offsetY = -(minY + maxY) / 2;

    for (let i = 0; i < piece.cells.length; i++) {
      const { px, py } = positions[i];
      const points: { x: number; y: number }[] = [];
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 180) * (60 * a - 30);
        points.push({
          x: (hexSize - 1) * Math.cos(angle),
          y: (hexSize - 1) * Math.sin(angle),
        });
      }
      const hex = scene.add.polygon(px + offsetX, py + offsetY, points, piece.color);
      hex.setOrigin(0.5, 0.5);
      hex.setStrokeStyle(1, 0xffffff, 0.3);
      this.container.add(hex);
    }

    // Make interactive hit area
    const hitW = maxX - minX + 20;
    const hitH = maxY - minY + 20;
    const hitArea = scene.add.rectangle(0, 0, hitW, hitH, 0x000000, 0);
    hitArea.setInteractive({ draggable: true });
    this.container.add(hitArea);

    hitArea.on('dragstart', () => {
      this.onDragStart?.();
    });

    hitArea.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      // Use pointer position for accurate drag
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

class DragHexVisual {
  private container: Phaser.GameObjects.Container;
  public piece: PieceShape;
  public slotIndex: number = 0;

  constructor(scene: Phaser.Scene, piece: PieceShape, hexSize: number) {
    this.piece = piece;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    const sqrt3 = Math.sqrt(3);
    for (const cell of piece.cells) {
      const px = hexSize * (sqrt3 * cell.q + sqrt3 / 2 * cell.r);
      const py = hexSize * (3 / 2 * cell.r);
      const points: { x: number; y: number }[] = [];
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 180) * (60 * a - 30);
        points.push({
          x: (hexSize - 1) * Math.cos(angle),
          y: (hexSize - 1) * Math.sin(angle),
        });
      }
      const hex = scene.add.polygon(px, py, points, piece.color, 0.8);
      hex.setOrigin(0.5, 0.5);
      hex.setStrokeStyle(1, 0xffffff, 0.4);
      this.container.add(hex);
    }
  }

  moveTo(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  destroy(): void {
    this.container.destroy();
  }
}
