import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  NODE_COLOR,
  NODE_ACTIVE_COLOR,
  EDGE_NORMAL_COLOR,
  EDGE_CROSS_COLOR,
  EDGE_CLEAR_COLOR,
  getStageConfig,
  type BoardState,
  type GameConfig,
} from '../types';
import { createBoard, countCrossings, getCrossingEdges } from '../logic/board';

const NODE_RADIUS = 14;
const EDGE_WIDTH = 3;

type GamePhase = 'idle' | 'dragging' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private nodeGraphics: Phaser.GameObjects.Arc[] = [];
  private edgeGraphics: Phaser.GameObjects.Graphics | null = null;
  private phase: GamePhase = 'idle';
  private dragNode: number | null = null;
  private crossings = 0;
  private moves = 0;
  private score = 0;
  private initialCrossings = 0;

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
    this.dragNode = null;
    this.moves = 0;
    this.score = 0;

    // Scale board positions to screen
    this.scaleBoardToScreen();

    this.crossings = countCrossings(this.board.nodes, this.board.edges);
    this.initialCrossings = this.crossings;

    this.drawBoard();
    this.setupInput();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private scaleBoardToScreen() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const margin = 40 * this.dpr;

    for (const node of this.board.nodes) {
      node.x = margin + node.x * (w - margin * 2);
      node.y = margin + node.y * (h - margin * 2);
    }
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear previous
    this.nodeGraphics.forEach((n) => n.destroy());
    this.nodeGraphics = [];
    this.edgeGraphics?.destroy();

    const scale = this.dpr;
    const crossingEdges = getCrossingEdges(this.board.nodes, this.board.edges);

    // Draw edges
    const gfx = this.add.graphics();
    this.edgeGraphics = gfx;

    for (let i = 0; i < this.board.edges.length; i++) {
      const edge = this.board.edges[i];
      const from = this.board.nodes[edge.from];
      const to = this.board.nodes[edge.to];

      const isCrossing = crossingEdges.has(i);
      let colorHex: number;
      if (this.crossings === 0) {
        colorHex = parseInt(EDGE_CLEAR_COLOR.replace('#', ''), 16);
      } else if (isCrossing) {
        colorHex = parseInt(EDGE_CROSS_COLOR.replace('#', ''), 16);
      } else {
        colorHex = parseInt(EDGE_NORMAL_COLOR.replace('#', ''), 16);
      }

      gfx.lineStyle(EDGE_WIDTH * scale, colorHex, 1);
      gfx.beginPath();
      gfx.moveTo(from.x, from.y);
      gfx.lineTo(to.x, to.y);
      gfx.strokePath();
    }

    // Draw nodes
    const nodeRadius = NODE_RADIUS * scale;

    for (const node of this.board.nodes) {
      const nodeColor = this.crossings === 0
        ? parseInt(EDGE_CLEAR_COLOR.replace('#', ''), 16)
        : (node.id === this.dragNode
          ? parseInt(NODE_ACTIVE_COLOR.replace('#', ''), 16)
          : parseInt(NODE_COLOR.replace('#', ''), 16));

      const circle = this.add.circle(node.x, node.y, nodeRadius, nodeColor, 1);
      circle.setStrokeStyle(2 * scale, 0xffffff);
      circle.setDepth(10);
      this.nodeGraphics.push(circle);
    }
  }

  // ─── Input ────────────────────────────────────────────

  private setupInput() {
    const scale = this.dpr;
    const hitRadius = (NODE_RADIUS + 10) * scale;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase === 'celebrating') return;

      // Find closest node within hit radius
      let closest: number | null = null;
      let closestDist = hitRadius;

      for (const node of this.board.nodes) {
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closest = node.id;
          closestDist = dist;
        }
      }

      if (closest !== null) {
        this.dragNode = closest;
        this.phase = 'dragging';
        this.drawBoard();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'dragging' || this.dragNode === null) return;

      const w = DEFAULT_WIDTH * this.dpr;
      const h = DEFAULT_HEIGHT * this.dpr;
      const margin = 20 * this.dpr;

      // Clamp to screen bounds
      const node = this.board.nodes[this.dragNode];
      node.x = Phaser.Math.Clamp(pointer.x, margin, w - margin);
      node.y = Phaser.Math.Clamp(pointer.y, margin, h - margin);

      // Recalculate crossings
      this.crossings = countCrossings(this.board.nodes, this.board.edges);
      this.drawBoard();
      this.emitState();
    });

    this.input.on('pointerup', () => {
      if (this.phase !== 'dragging') return;

      if (this.dragNode !== null) {
        this.moves++;
      }

      this.dragNode = null;
      this.phase = 'idle';
      this.crossings = countCrossings(this.board.nodes, this.board.edges);
      this.drawBoard();
      this.emitState();

      // Check win
      if (this.crossings === 0) {
        this.phase = 'celebrating';
        this.score = this.calculateScore();
        this.emitState();
        this.celebrateWin();
      }
    });
  }

  // ─── Score ────────────────────────────────────────────

  private calculateScore(): number {
    const stage = this.config.stage ?? 1;
    const baseScore = stage * 100;
    // Bonus for fewer moves
    const moveBonus = Math.max(0, (this.initialCrossings * 3 - this.moves) * 10);
    return baseScore + moveBonus;
  }

  // ─── Celebration ──────────────────────────────────────

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const scale = this.dpr;

    // Pulse all nodes
    for (const circle of this.nodeGraphics) {
      this.tweens.add({
        targets: circle,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 300,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }

    // Confetti burst
    for (let i = 0; i < 24; i++) {
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

    // Emit stage clear after delay
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
    this.game.events.emit('crossings-update', { crossings: this.crossings });
    this.game.events.emit('moves-update', { moves: this.moves });
  }
}
