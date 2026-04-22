import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  MAX_ITEM_LEVEL,
  ITEM_COLORS,
  ITEM_LABELS,
  getStageConfig,
  type BoardState,
  type GameConfig,
} from '../types';
import {
  createBoard,
  spawnItem,
  canMerge,
  executeMerge,
  isWon,
  isGameOver,
  emptyCount,
} from '../logic/board';

const CELL_GAP = 4;
const BOARD_PADDING = 16;

// ─── Scoring ─────────────────────────────────────────────
const SCORE_MERGE = 10;
const SCORE_HIGH_LEVEL_BONUS = 50;
const SCORE_CLUE_BONUS = 200;

// ─── Animation Delays ────────────────────────────────────
const CLUE_CELEBRATION_DELAY = 600;
const NORMAL_MERGE_DELAY = 150;

type Phase = 'idle' | 'merging' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  private phase: Phase = 'idle';
  private score = 0;
  private moves = 0;
  private combo = 1;
  private lastMergeTime = 0;

  // Grid rendering
  private cellSize = 0;
  private boardOffsetX = 0;
  private boardOffsetY = 0;
  private cellGraphics: Phaser.GameObjects.Container[] = [];

  // Drag state
  private dragFrom: number | null = null;
  private dragIndicator: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    // TODO: Use Phaser registry or scene data for better type safety
    this.config = data.config ?? (this.game as any).__mysteryTownConfig ?? {};
    this.dpr = data.dpr ?? (this.game as any).__dpr ?? 1;
  }

  create() {
    const stage = this.config.stage ?? 1;
    const stageConfig = getStageConfig(stage);
    this.board = createBoard(stageConfig);
    this.phase = 'idle';
    this.score = 0;
    this.moves = 0;
    this.combo = 1;
    this.lastMergeTime = 0;
    this.dragFrom = null;

    this.calculateLayout();
    
    // Initial draw
    this.cellGraphics = [];
    this.drawBoard(true);
    this.emitState();

    // Input handlers
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onPointerUp(p));

    this.events.on('shutdown', this.shutdown, this);
  }

  // ─── Layout ───────────────────────────────────────────

  private calculateLayout() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const pad = BOARD_PADDING * this.dpr;
    const gap = CELL_GAP * this.dpr;
    const { cols, rows } = this.board;

    const availW = w - pad * 2;
    const availH = h - pad * 2;

    this.cellSize = Math.floor(
      Math.min(
        (availW - (cols - 1) * gap) / cols,
        (availH - (rows - 1) * gap) / rows,
      ),
    );

    const gridW = cols * this.cellSize + (cols - 1) * gap;
    const gridH = rows * this.cellSize + (rows - 1) * gap;
    this.boardOffsetX = (w - gridW) / 2;
    this.boardOffsetY = (h - gridH) / 2;
  }

  private getCellRect(idx: number): { x: number; y: number; w: number; h: number } {
    const gap = CELL_GAP * this.dpr;
    const col = idx % this.board.cols;
    const row = Math.floor(idx / this.board.cols);
    return {
      x: this.boardOffsetX + col * (this.cellSize + gap),
      y: this.boardOffsetY + row * (this.cellSize + gap),
      w: this.cellSize,
      h: this.cellSize,
    };
  }

  private getCellIndex(px: number, py: number): number {
    const gap = CELL_GAP * this.dpr;
    const { cols, rows } = this.board;
    const step = this.cellSize + gap;

    const col = Math.floor((px - this.boardOffsetX) / step);
    const row = Math.floor((py - this.boardOffsetY) / step);

    if (col < 0 || col >= cols || row < 0 || row >= rows) return -1;

    // Verify pointer is within cell bounds (not in gap)
    const cellX = this.boardOffsetX + col * step;
    const cellY = this.boardOffsetY + row * step;
    if (px > cellX + this.cellSize || py > cellY + this.cellSize) return -1;

    return row * cols + col;
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard(initial = false) {
    const { cells, cols, rows } = this.board;
    const radius = 8 * this.dpr;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const val = cells[idx];
        
        let container: Phaser.GameObjects.Container;
        if (initial) {
          const rect = this.getCellRect(idx);
          container = this.add.container(rect.x + rect.w / 2, rect.y + rect.h / 2);
          this.cellGraphics.push(container);
        } else {
          container = this.cellGraphics[idx];
          container.removeAll(true);
        }

        const rect = this.getCellRect(idx);

        // Cell background
        const bg = this.add.graphics();
        bg.fillStyle(0xf3f4f6, 1);
        bg.fillRoundedRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h, radius);
        bg.lineStyle(1 * this.dpr, 0xe5e7eb, 1);
        bg.strokeRoundedRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h, radius);
        container.add(bg);

        if (val !== null) {
          // Item background (colored)
          const colorHex = parseInt(ITEM_COLORS[val - 1].replace('#', ''), 16);
          const itemBg = this.add.graphics();
          itemBg.fillStyle(colorHex, 0.2);
          itemBg.fillRoundedRect(-rect.w / 2 + 2 * this.dpr, -rect.h / 2 + 2 * this.dpr, rect.w - 4 * this.dpr, rect.h - 4 * this.dpr, radius - 2);
          container.add(itemBg);

          // Item emoji
          const label = ITEM_LABELS[val - 1];
          const fontSize = Math.floor(this.cellSize * 0.45);
          const text = this.add.text(0, -4 * this.dpr, label, {
            fontSize: `${fontSize}px`,
            align: 'center',
          }).setOrigin(0.5, 0.5);
          container.add(text);

          // Level indicator
          const lvSize = Math.floor(this.cellSize * 0.2);
          const lvText = this.add.text(0, rect.h / 2 - lvSize - 2 * this.dpr, `Lv${val}`, {
            fontSize: `${lvSize}px`,
            fontFamily: 'system-ui, sans-serif',
            color: ITEM_COLORS[val - 1],
            fontStyle: 'bold',
            align: 'center',
          }).setOrigin(0.5, 0.5);
          container.add(lvText);

          // Highlight if selected
          if (this.dragFrom === idx) {
            const highlight = this.add.graphics();
            highlight.lineStyle(3 * this.dpr, colorHex, 0.8);
            highlight.strokeRoundedRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h, radius);
            container.add(highlight);
          }
        }
      }
    }
  }

  // ─── Input Handling ───────────────────────────────────

  private onPointerDown(p: Phaser.Input.Pointer) {
    if (this.phase !== 'idle') return;

    const idx = this.getCellIndex(p.x, p.y);
    if (idx < 0) return;

    const val = this.board.cells[idx];

    if (val !== null) {
      // Start drag from an item
      this.dragFrom = idx;
      this.drawBoard();
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer) {
    if (this.dragFrom === null || this.phase !== 'idle') return;

    // Show drag indicator
    if (this.dragIndicator) {
      this.dragIndicator.destroy();
      this.dragIndicator = null;
    }

    const toIdx = this.getCellIndex(p.x, p.y);
    if (toIdx >= 0 && toIdx !== this.dragFrom) {
      const move = canMerge(this.board, this.dragFrom, toIdx);
      if (move) {
        const rect = this.getCellRect(toIdx);
        const g = this.add.graphics();
        g.lineStyle(3 * this.dpr, 0x22c55e, 0.6);
        g.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, 8 * this.dpr);
        g.setDepth(100);
        this.dragIndicator = g;
      }
    }
  }

  private onPointerUp(p: Phaser.Input.Pointer) {
    if (this.dragIndicator) {
      this.dragIndicator.destroy();
      this.dragIndicator = null;
    }

    if (this.dragFrom === null || this.phase !== 'idle') {
      this.dragFrom = null;
      return;
    }

    const toIdx = this.getCellIndex(p.x, p.y);

    if (toIdx >= 0 && toIdx !== this.dragFrom) {
      const move = canMerge(this.board, this.dragFrom, toIdx);
      if (move) {
        this.performMerge(move.fromIdx, move.toIdx, move.newLevel);
      } else {
        // Invalid merge — shake target
        if (toIdx >= 0) this.shakeCell(toIdx);
      }
    }

    this.dragFrom = null;
    this.drawBoard();
  }

  // ─── Merge Execution ──────────────────────────────────

  private performMerge(fromIdx: number, toIdx: number, newLevel: number) {
    this.phase = 'merging';
    this.moves++;

    // Time-based combo (2s window)
    const now = Date.now();
    if (now - this.lastMergeTime < 2000) {
      this.combo = 1.5;
    } else {
      this.combo = 1;
    }
    this.lastMergeTime = now;

    const { clueCreated } = executeMerge(this.board, { fromIdx, toIdx, newLevel });

    // Score
    let gained = SCORE_MERGE;
    if (newLevel >= 3) gained += SCORE_HIGH_LEVEL_BONUS;
    if (clueCreated) gained += SCORE_CLUE_BONUS;
    
    this.score += Math.round(gained * this.combo);

    this.drawBoard();
    this.animateMerge(toIdx, newLevel, clueCreated);
  }

  // ─── Animations ───────────────────────────────────────

  private animateSpawn(idx: number) {
    const container = this.cellGraphics[idx];
    if (!container) return;
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  private animateMerge(idx: number, level: number, clueCreated: boolean) {
    const container = this.cellGraphics[idx];
    if (!container) return;

    // Pop effect
    container.setScale(0.5);
    this.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.emitMergeParticles(idx, level);

        if (clueCreated) {
          this.celebrateClue(idx);
        }

        this.time.delayedCall(clueCreated ? CLUE_CELEBRATION_DELAY : NORMAL_MERGE_DELAY, () => {
          // Auto-spawn a new item after merge
          const spawned = spawnItem(this.board);
          if (spawned >= 0) {
            this.drawBoard();
            this.animateSpawn(spawned);
          } else {
            this.drawBoard();
          }

          this.emitState();

          if (isWon(this.board)) {
            this.phase = 'celebrating';
            this.time.delayedCall(400, () => this.celebrateWin());
          } else {
            this.checkGameOver();
            this.phase = 'idle';
          }
        });
      },
    });
  }

  private emitMergeParticles(idx: number, level: number) {
    const rect = this.getCellRect(idx);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const colorHex = parseInt(ITEM_COLORS[Math.min(level - 1, ITEM_COLORS.length - 1)].replace('#', ''), 16);

    for (let i = 0; i < 8; i++) {
      const size = (2 + Math.random() * 3) * this.dpr;
      const particle = this.add.circle(cx, cy, size, colorHex, 1);
      particle.setDepth(200);
      const angle = (Math.PI * 2 * i) / 8;
      const dist = (20 + Math.random() * 15) * this.dpr;
      this.tweens.add({
        targets: particle,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private celebrateClue(idx: number) {
    const rect = this.getCellRect(idx);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;

    // Big star burst for clue
    for (let i = 0; i < 16; i++) {
      const colors = [0xef4444, 0xfbbf24, 0xf97316];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (3 + Math.random() * 4) * this.dpr;
      const p = this.add.circle(cx, cy, size, color, 1);
      p.setDepth(300);
      const angle = (Math.PI * 2 * i) / 16;
      const dist = (35 + Math.random() * 25) * this.dpr;
      this.tweens.add({
        targets: p,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.3,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    // Flash text
    const fontSize = Math.floor(24 * this.dpr);
    const clueText = this.add.text(cx, cy - 30 * this.dpr, '🗝️ Clue!', {
      fontSize: `${fontSize}px`,
      fontFamily: 'system-ui, sans-serif',
      color: '#EF4444',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(400);

    this.tweens.add({
      targets: clueText,
      y: cy - 60 * this.dpr,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => clueText.destroy(),
    });
  }

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    // Confetti
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
      p.setDepth(500);
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
        clues: this.board.cluesCollected,
      });
    });
  }

  private shakeCell(idx: number) {
    const container = this.cellGraphics[idx];
    if (!container) return;
    const origX = container.x;
    this.tweens.add({
      targets: container,
      x: origX + 4 * this.dpr,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        container.x = origX;
      },
    });
  }

  // ─── Game State ───────────────────────────────────────

  private checkGameOver() {
    if (isGameOver(this.board)) {
      this.time.delayedCall(300, () => {
        this.game.events.emit('game-over', {
          score: this.score,
          moves: this.moves,
          stage: this.config.stage ?? 1,
          clues: this.board.cluesCollected,
        });
        // Reset phase after emit so restart() from React still works
        this.phase = 'idle';
      });
    }
  }

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
    this.game.events.emit('clues-update', {
      clues: this.board.cluesCollected,
      target: this.board.targetClues,
    });
    this.game.events.emit('empty-update', {
      empty: emptyCount(this.board),
      total: this.board.cells.length,
    });
  }

  // ─── Public API ───────────────────────────────────────

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  shutdown(): void {
    this.tweens.killAll();
    this.cellGraphics.forEach((c) => c.destroy());
    this.cellGraphics = [];
  }
}
