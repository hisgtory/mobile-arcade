import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  FLOW_COLORS,
  getStageConfig,
  type BoardState,
  type Coord,
  type GameConfig,
} from '../types';
import {
  createBoard,
  isAdjacent,
  isEndpoint,
  isFlowComplete,
  isWon,
  getCoveragePercent,
  isCellOccupied,
} from '../logic/board';

type GamePhase = 'idle' | 'drawing' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Layout
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cellSize = 0;

  // Visual
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private endpointGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;

  // State
  private phase: GamePhase = 'idle';
  private activeColor: number | null = null;
  private moves = 0;
  private score = 0;
  private completedFlows = new Set<number>();
  private moveHistory: { colorIndex: number; path: Coord[] }[] = [];

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
    this.activeColor = null;
    this.moves = 0;
    this.score = 0;
    this.completedFlows = new Set();
    this.moveHistory = [];

    this.calculateLayout();

    // Create graphics layers
    this.gridGraphics = this.add.graphics();
    this.pathGraphics = this.add.graphics();
    this.endpointGraphics = this.add.graphics();
    this.overlayGraphics = this.add.graphics();

    this.drawGrid();
    this.drawEndpoints();
    this.emitState();

    // Input handlers
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) =>
      this.onPointerDown(pointer),
    );
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) =>
      this.onPointerMove(pointer),
    );
    this.input.on('pointerup', () => this.onPointerUp());
  }

  // ─── Layout ───────────────────────────────────────────

  private calculateLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const padding = 24 * this.dpr;

    const maxGridW = w - padding * 2;
    const maxGridH = h - padding * 2 - 40 * this.dpr; // Reserve top space
    const cellW = Math.floor(maxGridW / this.board.cols);
    const cellH = Math.floor(maxGridH / this.board.rows);
    this.cellSize = Math.min(cellW, cellH);

    const gridW = this.cellSize * this.board.cols;
    const gridH = this.cellSize * this.board.rows;
    this.gridOriginX = (w - gridW) / 2;
    this.gridOriginY = (h - gridH) / 2 + 10 * this.dpr;
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawGrid() {
    const g = this.gridGraphics;
    g.clear();
    const s = this.cellSize;
    const ox = this.gridOriginX;
    const oy = this.gridOriginY;
    const rows = this.board.rows;
    const cols = this.board.cols;

    // Background
    g.fillStyle(0x1a1a2e, 1);
    g.fillRoundedRect(
      ox - 4 * this.dpr,
      oy - 4 * this.dpr,
      cols * s + 8 * this.dpr,
      rows * s + 8 * this.dpr,
      8 * this.dpr,
    );

    // Grid cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.fillStyle(0x16213e, 1);
        g.fillRect(ox + c * s + 1, oy + r * s + 1, s - 2, s - 2);
      }
    }

    // Grid lines
    g.lineStyle(1, 0x2a3a5c, 0.6);
    for (let r = 0; r <= rows; r++) {
      g.lineBetween(ox, oy + r * s, ox + cols * s, oy + r * s);
    }
    for (let c = 0; c <= cols; c++) {
      g.lineBetween(ox + c * s, oy, ox + c * s, oy + rows * s);
    }
  }

  private drawEndpoints() {
    const g = this.endpointGraphics;
    g.clear();
    g.setDepth(10);

    const s = this.cellSize;
    const ox = this.gridOriginX;
    const oy = this.gridOriginY;
    const dotRadius = s * 0.32;

    for (const flow of this.board.flows) {
      const hex = parseInt(FLOW_COLORS[flow.colorIndex].replace('#', ''), 16);
      for (const ep of flow.endpoints) {
        const cx = ox + ep.col * s + s / 2;
        const cy = oy + ep.row * s + s / 2;

        // Glow
        g.fillStyle(hex, 0.25);
        g.fillCircle(cx, cy, dotRadius + 4 * this.dpr);

        // Main dot
        g.fillStyle(hex, 1);
        g.fillCircle(cx, cy, dotRadius);

        // Highlight
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(
          cx - dotRadius * 0.2,
          cy - dotRadius * 0.2,
          dotRadius * 0.4,
        );
      }
    }
  }

  private drawPaths() {
    const g = this.pathGraphics;
    g.clear();
    g.setDepth(5);

    const s = this.cellSize;
    const ox = this.gridOriginX;
    const oy = this.gridOriginY;
    const lineWidth = s * 0.45;

    for (const [colorIndex, path] of this.board.paths) {
      if (path.length === 0) continue;

      const hex = parseInt(FLOW_COLORS[colorIndex].replace('#', ''), 16);
      const isComplete = this.completedFlows.has(colorIndex);
      const isActive = this.activeColor === colorIndex;

      // Path fill for covered cells
      for (const coord of path) {
        const cx = ox + coord.col * s + s / 2;
        const cy = oy + coord.row * s + s / 2;
        g.fillStyle(hex, isComplete ? 0.3 : 0.15);
        g.fillRect(ox + coord.col * s + 1, oy + coord.row * s + 1, s - 2, s - 2);
      }

      // Draw pipe connections between adjacent cells
      g.lineStyle(lineWidth, hex, isActive ? 1 : 0.85);

      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        const ax = ox + a.col * s + s / 2;
        const ay = oy + a.row * s + s / 2;
        const bx = ox + b.col * s + s / 2;
        const by = oy + b.row * s + s / 2;
        g.lineBetween(ax, ay, bx, by);
      }

      // Round caps at each path node
      for (const coord of path) {
        const cx = ox + coord.col * s + s / 2;
        const cy = oy + coord.row * s + s / 2;
        g.fillStyle(hex, isActive ? 1 : 0.85);
        g.fillCircle(cx, cy, lineWidth / 2);
      }
    }
  }

  // ─── Input ────────────────────────────────────────────

  private getCellFromPointer(pointer: Phaser.Input.Pointer): Coord | null {
    const x = pointer.x - this.gridOriginX;
    const y = pointer.y - this.gridOriginY;
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (row < 0 || row >= this.board.rows || col < 0 || col >= this.board.cols) {
      return null;
    }
    return { row, col };
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.phase === 'celebrating') return;

    const cell = this.getCellFromPointer(pointer);
    if (!cell) return;

    // Check if we're touching an endpoint or an existing path
    const gridCell = this.board.grid[cell.row][cell.col];

    if (gridCell.isEndpoint) {
      // Start drawing from this endpoint's color
      const colorIndex = gridCell.colorIndex;

      // Save current path for undo
      const currentPath = this.board.paths.get(colorIndex) ?? [];
      if (currentPath.length > 0) {
        this.moveHistory.push({
          colorIndex,
          path: [...currentPath],
        });
      }

      // Clear existing path for this color
      this.board.paths.set(colorIndex, [cell]);
      this.completedFlows.delete(colorIndex);
      this.activeColor = colorIndex;
      this.phase = 'drawing';
      this.drawPaths();
      this.drawEndpoints();
      return;
    }

    // Check if touching an existing path - start extending from that point
    for (const [colorIndex, path] of this.board.paths) {
      const idx = path.findIndex(
        (c) => c.row === cell.row && c.col === cell.col,
      );
      if (idx >= 0) {
        // Save for undo
        this.moveHistory.push({
          colorIndex,
          path: [...path],
        });

        // Trim path to this point
        this.board.paths.set(colorIndex, path.slice(0, idx + 1));
        this.completedFlows.delete(colorIndex);
        this.activeColor = colorIndex;
        this.phase = 'drawing';
        this.drawPaths();
        this.drawEndpoints();
        return;
      }
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.phase !== 'drawing' || this.activeColor === null) return;
    if (!pointer.isDown) return;

    const cell = this.getCellFromPointer(pointer);
    if (!cell) return;

    const path = this.board.paths.get(this.activeColor);
    if (!path || path.length === 0) return;

    const last = path[path.length - 1];

    // Same cell - ignore
    if (last.row === cell.row && last.col === cell.col) return;

    // Must be adjacent
    if (!isAdjacent(last, cell)) return;

    // Check if we're backtracking (going to the second-to-last cell)
    if (path.length >= 2) {
      const prev = path[path.length - 2];
      if (prev.row === cell.row && prev.col === cell.col) {
        // Backtrack: remove last cell
        path.pop();
        this.drawPaths();
        this.drawEndpoints();
        return;
      }
    }

    // Check if the cell already exists in our path (would create loop)
    const existsInPath = path.findIndex(
      (c) => c.row === cell.row && c.col === cell.col,
    );
    if (existsInPath >= 0) return;

    // Check if cell is occupied by another flow's path
    const occupiedBy = isCellOccupied(this.board, cell, this.activeColor);
    if (occupiedBy !== null) {
      // Clear the conflicting path back to before this cell
      const otherPath = this.board.paths.get(occupiedBy);
      if (otherPath) {
        const conflictIdx = otherPath.findIndex(
          (c) => c.row === cell.row && c.col === cell.col,
        );
        if (conflictIdx >= 0) {
          this.board.paths.set(occupiedBy, otherPath.slice(0, conflictIdx));
          this.completedFlows.delete(occupiedBy);
        }
      }
    }

    // Check if cell is an endpoint of a different color
    const gridCell = this.board.grid[cell.row][cell.col];
    if (gridCell.isEndpoint && gridCell.colorIndex !== this.activeColor) {
      return; // Can't cross other endpoints
    }

    // Add cell to path
    path.push(cell);

    // Check if we've reached the other endpoint
    if (
      gridCell.isEndpoint &&
      gridCell.colorIndex === this.activeColor &&
      isEndpoint(this.board, cell, this.activeColor)
    ) {
      // Check if path starts from an endpoint too
      const first = path[0];
      if (
        isEndpoint(this.board, first, this.activeColor) &&
        !(first.row === cell.row && first.col === cell.col)
      ) {
        this.completedFlows.add(this.activeColor);
        this.score += 50;
      }
    }

    this.drawPaths();
    this.drawEndpoints();
  }

  private onPointerUp() {
    if (this.phase !== 'drawing' || this.activeColor === null) return;

    const path = this.board.paths.get(this.activeColor);
    if (path && path.length > 0) {
      this.moves++;
    }

    // Check if the flow is complete
    if (this.completedFlows.has(this.activeColor)) {
      this.celebrateFlow(this.activeColor);
    }

    this.activeColor = null;
    this.phase = 'idle';
    this.emitState();

    // Check win condition
    if (isWon(this.board)) {
      this.phase = 'celebrating';
      this.time.delayedCall(400, () => this.celebrateWin());
    }
  }

  // ─── Effects ──────────────────────────────────────────

  private celebrateFlow(colorIndex: number) {
    const path = this.board.paths.get(colorIndex);
    if (!path) return;

    const s = this.cellSize;
    const ox = this.gridOriginX;
    const oy = this.gridOriginY;
    const hex = parseInt(FLOW_COLORS[colorIndex].replace('#', ''), 16);

    // Sparkle particles along path
    const sparkleCount = Math.min(path.length, 8);
    for (let i = 0; i < sparkleCount; i++) {
      const idx = Math.floor((i / sparkleCount) * path.length);
      const coord = path[idx];
      const cx = ox + coord.col * s + s / 2;
      const cy = oy + coord.row * s + s / 2;

      for (let j = 0; j < 4; j++) {
        const p = this.add.circle(
          cx,
          cy,
          (2 + Math.random() * 2) * this.dpr,
          hex,
          1,
        );
        p.setDepth(200);
        const angle = Math.random() * Math.PI * 2;
        const dist = (15 + Math.random() * 15) * this.dpr;
        this.tweens.add({
          targets: p,
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          alpha: 0,
          scale: 0,
          duration: 400,
          delay: i * 30,
          ease: 'Cubic.easeOut',
          onComplete: () => p.destroy(),
        });
      }
    }
  }

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    // Completion bonus
    const coverage = getCoveragePercent(this.board);
    this.score += coverage; // Bonus for coverage

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
    this.board.paths.set(prev.colorIndex, prev.path);
    this.moves = Math.max(0, this.moves - 1);

    // Recalculate completed flows
    this.completedFlows.clear();
    for (const flow of this.board.flows) {
      if (isFlowComplete(this.board, flow.colorIndex)) {
        this.completedFlows.add(flow.colorIndex);
      }
    }

    this.drawPaths();
    this.drawEndpoints();
    this.emitState();
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    const coverage = getCoveragePercent(this.board);
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
    this.game.events.emit('flows-update', {
      completed: this.completedFlows.size,
      total: this.board.flows.length,
      coverage,
    });
  }
}
