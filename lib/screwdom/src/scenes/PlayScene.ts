import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  SCREW_COLORS,
  getStageConfig,
  type BoardState,
  type GameConfig,
} from '../types';
import {
  createBoard,
  canRemoveScrew,
  removeScrewAndPlace,
  isWon,
  isStuck,
  isColorComplete,
  getScrewWorldPosition,
} from '../logic/board';

const SCREW_RADIUS = 14;
const SCREW_HEAD_RADIUS = 10;
const HOLE_RADIUS = 16;
const PLANK_COLOR = 0xdeb887; // burlywood
const PLANK_BORDER = 0xa0522d; // sienna
const BOARD_BG = 0xf5f0e8;

type GamePhase = 'idle' | 'animating' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  private phase: GamePhase = 'idle';
  private moveHistory: { board: BoardState; score: number }[] = [];
  private score = 0;
  private moves = 0;

  // Containers
  private plankContainer!: Phaser.GameObjects.Container;
  private screwContainer!: Phaser.GameObjects.Container;
  private holeContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    const stage = this.config.stage ?? 1;
    const stageConfig = getStageConfig(stage);
    this.board = createBoard(stageConfig);
    this.phase = 'idle';
    this.moveHistory = [];
    this.score = 0;
    this.moves = 0;

    this.drawAll();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private getScale(): number {
    return this.dpr;
  }

  private getHoleLayout(): { x: number; y: number }[] {
    const s = this.getScale();
    const w = DEFAULT_WIDTH * s;
    const h = DEFAULT_HEIGHT * s;
    const count = this.board.holes.length;

    // Holes at the bottom area
    const holesPerRow = Math.min(count, 6);
    const rows = Math.ceil(count / holesPerRow);
    const gap = 42 * s;
    const startY = h - 50 * s - (rows - 1) * gap;

    const positions: { x: number; y: number }[] = [];
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      const rowCount = Math.min(holesPerRow, count - idx);
      const totalW = (rowCount - 1) * gap;
      const sx = (w - totalW) / 2;
      for (let c = 0; c < rowCount; c++) {
        positions.push({
          x: sx + c * gap,
          y: startY + r * gap,
        });
        idx++;
      }
    }
    return positions;
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawAll() {
    // Clear everything
    this.children.removeAll(true);

    const s = this.getScale();
    const w = DEFAULT_WIDTH * s;
    const h = DEFAULT_HEIGHT * s;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(BOARD_BG, 1);
    bg.fillRect(0, 0, w, h);

    // Separator line above holes
    const holePositions = this.getHoleLayout();
    const separatorY = holePositions.length > 0
      ? Math.min(...holePositions.map((p) => p.y)) - 30 * s
      : h - 120 * s;

    const sep = this.add.graphics();
    sep.lineStyle(2 * s, 0xd1d5db, 1);
    sep.lineBetween(20 * s, separatorY, w - 20 * s, separatorY);

    // Draw planks area label
    const plankAreaH = separatorY;

    // Draw holes (bottom section)
    this.drawHoles();

    // Draw planks and screws (top section)
    this.drawPlanks(plankAreaH);

    // Draw screws on top
    this.drawScrews(plankAreaH);
  }

  private drawHoles() {
    const s = this.getScale();
    const positions = this.getHoleLayout();
    const r = HOLE_RADIUS * s;

    this.board.holes.forEach((hole, idx) => {
      const pos = positions[idx];
      const g = this.add.graphics();
      const colorHex = parseInt(SCREW_COLORS[hole.color].replace('#', ''), 16);

      if (hole.filled) {
        // Filled hole
        g.fillStyle(colorHex, 0.9);
        g.fillCircle(pos.x, pos.y, r);
        g.lineStyle(2 * s, colorHex, 1);
        g.strokeCircle(pos.x, pos.y, r);

        // Draw screw head cross
        this.drawScrewHead(pos.x, pos.y, r * 0.7, colorHex, g, true);
      } else {
        // Empty hole — dashed circle
        g.lineStyle(2.5 * s, colorHex, 0.6);
        g.strokeCircle(pos.x, pos.y, r);

        // Inner ring
        g.lineStyle(1 * s, colorHex, 0.3);
        g.strokeCircle(pos.x, pos.y, r * 0.5);
      }
    });
  }

  private drawScrewHead(
    x: number,
    y: number,
    radius: number,
    _color: number,
    g: Phaser.GameObjects.Graphics,
    filled: boolean,
  ) {
    const s = this.getScale();
    const lineColor = filled ? 0xffffff : 0x666666;
    g.lineStyle(2 * s, lineColor, 0.8);
    // Cross pattern
    g.lineBetween(x - radius * 0.6, y, x + radius * 0.6, y);
    g.lineBetween(x, y - radius * 0.6, x, y + radius * 0.6);
  }

  private drawPlanks(areaHeight: number) {
    const s = this.getScale();
    const w = DEFAULT_WIDTH * s;

    // Sort planks by layer (draw from bottom to top)
    const sortedPlanks = [...this.board.planks].sort((a, b) => a.layer - b.layer);

    // Scale plank positions to fit in the area
    const scaleX = (w * 0.85) / 390;
    const scaleY = (areaHeight * 0.85) / 400;
    const offsetX = w * 0.075;
    const offsetY = 30 * s;

    for (const plank of sortedPlanks) {
      // Check if plank still has active screws
      const hasActiveScrews = plank.screwSlots.some(
        (sid) => sid !== null && !this.board.screws[sid].removed,
      );
      if (!hasActiveScrews) continue;

      const px = plank.x * scaleX * s + offsetX;
      const py = plank.y * scaleY * s + offsetY;
      const pw = plank.width * s * scaleX * 0.9;
      const ph = plank.height * s * scaleY * 1.2;
      const angle = plank.angle;

      const g = this.add.graphics();
      g.setPosition(px, py);
      g.setRotation((angle * Math.PI) / 180);

      // Plank shadow
      g.fillStyle(0x000000, 0.08);
      g.fillRoundedRect(-pw / 2 + 3 * s, -ph / 2 + 3 * s, pw, ph, 6 * s);

      // Plank body
      g.fillStyle(PLANK_COLOR, 1);
      g.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 6 * s);

      // Wood grain effect
      g.lineStyle(1 * s, PLANK_BORDER, 0.15);
      for (let i = 0; i < 3; i++) {
        const gy = -ph / 2 + (ph / 4) * (i + 0.5);
        g.lineBetween(-pw / 2 + 8 * s, gy, pw / 2 - 8 * s, gy);
      }

      // Border
      g.lineStyle(2 * s, PLANK_BORDER, 0.7);
      g.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 6 * s);
    }
  }

  private drawScrews(areaHeight: number) {
    const s = this.getScale();
    const w = DEFAULT_WIDTH * s;
    const r = SCREW_RADIUS * s;
    const hr = SCREW_HEAD_RADIUS * s;

    const scaleX = (w * 0.85) / 390;
    const scaleY = (areaHeight * 0.85) / 400;
    const offsetX = w * 0.075;
    const offsetY = 30 * s;

    // Sort screws by plank layer so top screws are drawn last
    const sortedScrews = [...this.board.screws]
      .filter((sc) => !sc.removed)
      .sort((a, b) => {
        const plankA = this.board.planks[a.plankId];
        const plankB = this.board.planks[b.plankId];
        return plankA.layer - plankB.layer;
      });

    for (const screw of sortedScrews) {
      const plank = this.board.planks[screw.plankId];
      const worldPos = getScrewWorldPosition(plank, screw.slotIndex);
      const sx = worldPos.x * scaleX * s + offsetX;
      const sy = worldPos.y * scaleY * s + offsetY;

      const colorHex = parseInt(SCREW_COLORS[screw.color].replace('#', ''), 16);
      const canRemove = canRemoveScrew(this.board, screw.id);

      const g = this.add.graphics();

      // Screw shadow
      g.fillStyle(0x000000, 0.12);
      g.fillCircle(sx + 2 * s, sy + 2 * s, r);

      // Screw base
      g.fillStyle(canRemove ? colorHex : 0x999999, canRemove ? 1 : 0.6);
      g.fillCircle(sx, sy, r);

      // Screw border
      g.lineStyle(2 * s, canRemove ? 0x333333 : 0x888888, 0.5);
      g.strokeCircle(sx, sy, r);

      // Screw head
      g.fillStyle(canRemove ? colorHex : 0xaaaaaa, 1);
      g.fillCircle(sx, sy, hr);

      // Cross on head
      this.drawScrewHead(sx, sy, hr, colorHex, g, false);

      // Highlight removable screws
      if (canRemove) {
        g.lineStyle(2 * s, 0xffffff, 0.3);
        g.strokeCircle(sx, sy, r + 2 * s);
      }

      // Hit area
      const hitArea = this.add
        .circle(sx, sy, r + 6 * s)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => this.onScrewTap(screw.id));
    }
  }

  // ─── Interaction ──────────────────────────────────────

  private onScrewTap(screwId: number) {
    if (this.phase !== 'idle') return;

    const result = removeScrewAndPlace(this.board, screwId);
    if (!result) {
      // Shake the screw to indicate it can't be removed
      this.shakeScrew(screwId);
      return;
    }

    this.phase = 'animating';

    // Save history for undo
    this.moveHistory.push({
      board: {
        screws: this.board.screws.map((s) => ({ ...s })),
        planks: this.board.planks.map((p) => ({ ...p, screwSlots: [...p.screwSlots] })),
        holes: this.board.holes.map((h) => ({ ...h })),
        numColors: this.board.numColors,
      },
      score: this.score,
    });

    // Capture screw color before applying the move
    const screwColor = this.board.screws[screwId].color;

    // Apply the move
    this.board = result.newBoard;
    this.moves++;
    this.score += 50;

    // Check if a color group is complete
    if (isColorComplete(this.board, screwColor)) {
      this.score += 200;
    }

    // Animate: quick redraw with delay
    this.time.delayedCall(100, () => {
      this.drawAll();
      this.emitState();

      // Check win
      if (isWon(this.board)) {
        this.phase = 'celebrating';
        this.time.delayedCall(400, () => this.celebrateWin());
      } else if (isStuck(this.board)) {
        // Game stuck — emit game over
        this.time.delayedCall(600, () => {
          this.game.events.emit('game-over', {
            score: this.score,
            moves: this.moves,
            stage: this.config.stage ?? 1,
          });
        });
        this.phase = 'idle';
      } else {
        this.phase = 'idle';
      }
    });
  }

  private shakeScrew(_screwId: number) {
    // Quick camera shake to give feedback
    this.cameras.main.shake(150, 0.005);
  }

  // ─── Celebration ──────────────────────────────────────

  private celebrateWin() {
    const s = this.getScale();
    const w = DEFAULT_WIDTH * s;
    const h = DEFAULT_HEIGHT * s;

    // Confetti burst
    for (let i = 0; i < 30; i++) {
      const colors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (4 + Math.random() * 6) * s;
      const p = this.add.rectangle(
        w / 2 + (Math.random() - 0.5) * 60 * s,
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

    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        moves: this.moves,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Undo & Restart ───────────────────────────────────

  public undo() {
    if (this.phase !== 'idle' || this.moveHistory.length === 0) return;
    const prev = this.moveHistory.pop()!;
    this.board = prev.board;
    this.score = prev.score;
    this.moves = Math.max(0, this.moves - 1);
    this.drawAll();
    this.emitState();
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
  }
}
