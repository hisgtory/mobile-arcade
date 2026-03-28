import Phaser from 'phaser';
import {
  TUBE_CAPACITY,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  WATER_COLORS,
  getStageConfig,
  type BoardState,
  type PourMove,
  type GameConfig,
} from '../types';
import { createBoard, canPour, executePour, isWon, isTubeSolved, topCount } from '../logic/board';

const TUBE_WIDTH = 40;
const TUBE_HEIGHT = 140;
const SEGMENT_HEIGHT = TUBE_HEIGHT / TUBE_CAPACITY; // 35
const TUBE_GAP = 12;
const TUBE_WALL = 3;
const TUBE_RADIUS = 8;
const LIFT_Y = -20;

type GamePhase = 'idle' | 'pouring' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private tubeContainers: Phaser.GameObjects.Container[] = [];
  private selectedTube: number | null = null;
  private phase: GamePhase = 'idle';
  private moveHistory: { tubes: number[][]; from: number; to: number }[] = [];
  private score = 0;
  private moves = 0;
  private solvedTubes = new Set<number>();

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
    this.selectedTube = null;
    this.phase = 'idle';
    this.moveHistory = [];
    this.score = 0;
    this.moves = 0;
    this.solvedTubes = new Set();

    this.drawBoard();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private getTubeLayout(): { x: number; y: number }[] {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const count = this.board.tubes.length;
    const maxPerRow = Math.min(count, 5);
    const rows = Math.ceil(count / maxPerRow);
    const scale = this.dpr;

    const positions: { x: number; y: number }[] = [];
    const tubeW = TUBE_WIDTH * scale;
    const gap = TUBE_GAP * scale;

    for (let row = 0; row < rows; row++) {
      const startIdx = row * maxPerRow;
      const rowCount = Math.min(maxPerRow, count - startIdx);
      const totalRowW = rowCount * tubeW + (rowCount - 1) * gap;
      const startX = (w - totalRowW) / 2 + tubeW / 2;
      const rowH = TUBE_HEIGHT * scale;
      const totalH = rows * rowH + (rows - 1) * 40 * scale;
      const startY = (h - totalH) / 2 + rowH / 2 + row * (rowH + 40 * scale);

      for (let col = 0; col < rowCount; col++) {
        positions.push({
          x: startX + col * (tubeW + gap),
          y: startY,
        });
      }
    }

    return positions;
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear previous
    this.tubeContainers.forEach((c) => c.destroy());
    this.tubeContainers = [];

    const positions = this.getTubeLayout();
    const scale = this.dpr;
    const tubeW = TUBE_WIDTH * scale;
    const tubeH = TUBE_HEIGHT * scale;
    const segH = SEGMENT_HEIGHT * scale;
    const wall = TUBE_WALL * scale;
    const radius = TUBE_RADIUS * scale;

    this.board.tubes.forEach((tube, idx) => {
      const pos = positions[idx];
      const container = this.add.container(pos.x, pos.y);

      // Tube background (glass)
      const bg = this.add.graphics();
      bg.fillStyle(0xffffff, 0.6);
      bg.fillRoundedRect(-tubeW / 2, -tubeH / 2, tubeW, tubeH, radius);
      bg.lineStyle(wall, 0xd1d5db, 1);
      bg.strokeRoundedRect(-tubeW / 2, -tubeH / 2, tubeW, tubeH, radius);
      container.add(bg);

      // Water segments (bottom-to-top)
      const innerW = tubeW - wall * 2;
      for (let s = 0; s < tube.length; s++) {
        const color = WATER_COLORS[tube[s]];
        const segY = tubeH / 2 - (s + 1) * segH + wall;
        const seg = this.add.graphics();
        const hex = parseInt(color.replace('#', ''), 16);

        if (s === 0) {
          // Bottom segment with rounded bottom corners
          seg.fillStyle(hex, 1);
          seg.fillRoundedRect(
            -innerW / 2,
            segY,
            innerW,
            segH,
            { tl: 0, tr: 0, bl: radius - wall, br: radius - wall },
          );
        } else {
          seg.fillStyle(hex, 1);
          seg.fillRect(-innerW / 2, segY, innerW, segH);
        }
        container.add(seg);
      }

      // Solved indicator
      if (isTubeSolved(tube)) {
        const check = this.add.graphics();
        check.fillStyle(0x22c55e, 0.3);
        check.fillRoundedRect(-tubeW / 2, -tubeH / 2, tubeW, tubeH, radius);
        container.add(check);
      }

      // Hit area
      const hitArea = this.add
        .rectangle(0, 0, tubeW + 8 * scale, tubeH + 30 * scale)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => this.onTubeTap(idx));
      container.add(hitArea);

      this.tubeContainers.push(container);
    });
  }

  // ─── Interaction ──────────────────────────────────────

  private onTubeTap(idx: number) {
    if (this.phase !== 'idle') return;

    if (this.selectedTube === null) {
      // Select source tube
      if (this.board.tubes[idx].length === 0) return;
      if (isTubeSolved(this.board.tubes[idx])) return;
      this.selectedTube = idx;
      this.liftTube(idx, true);
    } else if (this.selectedTube === idx) {
      // Deselect
      this.liftTube(idx, false);
      this.selectedTube = null;
    } else {
      // Try to pour
      const move = canPour(this.board.tubes, this.selectedTube, idx);
      if (move) {
        this.liftTube(this.selectedTube, false);
        this.animatePour(move);
      } else {
        // Invalid — shake destination, switch selection
        this.shakeTube(idx);
        this.liftTube(this.selectedTube, false);

        // If tapped tube has water and isn't solved, select it instead
        if (this.board.tubes[idx].length > 0 && !isTubeSolved(this.board.tubes[idx])) {
          this.selectedTube = idx;
          this.liftTube(idx, true);
        } else {
          this.selectedTube = null;
        }
      }
    }
  }

  private liftTube(idx: number, up: boolean) {
    const container = this.tubeContainers[idx];
    if (!container) return;
    const positions = this.getTubeLayout();
    const targetY = positions[idx].y + (up ? LIFT_Y * this.dpr : 0);

    this.tweens.add({
      targets: container,
      y: targetY,
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  private shakeTube(idx: number) {
    const container = this.tubeContainers[idx];
    if (!container) return;
    const origX = container.x;

    this.tweens.add({
      targets: container,
      x: origX + 6 * this.dpr,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        container.x = origX;
      },
    });
  }

  // ─── Pour Animation ───────────────────────────────────

  private animatePour(move: PourMove) {
    this.phase = 'pouring';

    // Save state for undo
    this.moveHistory.push({
      tubes: this.board.tubes.map((t) => [...t]),
      from: move.from,
      to: move.to,
    });

    const srcTube = this.board.tubes[move.from];
    const srcColor = WATER_COLORS[srcTube[srcTube.length - 1]];
    const hex = parseInt(srcColor.replace('#', ''), 16);

    // Create flying segments
    const scale = this.dpr;
    const segH = SEGMENT_HEIGHT * scale;
    const innerW = (TUBE_WIDTH - TUBE_WALL * 2) * scale;
    const srcPos = this.getTubeLayout()[move.from];
    const dstPos = this.getTubeLayout()[move.to];
    const tubeH = TUBE_HEIGHT * scale;

    const flySegments: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < move.count; i++) {
      const seg = this.add.graphics();
      seg.fillStyle(hex, 1);
      seg.fillRect(-innerW / 2, -segH / 2, innerW, segH);
      seg.setPosition(srcPos.x, srcPos.y - tubeH / 2 - segH / 2 - i * segH);
      seg.setDepth(100);
      flySegments.push(seg);
    }

    // Execute pour on data
    this.board.tubes = executePour(this.board.tubes, move);
    this.moves++;

    // Redraw source immediately (segments removed)
    this.drawBoard();

    // Animate flying segments to destination
    const dstTube = this.board.tubes[move.to];
    const dstTopIndex = dstTube.length; // after pour

    flySegments.forEach((seg, i) => {
      const targetSegIdx = dstTopIndex - move.count + i;
      const targetY = dstPos.y + tubeH / 2 - (targetSegIdx + 1) * segH + TUBE_WALL * scale + segH / 2;

      this.tweens.add({
        targets: seg,
        x: dstPos.x,
        y: targetY,
        duration: 300,
        ease: 'Cubic.easeInOut',
        delay: i * 40,
        onComplete: () => {
          seg.destroy();
          if (i === move.count - 1) {
            this.onPourComplete(move);
          }
        },
      });
    });
  }

  private onPourComplete(move: PourMove) {
    // Check if destination tube is now solved
    const dstTube = this.board.tubes[move.to];
    if (isTubeSolved(dstTube) && !this.solvedTubes.has(move.to)) {
      this.solvedTubes.add(move.to);
      this.score += 100;
      this.celebrateTube(move.to);
    }

    this.drawBoard();
    this.selectedTube = null;
    this.emitState();

    // Check win
    if (isWon(this.board.tubes)) {
      this.phase = 'celebrating';
      this.time.delayedCall(600, () => {
        this.celebrateWin();
      });
    } else {
      this.phase = 'idle';
    }
  }

  // ─── Juice Effects ────────────────────────────────────

  private celebrateTube(idx: number) {
    const container = this.tubeContainers[idx];
    if (!container) return;
    const scale = this.dpr;

    // Bounce
    this.tweens.add({
      targets: container,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    // Particles
    const pos = this.getTubeLayout()[idx];
    for (let i = 0; i < 12; i++) {
      const p = this.add.circle(
        pos.x,
        pos.y,
        (3 + Math.random() * 3) * scale,
        0xfbbf24,
        1,
      );
      p.setDepth(200);
      const angle = (Math.PI * 2 * i) / 12;
      const dist = (40 + Math.random() * 30) * scale;
      this.tweens.add({
        targets: p,
        x: pos.x + Math.cos(angle) * dist,
        y: pos.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
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

  // ─── Undo ─────────────────────────────────────────────

  public undo() {
    if (this.phase !== 'idle' || this.moveHistory.length === 0) return;
    const prev = this.moveHistory.pop()!;
    this.board.tubes = prev.tubes;
    this.moves = Math.max(0, this.moves - 1);

    // Recalculate solved tubes
    this.solvedTubes.clear();
    this.board.tubes.forEach((t, i) => {
      if (isTubeSolved(t)) this.solvedTubes.add(i);
    });

    this.selectedTube = null;
    this.drawBoard();
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
