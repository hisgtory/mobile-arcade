import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  TILE_EMOJIS,
  TILE_COLORS,
  type GameConfig,
  type Puzzle,
  type StageConfig,
} from '../types';
import { getStageConfig } from '../logic/stage';
import { generatePuzzleSet, calcScore } from '../logic/board';

type GamePhase = 'idle' | 'showing' | 'answered' | 'celebrating';

const WIN_THRESHOLD = 0.5;
const CORRECT_ANSWER_DELAY = 800;
const WRONG_ANSWER_DELAY = 1500;

export class PlayScene extends Phaser.Scene {
  private config!: GameConfig;
  private dpr = 1;
  private stageConfig!: StageConfig;

  // Puzzle state
  private puzzles: Puzzle[] = [];
  private currentPuzzle = 0;
  private phase: GamePhase = 'idle';
  private score = 0;
  private streak = 0;
  private correct = 0;
  private timeRemaining = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  // Visual
  private gridContainer!: Phaser.GameObjects.Container;
  private questionText!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private feedbackText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    const stage = this.config.stage ?? 1;
    this.stageConfig = getStageConfig(stage);
    this.puzzles = generatePuzzleSet(this.stageConfig);
    this.currentPuzzle = 0;
    this.phase = 'idle';
    this.score = 0;
    this.streak = 0;
    this.correct = 0;
    this.timeRemaining = this.stageConfig.timeLimit;

    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Timer bar at top
    this.timerBar = this.add.graphics();
    this.timerBar.setDepth(10);

    // Progress text
    this.progressText = this.add.text(w / 2, 18 * s, '', {
      fontSize: `${13 * s}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#6B7280',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(10);

    // Question text
    this.questionText = this.add.text(w / 2, 55 * s, '', {
      fontSize: `${20 * s}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1F2937',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: w - 40 * s },
    }).setOrigin(0.5, 0.5).setDepth(10);

    // Grid container
    this.gridContainer = this.add.container(w / 2, h * 0.38);

