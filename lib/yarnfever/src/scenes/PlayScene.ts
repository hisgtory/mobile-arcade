import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  NODE_RADIUS,
  YARN_COLORS,
  getStageConfig,
  type BoardState,
  type GameConfig,
} from '../types';
import { createBoard, countCrossings, isSolved } from '../logic/board';

type GamePhase = 'idle' | 'dragging' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private edgeGraphics!: Phaser.GameObjects.Graphics;
  private nodeCircles: Phaser.GameObjects.Arc[] = [];
  private phase: GamePhase = 'idle';
  private dragNodeIdx: number | null = null;
  private crossings = 0;
  private moves = 0;
  private score = 0;

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
    const scale = this.dpr;

    this.board = createBoard(
      stageConfig,
      DEFAULT_WIDTH * scale,
      DEFAULT_HEIGHT * scale,
    );

    this.phase = 'idle';
    this.dragNodeIdx = null;
    this.moves = 0;
    this.score = 0;

    // Edge graphics layer
    this.edgeGraphics = this.add.graphics();

    // Create node circles
    this.nodeCircles = [];
    const nodeR = NODE_RADIUS * scale;

    this.board.nodes.forEach((node, idx) => {
      const circle = this.add.circle(node.x, node.y, nodeR, 0x6366f1, 1);
      circle.setStrokeStyle(2 * scale, 0xffffff, 1);
      circle.setInteractive({ draggable: true, useHandCursor: true });
      circle.setDepth(10);

      circle.on('dragstart', () => this.onDragStart(idx));
      circle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) =>
        this.onDrag(idx, dragX, dragY),
      );
      circle.on('dragend', () => this.onDragEnd(idx));

      this.nodeCircles.push(circle);
    });

    this.input.setDraggable(this.nodeCircles);

    this.crossings = countCrossings(this.board.nodes, this.board.edges);
    this.drawEdges();
    this.emitState();
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawEdges() {
    const g = this.edgeGraphics;
    g.clear();
    const scale = this.dpr;
    const lineWidth = 3 * scale;

    this.board.edges.forEach((edge) => {
      const from = this.board.nodes[edge.from];
      const to = this.board.nodes[edge.to];
      const color = YARN_COLORS[edge.color % YARN_COLORS.length];
      const hex = parseInt(color.replace('#', ''), 16);

      // Check if this specific edge has any crossing
      const hasCrossing = this.edgeHasCrossing(edge);

      g.lineStyle(lineWidth, hex, hasCrossing ? 0.6 : 1);
      g.beginPath();
      g.moveTo(from.x, from.y);
      g.lineTo(to.x, to.y);
      g.strokePath();

      // Draw crossing indicator (small X) if edge crosses
      if (hasCrossing) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const s = 4 * scale;
        g.lineStyle(2 * scale, 0xef4444, 0.8);
        g.beginPath();
        g.moveTo(midX - s, midY - s);
        g.lineTo(midX + s, midY + s);
        g.strokePath();
        g.beginPath();
        g.moveTo(midX + s, midY - s);
        g.lineTo(midX - s, midY + s);
        g.strokePath();
      }
    });
  }

  private edgeHasCrossing(edge: { from: number; to: number }): boolean {
    const p1 = this.board.nodes[edge.from];
    const p2 = this.board.nodes[edge.to];

    for (const other of this.board.edges) {
      if (other.from === edge.from && other.to === edge.to) continue;
      if (other.from === edge.from || other.from === edge.to ||
          other.to === edge.from || other.to === edge.to) continue;

      const p3 = this.board.nodes[other.from];
      const p4 = this.board.nodes[other.to];

      if (this.segIntersect(p1, p2, p3, p4)) return true;
    }
    return false;
  }

  private segIntersect(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number },
  ): boolean {
    const d1 = (p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x);
    const d2 = (p4.x - p3.x) * (p2.y - p3.y) - (p4.y - p3.y) * (p2.x - p3.x);
    const d3 = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    const d4 = (p2.x - p1.x) * (p4.y - p1.y) - (p2.y - p1.y) * (p4.x - p1.x);

    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
           ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }

  // ─── Drag Interaction ─────────────────────────────────

  private onDragStart(idx: number) {
    if (this.phase === 'celebrating') return;
    this.phase = 'dragging';
    this.dragNodeIdx = idx;

    // Scale up the dragged node
    const circle = this.nodeCircles[idx];
    this.tweens.add({
      targets: circle,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      ease: 'Back.easeOut',
    });
    circle.setDepth(20);
  }

  private onDrag(idx: number, dragX: number, dragY: number) {
    if (this.phase !== 'dragging' || this.dragNodeIdx !== idx) return;

    const scale = this.dpr;
    const margin = 20 * scale;
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;

    // Clamp position within bounds
    const x = Math.max(margin, Math.min(w - margin, dragX));
    const y = Math.max(margin, Math.min(h - margin, dragY));

    this.board.nodes[idx].x = x;
    this.board.nodes[idx].y = y;
    this.nodeCircles[idx].setPosition(x, y);

    this.drawEdges();

    // Update crossings count in real time
    const newCrossings = countCrossings(this.board.nodes, this.board.edges);
    if (newCrossings !== this.crossings) {
      this.crossings = newCrossings;
      this.emitState();
    }
  }

  private onDragEnd(idx: number) {
    if (this.dragNodeIdx !== idx) return;

    // Scale back down
    const circle = this.nodeCircles[idx];
    this.tweens.add({
      targets: circle,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Back.easeIn',
    });
    circle.setDepth(10);

    this.dragNodeIdx = null;
    this.moves++;

    // Recalculate crossings
    this.crossings = countCrossings(this.board.nodes, this.board.edges);
    this.emitState();

    // Check win
    if (isSolved(this.board.nodes, this.board.edges)) {
      this.phase = 'celebrating';
      this.score = Math.max(100, 1000 - this.moves * 10);
      this.emitState();
      this.celebrateWin();
    } else {
      this.phase = 'idle';
    }
  }

  // ─── Celebration ──────────────────────────────────────

  private celebrateWin() {
    const scale = this.dpr;

    // Flash all edges green
    const g = this.edgeGraphics;
    g.clear();
    const lineWidth = 4 * scale;

    this.board.edges.forEach((edge) => {
      const from = this.board.nodes[edge.from];
      const to = this.board.nodes[edge.to];
      g.lineStyle(lineWidth, 0x22c55e, 1);
      g.beginPath();
      g.moveTo(from.x, from.y);
      g.lineTo(to.x, to.y);
      g.strokePath();
    });

    // Bounce all nodes
    this.nodeCircles.forEach((circle) => {
      circle.setFillStyle(0x22c55e, 1);
      this.tweens.add({
        targets: circle,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut',
        delay: Math.random() * 200,
      });
    });

    // Confetti burst
    const w = DEFAULT_WIDTH * scale;
    const h = DEFAULT_HEIGHT * scale;
    for (let i = 0; i < 30; i++) {
      const colors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (4 + Math.random() * 6) * scale;
      const p = this.add.rectangle(
        w / 2 + (Math.random() - 0.5) * 60 * scale,
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

  // ─── Public Methods ───────────────────────────────────

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
    this.game.events.emit('crossings-update', { crossings: this.crossings });
  }
}
