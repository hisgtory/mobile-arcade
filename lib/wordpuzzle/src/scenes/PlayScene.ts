import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  CELL_COLORS,
  FOUND_COLORS,
  type BoardState,
  type GameConfig,
} from '../types';
import { createBoard, checkWord, isWon, getStageConfig } from '../logic/board';

const CELL_GAP = 4;
const CELL_RADIUS = 8;

type GamePhase = 'idle' | 'selecting' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private cellContainers: Phaser.GameObjects.Container[][] = [];
  private selectedCells: { row: number; col: number }[] = [];
  private phase: GamePhase = 'idle';
  private score = 0;
  private foundCount = 0;
  private wordListTexts: Phaser.GameObjects.Text[] = [];

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
    this.selectedCells = [];
    this.phase = 'idle';
    this.score = 0;
    this.foundCount = 0;

    this.drawBoard();
    this.drawWordList();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private getCellSize(): number {
    const w = DEFAULT_WIDTH * this.dpr;
    const gridSize = this.board.gridSize;
    const totalGap = CELL_GAP * this.dpr * (gridSize + 1);
    return (w - totalGap) / gridSize;
  }

  private getCellPosition(row: number, col: number): { x: number; y: number } {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const cellSize = this.getCellSize();
    const gap = CELL_GAP * this.dpr;
    const gridSize = this.board.gridSize;
    const totalW = gridSize * cellSize + (gridSize - 1) * gap;
    const totalH = gridSize * cellSize + (gridSize - 1) * gap;
    const startX = (w - totalW) / 2;
    const startY = (h - totalH) / 2 - 40 * this.dpr; // offset up for word list

    return {
      x: startX + col * (cellSize + gap) + cellSize / 2,
      y: startY + row * (cellSize + gap) + cellSize / 2,
    };
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear previous
    this.cellContainers.forEach((row) => row.forEach((c) => c.destroy()));
    this.cellContainers = [];

    const cellSize = this.getCellSize();
    const radius = CELL_RADIUS * this.dpr;
    const scale = this.dpr;

    for (let r = 0; r < this.board.gridSize; r++) {
      const rowContainers: Phaser.GameObjects.Container[] = [];
      for (let c = 0; c < this.board.gridSize; c++) {
        const pos = this.getCellPosition(r, c);
        const container = this.add.container(pos.x, pos.y);

        // Determine cell color
        let bgColor: string = CELL_COLORS.normal;
        const isSelected = this.selectedCells.some(
          (s) => s.row === r && s.col === c,
        );

        // Check if this cell belongs to a found word
        let foundColorIdx = -1;
        for (let i = 0; i < this.board.placements.length; i++) {
          const p = this.board.placements[i];
          if (p.found && p.cells.some((pc) => pc.row === r && pc.col === c)) {
            foundColorIdx = i % FOUND_COLORS.length;
            break;
          }
        }

        if (foundColorIdx >= 0) {
          bgColor = FOUND_COLORS[foundColorIdx];
        } else if (isSelected) {
          bgColor = CELL_COLORS.selected;
        }

        const hex = parseInt(bgColor.replace('#', ''), 16);

        // Cell background
        const bg = this.add.graphics();
        bg.fillStyle(hex, foundColorIdx >= 0 ? 0.3 : 1);
        bg.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, radius);
        bg.lineStyle(2 * scale, isSelected ? 0x3b82f6 : 0xd1d5db, 1);
        bg.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, radius);
        container.add(bg);

        // Character text
        const char = this.board.grid[r][c];
        const fontSize = Math.floor(cellSize * 0.5);
        const text = this.add.text(0, 0, char, {
          fontSize: `${fontSize}px`,
          fontFamily: 'sans-serif',
          color: foundColorIdx >= 0 ? '#166534' : '#111827',
          fontStyle: 'bold',
        });
        text.setOrigin(0.5, 0.5);
        container.add(text);

        // Hit area
        const hitArea = this.add
          .rectangle(0, 0, cellSize, cellSize)
          .setInteractive()
          .setAlpha(0.001);
        hitArea.on('pointerdown', () => this.onCellTap(r, c));
        container.add(hitArea);

        rowContainers.push(container);
      }
      this.cellContainers.push(rowContainers);
    }
  }

  private drawWordList() {
    // Clear previous
    this.wordListTexts.forEach((t) => t.destroy());
    this.wordListTexts = [];

    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const scale = this.dpr;
    const startY = h - 60 * scale;
    const gap = 16 * scale;

    const words = this.board.placements;
    const totalW = words.reduce((acc, p) => {
      const chars = [...p.word];
      return acc + chars.length * 18 * scale + gap;
    }, -gap);
    let x = (w - totalW) / 2;

    for (let i = 0; i < words.length; i++) {
      const p = words[i];
      const color = p.found
        ? FOUND_COLORS[i % FOUND_COLORS.length]
        : '#9CA3AF';
      const displayText = p.found ? p.word : '?'.repeat([...p.word].length);

      const text = this.add.text(x, startY, displayText, {
        fontSize: `${16 * scale}px`,
        fontFamily: 'sans-serif',
        color,
        fontStyle: p.found ? 'bold' : 'normal',
      });
      text.setOrigin(0, 0.5);
      this.wordListTexts.push(text);

      x += text.width + gap;
    }
  }

  // ─── Interaction ──────────────────────────────────────

  private onCellTap(row: number, col: number) {
    if (this.phase === 'celebrating') return;

    // Check if cell belongs to found word — ignore
    for (const p of this.board.placements) {
      if (p.found && p.cells.some((c) => c.row === row && c.col === col)) {
        return;
      }
    }

    // Check if already selected — deselect
    const existingIdx = this.selectedCells.findIndex(
      (s) => s.row === row && s.col === col,
    );
    if (existingIdx >= 0) {
      // If tapping last selected cell, try to submit
      if (existingIdx === this.selectedCells.length - 1 && this.selectedCells.length > 1) {
        this.trySubmitWord();
        return;
      }
      // Otherwise deselect from this point
      this.selectedCells = this.selectedCells.slice(0, existingIdx);
      this.drawBoard();
      return;
    }

    // Validate adjacency (must be adjacent to last selected, same row or col)
    if (this.selectedCells.length > 0) {
      const last = this.selectedCells[this.selectedCells.length - 1];
      const isAdjacent =
        (Math.abs(last.row - row) === 1 && last.col === col) ||
        (Math.abs(last.col - col) === 1 && last.row === row);

      if (!isAdjacent) {
        // Start new selection
        this.selectedCells = [{ row, col }];
        this.drawBoard();
        return;
      }

      // Ensure all selected cells are in same row or same column
      if (this.selectedCells.length >= 2) {
        const isHorizontal = this.selectedCells.every(
          (s) => s.row === this.selectedCells[0].row,
        );
        const isVertical = this.selectedCells.every(
          (s) => s.col === this.selectedCells[0].col,
        );

        if (isHorizontal && row !== this.selectedCells[0].row) {
          this.selectedCells = [{ row, col }];
          this.drawBoard();
          return;
        }
        if (isVertical && col !== this.selectedCells[0].col) {
          this.selectedCells = [{ row, col }];
          this.drawBoard();
          return;
        }
      }
    }

    this.selectedCells.push({ row, col });
    this.phase = 'selecting';

    // Auto-check after each selection
    const matchIdx = checkWord(this.board, this.selectedCells);
    if (matchIdx >= 0) {
      this.onWordFound(matchIdx);
    } else {
      this.drawBoard();
    }
  }

  private trySubmitWord() {
    const matchIdx = checkWord(this.board, this.selectedCells);
    if (matchIdx >= 0) {
      this.onWordFound(matchIdx);
    } else {
      // Invalid — shake selected cells
      this.shakeSelected();
      this.selectedCells = [];
      this.drawBoard();
    }
  }

  // ─── Word Found ───────────────────────────────────────

  private onWordFound(placementIdx: number) {
    const placement = this.board.placements[placementIdx];
    placement.found = true;
    this.foundCount++;

    const wordLen = [...placement.word].length;
    this.score += wordLen * 100;

    this.selectedCells = [];
    this.celebrateWord(placementIdx);
    this.drawBoard();
    this.drawWordList();
    this.emitState();

    // Check win
    if (isWon(this.board)) {
      this.phase = 'celebrating';
      this.time.delayedCall(600, () => {
        this.celebrateWin();
      });
    } else {
      this.phase = 'idle';
    }
  }

  // ─── Animations ───────────────────────────────────────

  private shakeSelected() {
    for (const cell of this.selectedCells) {
      const container = this.cellContainers[cell.row]?.[cell.col];
      if (!container) continue;
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
  }

  private celebrateWord(placementIdx: number) {
    const placement = this.board.placements[placementIdx];
    const scale = this.dpr;

    for (const cell of placement.cells) {
      const container = this.cellContainers[cell.row]?.[cell.col];
      if (!container) continue;

      // Bounce
      this.tweens.add({
        targets: container,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut',
      });

      // Particles
      const pos = this.getCellPosition(cell.row, cell.col);
      for (let i = 0; i < 6; i++) {
        const p = this.add.circle(
          pos.x,
          pos.y,
          (2 + Math.random() * 2) * scale,
          0xfbbf24,
          1,
        );
        p.setDepth(200);
        const angle = (Math.PI * 2 * i) / 6;
        const dist = (20 + Math.random() * 15) * scale;
        this.tweens.add({
          targets: p,
          x: pos.x + Math.cos(angle) * dist,
          y: pos.y + Math.sin(angle) * dist,
          alpha: 0,
          scale: 0,
          duration: 400,
          ease: 'Cubic.easeOut',
          onComplete: () => p.destroy(),
        });
      }
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
        foundWords: this.foundCount,
        totalWords: this.board.numWords,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Public Methods ───────────────────────────────────

  public useHint() {
    if (this.phase !== 'idle' && this.phase !== 'selecting') return;

    // Find first unfound word
    const unfound = this.board.placements.find((p) => !p.found);
    if (!unfound) return;

    // Highlight first cell of the word
    const firstCell = unfound.cells[0];
    const container = this.cellContainers[firstCell.row]?.[firstCell.col];
    if (!container) return;

    const scale = this.dpr;
    const cellSize = this.getCellSize();
    const radius = CELL_RADIUS * scale;

    const hint = this.add.graphics();
    hint.fillStyle(0xfbbf24, 0.4);
    hint.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, radius);
    container.add(hint);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => hint.destroy(),
    });
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('words-update', {
      found: this.foundCount,
      total: this.board.numWords,
    });
  }
}
