import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  TILE_COLORS,
  getStageConfig,
  type BoardState,
  type SlideMove,
  type GameConfig,
} from '../types';
import { createBoard, canSlide, executeSlide, isWon } from '../logic/board';

type GamePhase = 'idle' | 'sliding' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private boardState!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private cellContainers: Phaser.GameObjects.Container[][] = [];
  private phase: GamePhase = 'idle';
  private moveHistory: BoardState[] = [];
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
    const stageConfig = getStageConfig(stage);
    this.boardState = createBoard(stageConfig);
    this.phase = 'idle';
    this.moveHistory = [];
    this.score = 0;
    this.moves = 0;

    this.drawBoard();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private getCellSize(): number {
    const gridSize = this.boardState.gridSize;
    const scale = this.dpr;
    const maxW = DEFAULT_WIDTH * scale * 0.85;
    const maxH = DEFAULT_HEIGHT * scale * 0.7;
    const maxDim = Math.min(maxW, maxH);
    return Math.floor(maxDim / gridSize);
  }

  private getGridOrigin(): { x: number; y: number } {
    const gridSize = this.boardState.gridSize;
    const cellSize = this.getCellSize();
    const totalW = gridSize * cellSize;
    const totalH = gridSize * cellSize;
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    return {
      x: (w - totalW) / 2,
      y: (h - totalH) / 2 + 10 * this.dpr,
    };
  }

  private getCellPos(row: number, col: number): { x: number; y: number } {
    const origin = this.getGridOrigin();
    const cellSize = this.getCellSize();
    return {
      x: origin.x + col * cellSize + cellSize / 2,
      y: origin.y + row * cellSize + cellSize / 2,
    };
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear previous
    this.cellContainers.forEach(row => row.forEach(c => c.destroy()));
    this.cellContainers = [];

    const gridSize = this.boardState.gridSize;
    const cellSize = this.getCellSize();
    const gap = 4 * this.dpr;
    const tileSize = cellSize - gap;
    const cornerRadius = 8 * this.dpr;

    // Draw grid background
    this.children.removeAll();

    const origin = this.getGridOrigin();
    const gridBg = this.add.graphics();
    gridBg.fillStyle(0xe5e7eb, 1);
    gridBg.fillRoundedRect(
      origin.x - gap,
      origin.y - gap,
      gridSize * cellSize + gap * 2,
      gridSize * cellSize + gap * 2,
      cornerRadius + gap,
    );

    for (let r = 0; r < gridSize; r++) {
      this.cellContainers[r] = [];
      for (let c = 0; c < gridSize; c++) {
        const value = this.boardState.board[r][c];
        const pos = this.getCellPos(r, c);
        const container = this.add.container(pos.x, pos.y);

        if (value === -1) {
          // Empty cell — subtle background
          const emptyBg = this.add.graphics();
          emptyBg.fillStyle(0xd1d5db, 0.5);
          emptyBg.fillRoundedRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize, cornerRadius);
          container.add(emptyBg);
        } else {
          // Colored tile
          const color = TILE_COLORS[value % TILE_COLORS.length];
          const hex = parseInt(color.replace('#', ''), 16);

          // Shadow
          const shadow = this.add.graphics();
          shadow.fillStyle(0x000000, 0.1);
          shadow.fillRoundedRect(
            -tileSize / 2 + 2 * this.dpr,
            -tileSize / 2 + 2 * this.dpr,
            tileSize,
            tileSize,
            cornerRadius,
          );
          container.add(shadow);

          // Tile background
          const tile = this.add.graphics();
          tile.fillStyle(hex, 1);
          tile.fillRoundedRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize, cornerRadius);
          container.add(tile);

          // Highlight (top shine)
          const shine = this.add.graphics();
          shine.fillStyle(0xffffff, 0.25);
          shine.fillRoundedRect(
            -tileSize / 2 + 4 * this.dpr,
            -tileSize / 2 + 3 * this.dpr,
            tileSize - 8 * this.dpr,
            tileSize * 0.35,
            { tl: cornerRadius - 2, tr: cornerRadius - 2, bl: 0, br: 0 },
          );
          container.add(shine);

          // Hit area for interaction
          const hitArea = this.add
            .rectangle(0, 0, cellSize, cellSize)
            .setInteractive()
            .setAlpha(0.001);
          hitArea.on('pointerdown', () => this.onCellTap(r, c));
          container.add(hitArea);
        }

        this.cellContainers[r][c] = container;
      }
    }
  }

  // ─── Interaction ──────────────────────────────────────

  private onCellTap(row: number, col: number) {
    if (this.phase !== 'idle') return;

    const move = canSlide(this.boardState, row, col);
    if (!move) return;

    this.animateSlide(move);
  }

  // ─── Slide Animation ─────────────────────────────────

  private animateSlide(move: SlideMove) {
    this.phase = 'sliding';

    // Save state for undo
    this.moveHistory.push({
      board: this.boardState.board.map(r => [...r]),
      emptyRow: this.boardState.emptyRow,
      emptyCol: this.boardState.emptyCol,
      numColors: this.boardState.numColors,
      gridSize: this.boardState.gridSize,
    });

    // Get the tile container that's moving
    const tileContainer = this.cellContainers[move.fromRow][move.fromCol];
    const targetPos = this.getCellPos(move.toRow, move.toCol);

    // Execute the move on data
    this.boardState = executeSlide(this.boardState, move);
    this.moves++;

    // Animate the tile sliding
    this.tweens.add({
      targets: tileContainer,
      x: targetPos.x,
      y: targetPos.y,
      duration: 120,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.onSlideComplete();
      },
    });
  }

  private onSlideComplete() {
    this.drawBoard();
    this.emitState();

    // Check win
    if (isWon(this.boardState)) {
      this.score += Math.max(100, 500 - this.moves * 5);
      this.phase = 'celebrating';
      this.emitState();
      this.time.delayedCall(300, () => {
        this.celebrateWin();
      });
    } else {
      this.phase = 'idle';
    }
  }

  // ─── Juice Effects ────────────────────────────────────

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
    this.boardState = prev;
    this.moves = Math.max(0, this.moves - 1);
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
