import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  CELL_EMPTY,
  CELL_SELECTED,
  CELL_FOUND,
  CELL_TEXT,
  CELL_FOUND_TEXT,
  getStageConfig,
  type BoardState,
  type GameConfig,
  type CellPos,
  type WordEntry,
} from '../types';
import { getPuzzle, createBoard, checkSelectedWord, getWordCells, isComplete } from '../logic/board';

// ─── Visual Constants ────────────────────────────────────
const CELL_SIZE = 48;
const CELL_GAP = 4;
const CELL_RADIUS = 8;
const GRID_PADDING = 20;

type GamePhase = 'idle' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  // Visual
  private gridContainer!: Phaser.GameObjects.Container;
  private cellGraphics: Phaser.GameObjects.Graphics[][] = [];
  private cellTexts: Phaser.GameObjects.Text[][] = [];
  private selectedCells: CellPos[] = [];
  private phase: GamePhase = 'idle';
  private score = 0;
  private wordsFound = 0;
  private foundWordSet = new Set<string>();

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
    const puzzle = getPuzzle(stageConfig.puzzleId);
    this.board = createBoard(puzzle);
    this.selectedCells = [];
    this.phase = 'idle';
    this.score = 0;
    this.wordsFound = 0;
    this.foundWordSet = new Set();

    this.drawBoard();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private getGridOrigin(): { x: number; y: number } {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const scale = this.dpr;
    const cellSize = CELL_SIZE * scale;
    const gap = CELL_GAP * scale;

    const gridW = this.board.puzzle.gridCols * cellSize + (this.board.puzzle.gridCols - 1) * gap;
    const gridH = this.board.puzzle.gridRows * cellSize + (this.board.puzzle.gridRows - 1) * gap;

    return {
      x: (w - gridW) / 2,
      y: (h - gridH) / 2,
    };
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawBoard() {
    // Clear previous
    if (this.gridContainer) {
      this.gridContainer.destroy();
    }
    this.cellGraphics = [];
    this.cellTexts = [];

    const scale = this.dpr;
    const cellSize = CELL_SIZE * scale;
    const gap = CELL_GAP * scale;
    const radius = CELL_RADIUS * scale;
    const origin = this.getGridOrigin();

    this.gridContainer = this.add.container(0, 0);

    for (let r = 0; r < this.board.puzzle.gridRows; r++) {
      this.cellGraphics[r] = [];
      this.cellTexts[r] = [];

      for (let c = 0; c < this.board.puzzle.gridCols; c++) {
        const letter = this.board.grid[r][c];
        if (letter === null) continue; // Skip empty cells

        const x = origin.x + c * (cellSize + gap);
        const y = origin.y + r * (cellSize + gap);

        // Cell background
        const gfx = this.add.graphics();
        const isFound = this.isCellInFoundWord(r, c);
        const isSelected = this.isCellSelected(r, c);

        let bgColor: number;
        if (isFound) {
          bgColor = parseInt(CELL_FOUND.replace('#', ''), 16);
        } else if (isSelected) {
          bgColor = parseInt(CELL_SELECTED.replace('#', ''), 16);
        } else {
          bgColor = parseInt(CELL_EMPTY.replace('#', ''), 16);
        }

        gfx.fillStyle(bgColor, 1);
        gfx.fillRoundedRect(x, y, cellSize, cellSize, radius);

        // Cell border
        gfx.lineStyle(1 * scale, 0xd1d5db, 0.5);
        gfx.strokeRoundedRect(x, y, cellSize, cellSize, radius);

        this.gridContainer.add(gfx);
        this.cellGraphics[r][c] = gfx;

        // Letter text
        const textColor = isFound ? CELL_FOUND_TEXT : CELL_TEXT;
        const fontSize = Math.round(20 * scale);
        const txt = this.add.text(x + cellSize / 2, y + cellSize / 2, isFound ? letter : '?', {
          fontSize: `${fontSize}px`,
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          color: textColor,
          fontStyle: 'bold',
        });
        txt.setOrigin(0.5, 0.5);
        this.gridContainer.add(txt);
        this.cellTexts[r][c] = txt;

        // Hit area
        const hitArea = this.add
          .rectangle(x + cellSize / 2, y + cellSize / 2, cellSize, cellSize)
          .setInteractive()
          .setAlpha(0.001);
        hitArea.on('pointerdown', () => this.onCellTap(r, c));
        this.gridContainer.add(hitArea);
      }
    }

    // Draw word list at bottom
    this.drawWordList();
  }

  private drawWordList() {
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const origin = this.getGridOrigin();
    const cellSize = CELL_SIZE * scale;
    const gap = CELL_GAP * scale;
    const gridH = this.board.puzzle.gridRows * cellSize + (this.board.puzzle.gridRows - 1) * gap;
    const startY = origin.y + gridH + 40 * scale;

    const words = this.board.puzzle.words;
    const fontSize = Math.round(16 * scale);
    const lineHeight = 28 * scale;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const found = this.board.foundWords.includes(word.word);
      const display = found ? word.word : word.word.split('').map(() => '○').join('');
      const color = found ? '#059669' : '#9CA3AF';

      const txt = this.add.text(w / 2, startY + i * lineHeight, display, {
        fontSize: `${fontSize}px`,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color,
        fontStyle: found ? 'bold' : 'normal',
      });
      txt.setOrigin(0.5, 0.5);
      this.gridContainer.add(txt);
    }
  }

  // ─── Cell State Checks ────────────────────────────────

  private isCellSelected(row: number, col: number): boolean {
    return this.selectedCells.some((c) => c.row === row && c.col === col);
  }

  private isCellInFoundWord(row: number, col: number): boolean {
    for (const w of this.board.puzzle.words) {
      if (!this.board.foundWords.includes(w.word)) continue;
      const cells = getWordCells(w);
      if (cells.some((c) => c.row === row && c.col === col)) return true;
    }
    return false;
  }

  // ─── Interaction ──────────────────────────────────────

  private onCellTap(row: number, col: number) {
    if (this.phase !== 'idle') return;
    if (this.board.grid[row][col] === null) return;

    // Check if cell is already selected — if so, deselect
    const existingIdx = this.selectedCells.findIndex(
      (c) => c.row === row && c.col === col,
    );

    if (existingIdx >= 0) {
      // If tapping the last selected cell, try to submit the word
      if (existingIdx === this.selectedCells.length - 1 && this.selectedCells.length >= 2) {
        this.trySubmitWord();
        return;
      }
      // Otherwise, truncate selection up to this cell
      this.selectedCells = this.selectedCells.slice(0, existingIdx + 1);
      this.drawBoard();
      return;
    }

    // Check adjacency — new cell must be adjacent to last selected
    if (this.selectedCells.length > 0) {
      const last = this.selectedCells[this.selectedCells.length - 1];
      const dr = Math.abs(row - last.row);
      const dc = Math.abs(col - last.col);

      // Only allow horizontal or vertical adjacency (not diagonal)
      if (!((dr === 1 && dc === 0) || (dr === 0 && dc === 1))) {
        // Not adjacent — clear selection and start new
        this.selectedCells = [{ row, col }];
        this.drawBoard();
        return;
      }
    }

    // Add to selection
    this.selectedCells.push({ row, col });
    this.drawBoard();

    // Auto-check if selection could be a word
    if (this.selectedCells.length >= 2) {
      const matched = checkSelectedWord(this.selectedCells, this.board);
      if (matched) {
        this.onWordFound(matched);
      }
    }
  }

  private trySubmitWord() {
    if (this.selectedCells.length < 2) return;

    const matched = checkSelectedWord(this.selectedCells, this.board);
    if (matched) {
      this.onWordFound(matched);
    } else {
      // Shake selected cells
      this.shakeSelection();
      this.selectedCells = [];
      this.drawBoard();
    }
  }

  private onWordFound(entry: WordEntry) {
    if (this.board.foundWords.includes(entry.word)) return;

    this.board.foundWords.push(entry.word);
    this.foundWordSet.add(entry.word);
    this.wordsFound++;
    this.score += entry.word.length * 100;
    this.selectedCells = [];

    // Celebrate word
    this.celebrateWord(entry);

    this.drawBoard();
    this.emitState();

    // Check win
    if (isComplete(this.board)) {
      this.phase = 'celebrating';
      this.time.delayedCall(600, () => {
        this.celebrateWin();
      });
    }
  }

  // ─── Animations ───────────────────────────────────────

  private shakeSelection() {
    const scale = this.dpr;
    const cellSize = CELL_SIZE * scale;
    const gap = CELL_GAP * scale;
    const origin = this.getGridOrigin();

    for (const cell of this.selectedCells) {
      const gfx = this.cellGraphics[cell.row]?.[cell.col];
      if (!gfx) continue;

      const origX = origin.x + cell.col * (cellSize + gap);
      this.tweens.add({
        targets: gfx,
        x: origX + 6 * scale,
        duration: 50,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          gfx.x = 0; // graphics are positioned via fillRoundedRect, not x
        },
      });
    }
  }

  private celebrateWord(entry: WordEntry) {
    const scale = this.dpr;
    const cellSize = CELL_SIZE * scale;
    const gap = CELL_GAP * scale;
    const origin = this.getGridOrigin();
    const cells = getWordCells(entry);

    // Bounce each cell
    for (const cell of cells) {
      const x = origin.x + cell.col * (cellSize + gap) + cellSize / 2;
      const y = origin.y + cell.row * (cellSize + gap) + cellSize / 2;

      // Particle burst
      for (let i = 0; i < 6; i++) {
        const p = this.add.circle(
          x, y,
          (2 + Math.random() * 2) * scale,
          0x22c55e, 1,
        );
        p.setDepth(200);
        const angle = (Math.PI * 2 * i) / 6;
        const dist = (20 + Math.random() * 15) * scale;
        this.tweens.add({
          targets: p,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
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
        wordsFound: this.wordsFound,
        totalWords: this.board.puzzle.words.length,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Hint ─────────────────────────────────────────────

  public hint() {
    if (this.phase !== 'idle') return;

    // Find first unfound word and reveal its first cell
    for (const w of this.board.puzzle.words) {
      if (this.board.foundWords.includes(w.word)) continue;
      const cells = getWordCells(w);
      if (cells.length > 0) {
        // Flash the first cell of this word
        const cell = cells[0];
        const scale = this.dpr;
        const cellSize = CELL_SIZE * scale;
        const gap = CELL_GAP * scale;
        const origin = this.getGridOrigin();
        const x = origin.x + cell.col * (cellSize + gap) + cellSize / 2;
        const y = origin.y + cell.row * (cellSize + gap) + cellSize / 2;

        const flash = this.add.circle(x, y, cellSize * 0.6, 0xfbbf24, 0.5);
        flash.setDepth(150);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 1.5,
          duration: 600,
          ease: 'Cubic.easeOut',
          onComplete: () => flash.destroy(),
        });
      }
      break;
    }
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('words-update', {
      wordsFound: this.wordsFound,
      totalWords: this.board.puzzle.words.length,
    });
  }
}