    // Feedback text
    this.feedbackText = this.add.text(w / 2, h * 0.68, '', {
      fontSize: `${28 * s}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(20).setAlpha(0);

    // Start timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTick,
      callbackScope: this,
      loop: true,
    });

    this.showPuzzle();
    this.emitState();
  }

  // ─── Timer ────────────────────────────────────────────

  private onTick() {
    if (this.phase === 'celebrating') return;
    this.timeRemaining--;
    this.drawTimerBar();
    this.emitState();

    if (this.timeRemaining <= 0) {
      this.timerEvent?.remove();
      this.phase = 'celebrating';
      this.onStageEnd();
    }
  }

  private drawTimerBar() {
    const w = DEFAULT_WIDTH * this.dpr;
    const s = this.dpr;
    const barH = 6 * s;
    const ratio = Math.max(0, this.timeRemaining / this.stageConfig.timeLimit);

    this.timerBar.clear();
    // Background
    this.timerBar.fillStyle(0xe5e7eb, 1);
    this.timerBar.fillRect(0, 0, w, barH);
    // Fill
    const color = ratio > 0.3 ? 0x22c55e : ratio > 0.15 ? 0xeab308 : 0xef4444;
    this.timerBar.fillStyle(color, 1);
    this.timerBar.fillRect(0, 0, w * ratio, barH);
  }

  // ─── Puzzle Display ───────────────────────────────────

  private showPuzzle() {
    if (this.currentPuzzle >= this.puzzles.length) {
      this.onStageEnd();
      return;
    }

    const puzzle = this.puzzles[this.currentPuzzle];
    const s = this.dpr;
    const w = DEFAULT_WIDTH * this.dpr;

    this.phase = 'showing';

    // Update texts
    this.progressText.setText(
      `${this.currentPuzzle + 1} / ${this.puzzles.length}`
    );
    this.questionText.setText(puzzle.question);
    this.drawTimerBar();

    // Clear previous grid
    this.gridContainer.removeAll(true);
    this.choiceButtons.forEach((b) => b.destroy());
    this.choiceButtons = [];

    if (puzzle.type === 'sequence') {
      this.drawSequence(puzzle);
    } else if (puzzle.type === 'count' || puzzle.type === 'pattern') {
      this.drawGrid(puzzle);
      this.drawChoices(puzzle);
    } else {
      // odd_one_out, mirror — tap on grid
      this.drawGrid(puzzle);
    }

    this.phase = 'idle';
  }

  private drawGrid(puzzle: Puzzle) {
    const s = this.dpr;
    const gridSize = puzzle.grid.length;
    const cellSize = Math.min(70, 280 / gridSize) * s;
    const gap = 6 * s;
    const totalW = gridSize * cellSize + (gridSize - 1) * gap;
    const totalH = gridSize * cellSize + (gridSize - 1) * gap;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const tileIdx = puzzle.grid[r][c];
        const x = -totalW / 2 + c * (cellSize + gap) + cellSize / 2;
        const y = -totalH / 2 + r * (cellSize + gap) + cellSize / 2;

        if (tileIdx === -1) {
          // Empty cell (for pattern type)
          const bg = this.add.graphics();
          bg.fillStyle(0xf3f4f6, 1);
          bg.lineStyle(2 * s, 0xd1d5db, 1);
          bg.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8 * s);
          bg.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8 * s);
          bg.setPosition(x, y);

          const qMark = this.add.text(x, y, '?', {
            fontSize: `${cellSize * 0.6}px`,
            fontFamily: 'system-ui',
            color: '#9CA3AF',
            fontStyle: 'bold',
          }).setOrigin(0.5, 0.5);

          this.gridContainer.add([bg, qMark]);
        } else {
          // Regular cell
          const colorHex = TILE_COLORS[tileIdx % TILE_COLORS.length];
          const hex = parseInt(colorHex.replace('#', ''), 16);

          const bg = this.add.graphics();
          bg.fillStyle(hex, 0.15);
          bg.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8 * s);
          bg.setPosition(x, y);

          const emoji = this.add.text(x, y, TILE_EMOJIS[tileIdx % TILE_EMOJIS.length], {
            fontSize: `${cellSize * 0.55}px`,
          }).setOrigin(0.5, 0.5);

          this.gridContainer.add([bg, emoji]);

          // Interactive for tap puzzles (odd_one_out, mirror)
          if (puzzle.type === 'odd_one_out' || puzzle.type === 'mirror') {
            const hitArea = this.add
              .rectangle(x, y, cellSize, cellSize)
              .setInteractive()
              .setAlpha(0.001);
            hitArea.on('pointerdown', () => this.onGridCellTap(r, c, puzzle));
            this.gridContainer.add(hitArea);
          }
        }
      }
    }
  }

  private drawSequence(puzzle: Puzzle) {
    const s = this.dpr;
    const nums = puzzle.grid[0];
    const cellSize = 55 * s;
    const gap = 8 * s;
    const totalW = nums.length * cellSize + (nums.length - 1) * gap;

    for (let i = 0; i < nums.length; i++) {
      const x = -totalW / 2 + i * (cellSize + gap) + cellSize / 2;
      const y = 0;
      const val = nums[i];

      const bg = this.add.graphics();
      if (val === -1) {
        bg.fillStyle(0xf3f4f6, 1);
        bg.lineStyle(2 * s, 0xd1d5db, 1);
        bg.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 10 * s);
        bg.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 10 * s);
        bg.setPosition(x, y);

        const qMark = this.add.text(x, y, '?', {
          fontSize: `${cellSize * 0.5}px`,
          fontFamily: 'system-ui',
          color: '#9CA3AF',
          fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        this.gridContainer.add([bg, qMark]);
      } else {
        bg.fillStyle(0x3b82f6, 0.12);
        bg.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 10 * s);
        bg.setPosition(x, y);

        const numText = this.add.text(x, y, `${val}`, {
          fontSize: `${cellSize * 0.45}px`,
          fontFamily: 'system-ui',
          color: '#1F2937',
          fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        this.gridContainer.add([bg, numText]);
      }
    }

    // Draw choices below
    this.drawChoices(puzzle);
  }

  private drawChoices(puzzle: Puzzle) {
    if (!puzzle.choices) return;

    const s = this.dpr;
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const btnW = 70 * s;
    const btnH = 44 * s;
    const gap = 12 * s;
    const totalW = puzzle.choices.length * btnW + (puzzle.choices.length - 1) * gap;
    const startX = (w - totalW) / 2 + btnW / 2;
    const y = h * 0.72;

    puzzle.choices.forEach((choice, i) => {
      const container = this.add.container(startX + i * (btnW + gap), y);

      const bg = this.add.graphics();
      bg.fillStyle(0xffffff, 1);
      bg.lineStyle(2 * s, 0xe5e7eb, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10 * s);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10 * s);

      const label = this.add.text(0, 0, `${choice}`, {
        fontSize: `${18 * s}px`,
        fontFamily: 'system-ui',
        color: '#1F2937',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);

      const hitArea = this.add
        .rectangle(0, 0, btnW, btnH)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => this.onChoiceTap(choice, puzzle));

      container.add([bg, label, hitArea]);
      container.setDepth(15);
      this.choiceButtons.push(container);
    });
  }

  // ─── Interaction ──────────────────────────────────────

  private onGridCellTap(row: number, col: number, puzzle: Puzzle) {
    if (this.phase !== 'idle') return;

    const tappedIdx = row * puzzle.grid[0].length + col;
    const isCorrect = tappedIdx === puzzle.answer;
    this.handleAnswer(isCorrect);
  }

  private onChoiceTap(choice: number, puzzle: Puzzle) {
    if (this.phase !== 'idle') return;

    const isCorrect = choice === puzzle.answer;
    this.handleAnswer(isCorrect);
  }

  private handleAnswer(isCorrect: boolean) {
    this.phase = 'answered';
    const s = this.dpr;

    if (isCorrect) {
      this.streak++;
      this.correct++;
      const points = calcScore(this.timeRemaining, this.streak);
      this.score += points;

      this.showFeedback('✅ Correct!', '#22C55E', `+${points}`);
    } else {
      this.streak = 0;
      this.showFeedback('❌ Wrong!', '#EF4444', this.puzzles[this.currentPuzzle].twist);
    }

    this.emitState();

    // Move to next puzzle after delay
    this.time.delayedCall(isCorrect ? CORRECT_ANSWER_DELAY : WRONG_ANSWER_DELAY, () => {
      this.currentPuzzle++;
      if (this.currentPuzzle >= this.puzzles.length) {
        this.onStageEnd();
      } else {
        this.feedbackText.setAlpha(0);
        this.showPuzzle();
      }
    });
  }

  private showFeedback(text: string, color: string, subtext: string) {
    const s = this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    this.feedbackText.setText(`${text}\n${subtext}`);
    this.feedbackText.setStyle({
      fontSize: `${22 * s}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color,
      fontStyle: 'bold',
      align: 'center',
    });
    this.feedbackText.setAlpha(1);

