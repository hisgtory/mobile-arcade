import Phaser from 'phaser';
import {
  GRID_SIZE,
  BOX_SIZE,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  COLORS,
  getStageConfig,
  type GameConfig,
  type BoardState,
} from '../types';
import {
  createBoard,
  placeNumber,
  toggleNote,
  eraseCell,
  isComplete,
  isGameOver,
  getHint,
  getNumberCounts,
} from '../logic/board';

type GamePhase = 'playing' | 'won' | 'lost';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;

  private phase: GamePhase = 'playing';
  private selectedRow = -1;
  private selectedCol = -1;
  private notesMode = false;
  private startTime = 0;
  private elapsedMs = 0;
  private timerEvent?: Phaser.Time.TimerEvent;

  // Graphics layers
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private cellGraphics!: Phaser.GameObjects.Graphics;
  private textObjects: Phaser.GameObjects.Text[][] = [];
  private noteObjects: Phaser.GameObjects.Text[][] = [];

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
    const difficulty = this.config.difficulty ?? stageConfig.difficulty;

    this.board = createBoard(difficulty);
    this.phase = 'playing';
    this.selectedRow = -1;
    this.selectedCol = -1;
    this.notesMode = false;
    this.startTime = Date.now();
    this.elapsedMs = 0;

    // Create graphics objects
    this.gridGraphics = this.add.graphics();
    this.cellGraphics = this.add.graphics();
    this.textObjects = [];
    this.noteObjects = [];

    // Initialize text objects for each cell
    for (let r = 0; r < GRID_SIZE; r++) {
      this.textObjects[r] = [];
      this.noteObjects[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const { x, y } = this.getCellCenter(r, c);

        // Main number text
        const text = this.add.text(x, y, '', {
          fontSize: `${Math.floor(24 * this.dpr)}px`,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontStyle: 'bold',
          color: COLORS.textGiven,
        }).setOrigin(0.5);
        this.textObjects[r][c] = text;

        // Notes text (smaller)
        const noteText = this.add.text(x, y, '', {
          fontSize: `${Math.floor(10 * this.dpr)}px`,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          color: COLORS.textNote,
          align: 'center',
          lineSpacing: 1 * this.dpr,
        }).setOrigin(0.5);
        this.noteObjects[r][c] = noteText;
      }
    }

    // Set up click handler
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleClick(pointer.x, pointer.y);
    });

    // Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.phase === 'playing') {
          this.elapsedMs = Date.now() - this.startTime;
          this.emitState();
        }
      },
      loop: true,
    });

    this.drawGrid();
    this.updateDisplay();
    this.emitState();
  }

  // ─── Layout ───────────────────────────────────────────

  private getGridMetrics() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const padding = 16 * this.dpr;
    const gridSize = Math.min(w - padding * 2, h * 0.75);
    const cellSize = gridSize / GRID_SIZE;
    const offsetX = (w - gridSize) / 2;
    const offsetY = (h - gridSize) / 2 - 10 * this.dpr;

    return { gridSize, cellSize, offsetX, offsetY };
  }

  private getCellCenter(row: number, col: number): { x: number; y: number } {
    const { cellSize, offsetX, offsetY } = this.getGridMetrics();
    return {
      x: offsetX + col * cellSize + cellSize / 2,
      y: offsetY + row * cellSize + cellSize / 2,
    };
  }

  private getCellFromPoint(px: number, py: number): { row: number; col: number } | null {
    const { cellSize, offsetX, offsetY, gridSize } = this.getGridMetrics();
    const col = Math.floor((px - offsetX) / cellSize);
    const row = Math.floor((py - offsetY) / cellSize);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    if (px < offsetX || px > offsetX + gridSize) return null;
    if (py < offsetY || py > offsetY + gridSize) return null;
    return { row, col };
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawGrid() {
    const g = this.gridGraphics;
    g.clear();

    const { gridSize, cellSize, offsetX, offsetY } = this.getGridMetrics();
    const lineW = 1 * this.dpr;
    const boldLineW = 2.5 * this.dpr;

    // Background
    g.fillStyle(0xffffff, 1);
    g.fillRect(offsetX, offsetY, gridSize, gridSize);

    // Minor grid lines
    g.lineStyle(lineW, parseInt(COLORS.gridLineMinor.replace('#', ''), 16), 1);
    for (let i = 0; i <= GRID_SIZE; i++) {
      if (i % BOX_SIZE === 0) continue; // major lines drawn separately
      g.moveTo(offsetX + i * cellSize, offsetY);
      g.lineTo(offsetX + i * cellSize, offsetY + gridSize);
      g.moveTo(offsetX, offsetY + i * cellSize);
      g.lineTo(offsetX + gridSize, offsetY + i * cellSize);
    }
    g.strokePath();

    // Major grid lines (3x3 boxes)
    g.lineStyle(boldLineW, parseInt(COLORS.gridLine.replace('#', ''), 16), 1);
    for (let i = 0; i <= BOX_SIZE; i++) {
      const pos = i * BOX_SIZE * cellSize;
      g.moveTo(offsetX + pos, offsetY);
      g.lineTo(offsetX + pos, offsetY + gridSize);
      g.moveTo(offsetX, offsetY + pos);
      g.lineTo(offsetX + gridSize, offsetY + pos);
    }
    g.strokePath();
  }

  private updateDisplay() {
    const { cellSize, offsetX, offsetY } = this.getGridMetrics();
    const cg = this.cellGraphics;
    cg.clear();

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.board.grid[r][c];
        const cx = offsetX + c * cellSize;
        const cy = offsetY + r * cellSize;

        // Cell background highlight
        let bgColor: string | null = null;
        if (r === this.selectedRow && c === this.selectedCol) {
          bgColor = COLORS.cellSelected;
        } else if (this.selectedRow >= 0 && this.selectedCol >= 0) {
          const selValue = this.board.grid[this.selectedRow][this.selectedCol].value;
          if (selValue !== 0 && cell.value === selValue) {
            bgColor = COLORS.cellSameNumber;
          } else if (
            r === this.selectedRow ||
            c === this.selectedCol ||
            (Math.floor(r / BOX_SIZE) === Math.floor(this.selectedRow / BOX_SIZE) &&
             Math.floor(c / BOX_SIZE) === Math.floor(this.selectedCol / BOX_SIZE))
          ) {
            bgColor = COLORS.cellSameRowCol;
          }
        }

        if (cell.error) {
          bgColor = COLORS.cellError;
        }

        if (cell.given) {
          // Draw given cell background
          const givenHex = parseInt(COLORS.cellGiven.replace('#', ''), 16);
          cg.fillStyle(givenHex, 1);
          cg.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
        }

        if (bgColor) {
          const hex = parseInt(bgColor.replace('#', ''), 16);
          cg.fillStyle(hex, 0.7);
          cg.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
        }

        // Update text
        const textObj = this.textObjects[r][c];
        const noteObj = this.noteObjects[r][c];

        if (cell.value !== 0) {
          textObj.setText(String(cell.value));
          textObj.setVisible(true);
          noteObj.setVisible(false);

          if (cell.given) {
            textObj.setColor(COLORS.textGiven);
          } else if (cell.error) {
            textObj.setColor(COLORS.textError);
          } else {
            textObj.setColor(COLORS.textPlayer);
          }
        } else if (cell.notes.size > 0) {
          textObj.setVisible(false);
          noteObj.setVisible(true);

          // Format notes in 3x3 grid
          let noteStr = '';
          for (let n = 1; n <= 9; n++) {
            noteStr += cell.notes.has(n) ? String(n) : ' ';
            if (n % 3 === 0 && n < 9) noteStr += '\n';
          }
          noteObj.setText(noteStr);
        } else {
          textObj.setVisible(false);
          noteObj.setVisible(false);
        }
      }
    }
  }

  // ─── Interaction ──────────────────────────────────────

  private handleClick(px: number, py: number) {
    if (this.phase !== 'playing') return;

    const cellPos = this.getCellFromPoint(px, py);
    if (!cellPos) {
      this.selectedRow = -1;
      this.selectedCol = -1;
      this.updateDisplay();
      this.emitState();
      return;
    }

    const { row, col } = cellPos;

    // Haptic: cell selection feedback (before visual update)
    this.game.events.emit('cell-selected');

    if (row === this.selectedRow && col === this.selectedCol) {
      // Deselect on double tap
      this.selectedRow = -1;
      this.selectedCol = -1;
    } else {
      this.selectedRow = row;
      this.selectedCol = col;
    }

    this.updateDisplay();
    this.emitState();
  }

  // ─── Public API (called from React) ───────────────────

  public inputNumber(num: number) {
    if (this.phase !== 'playing') return;
    if (this.selectedRow < 0 || this.selectedCol < 0) return;

    const cell = this.board.grid[this.selectedRow][this.selectedCol];
    if (cell.given) return;

    if (this.notesMode) {
      toggleNote(this.board, this.selectedRow, this.selectedCol, num);
    } else {
      const wasCorrect = placeNumber(this.board, this.selectedRow, this.selectedCol, num);

      if (wasCorrect) {
        // Haptic: correct number placed
        this.game.events.emit('number-placed');
      } else {
        // Haptic: mistake made
        this.game.events.emit('mistake-made');
        this.shakeCell(this.selectedRow, this.selectedCol);
      }

      // Check game state
      if (isGameOver(this.board)) {
        this.phase = 'lost';
        this.game.events.emit('game-over', {
          score: this.calculateScore(),
          mistakes: this.board.mistakes,
          elapsedMs: this.elapsedMs,
          stage: this.config.stage ?? 1,
        });
      } else if (isComplete(this.board)) {
        this.phase = 'won';
        this.celebrateWin();
      }
    }

    this.updateDisplay();
    this.emitState();
  }

  public erase() {
    if (this.phase !== 'playing') return;
    if (this.selectedRow < 0 || this.selectedCol < 0) return;

    eraseCell(this.board, this.selectedRow, this.selectedCol);
    this.updateDisplay();
    this.emitState();
  }

  public setNotesMode(on: boolean) {
    this.notesMode = on;
    this.emitState();
  }

  public useHint() {
    if (this.phase !== 'playing') return;

    const hint = getHint(this.board);
    if (!hint) return;

    const { row, col } = hint;
    const correctNum = this.board.solution[row][col];

    // Select the cell
    this.selectedRow = row;
    this.selectedCol = col;

    // Place correct number (as a given so it can't be erased)
    this.board.grid[row][col].value = correctNum as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    this.board.grid[row][col].notes.clear();
    this.board.grid[row][col].error = false;
    this.board.grid[row][col].given = true; // lock it

    // Check if complete
    if (isComplete(this.board)) {
      this.phase = 'won';
      this.celebrateWin();
    }

    this.updateDisplay();
    this.emitState();
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Score ────────────────────────────────────────────

  private calculateScore(): number {
    let filled = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.board.grid[r][c].value === this.board.solution[r][c]) {
          filled++;
        }
      }
    }

    const difficultyMultiplier =
      this.board.difficulty === 'easy' ? 1 :
      this.board.difficulty === 'medium' ? 1.5 :
      this.board.difficulty === 'hard' ? 2 :
      3;

    const timeBonus = Math.max(0, 1000 - Math.floor(this.elapsedMs / 1000));
    const mistakePenalty = this.board.mistakes * 100;

    return Math.floor(filled * 10 * difficultyMultiplier + timeBonus - mistakePenalty);
  }

  // ─── Effects ──────────────────────────────────────────

  private shakeCell(row: number, col: number) {
    const textObj = this.textObjects[row][col];
    if (!textObj) return;
    const origX = textObj.x;

    this.tweens.add({
      targets: textObj,
      x: origX + 4 * this.dpr,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => { textObj.x = origX; },
    });
  }

  private celebrateWin() {
    // Haptic: win celebration
    this.game.events.emit('game-clear');

    // Emit stage-clear immediately (React handles UI/effects)
    this.game.events.emit('stage-clear', {
      score: this.calculateScore(),
      mistakes: this.board.mistakes,
      elapsedMs: this.elapsedMs,
      stage: this.config.stage ?? 1,
    });
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    const counts = getNumberCounts(this.board);
    this.game.events.emit('state-update', {
      phase: this.phase,
      mistakes: this.board.mistakes,
      maxMistakes: this.board.maxMistakes,
      elapsedMs: this.elapsedMs,
      notesMode: this.notesMode,
      selectedRow: this.selectedRow,
      selectedCol: this.selectedCol,
      numberCounts: Object.fromEntries(counts),
      difficulty: this.board.difficulty,
    });
  }

  shutdown() {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
  }
}