    // Pop animation
    this.feedbackText.setScale(0.5);
    this.tweens.add({
      targets: this.feedbackText,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Emit particles for correct
    if (color === '#22C55E') {
      const w = DEFAULT_WIDTH * this.dpr;
      for (let i = 0; i < 8; i++) {
        const p = this.add.circle(
          w / 2,
          h * 0.68,
          (3 + Math.random() * 3) * s,
          0xfbbf24,
          1,
        );
        p.setDepth(200);
        const angle = (Math.PI * 2 * i) / 8;
        const dist = (30 + Math.random() * 20) * s;
        this.tweens.add({
          targets: p,
          x: w / 2 + Math.cos(angle) * dist,
          y: h * 0.68 + Math.sin(angle) * dist,
          alpha: 0,
          scale: 0,
          duration: 400,
          ease: 'Cubic.easeOut',
          onComplete: () => p.destroy(),
        });
      }
    }
  }

  // ─── Stage End ────────────────────────────────────────

  private onStageEnd() {
    this.timerEvent?.remove();
    this.phase = 'celebrating';

    const cleared = this.correct >= Math.ceil(this.puzzles.length * 0.5);

    if (cleared) {
      this.celebrateWin();
    } else {
      this.time.delayedCall(500, () => {
        this.game.events.emit('game-over', {
          score: this.score,
          correct: this.correct,
          total: this.puzzles.length,
          stage: this.config.stage ?? 1,
        });
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

    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        correct: this.correct,
        total: this.puzzles.length,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Public Methods ───────────────────────────────────

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  shutdown() {
    this.timerEvent?.remove();
    this.timerEvent = null;
    this.choiceButtons.forEach((b) => b.destroy());
    this.choiceButtons = [];
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: this.score, streak: this.streak });
    this.game.events.emit('progress-update', {
      current: this.currentPuzzle + 1,
      total: this.puzzles.length,
      correct: this.correct,
      timeRemaining: this.timeRemaining,
    });
  }
}
