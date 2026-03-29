/**
 * PlayScene for BrainOut
 *
 * Displays trick-question puzzles. Player taps choices to solve.
 * All rendering done via Phaser (text + interactive rectangles).
 *
 * Events emitted:
 *   'puzzle-update'   — { puzzleIndex, totalPuzzles, question, hint }
 *   'score-update'    — { score, hintsLeft }
 *   'correct-answer'  — { puzzleId, explanation }
 *   'wrong-answer'    — { puzzleId }
 *   'stage-clear'     — { score, puzzlesSolved }
 *   'game-over'       — { score }
 */

import Phaser from 'phaser';
import { getStageConfig } from '../logic/stage';
import { getPuzzlesForStage } from '../logic/questions';
import { GamePhase, type GameConfig, type StageConfig, type Puzzle, type ChoiceOption } from '../types';

interface ChoiceButton {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  option: ChoiceOption;
}

export class PlayScene extends Phaser.Scene {
  private stageNum: number = 1;
  private stageConfig!: StageConfig;
  private gameConfig?: GameConfig;
  private dpr = 1;

  // Game state
  private phase: GamePhase = GamePhase.IDLE;
  private puzzles: Puzzle[] = [];
  private currentPuzzleIdx: number = 0;
  private score: number = 0;
  private hintsLeft: number = 3;
  private tapCounts: Map<string, number> = new Map();

  // Visual elements
  private questionText?: Phaser.GameObjects.Text;
  private explanationText?: Phaser.GameObjects.Text;
  private choiceButtons: ChoiceButton[] = [];
  private feedbackOverlay?: Phaser.GameObjects.Rectangle;
  private feedbackIcon?: Phaser.GameObjects.Text;
  private puzzleNumText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { stage?: number; gameConfig?: GameConfig }): void {
    this.stageNum = data?.stage ?? 1;
    this.gameConfig = data?.gameConfig ?? (this.game as any).__brainoutConfig;
    this.dpr = (this.game as any).__dpr || 1;
  }

  preload(): void {
    // No external assets needed — we use text + shapes
  }

  create(): void {
    // Reset state
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.currentPuzzleIdx = 0;
    this.tapCounts.clear();
    this.choiceButtons = [];

    // Load stage
    this.stageConfig = getStageConfig(this.stageNum);
    this.hintsLeft = this.stageConfig.hints;
    this.puzzles = getPuzzlesForStage(this.stageNum);

    // Background
    this.cameras.main.setBackgroundColor('#f0f2f5');

    // Show first puzzle
    this.showPuzzle();
    this.emitScore();
  }

  // ─── PUZZLE DISPLAY ──────────────────────────────────

  private showPuzzle(): void {
    // Clean previous
    this.clearPuzzleVisuals();
    this.tapCounts.clear();

    const dpr = this.dpr;
    const { width, height } = this.scale;
    const puzzle = this.puzzles[this.currentPuzzleIdx];

    if (!puzzle) {
      this.stageClear();
      return;
    }

    this.phase = GamePhase.PLAYING;

    // Puzzle number indicator
    this.puzzleNumText = this.add.text(
      width / 2, 30 * dpr,
      `${this.currentPuzzleIdx + 1} / ${this.puzzles.length}`,
      {
        fontSize: `${16 * dpr}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#9CA3AF',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);

    // Question text
    this.questionText = this.add.text(
      width / 2, height * 0.18,
      puzzle.question,
      {
        fontSize: `${20 * dpr}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#1F2937',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: width * 0.85 },
        lineSpacing: 8 * dpr,
      },
    ).setOrigin(0.5);

    // Choice buttons
    this.createChoiceButtons(puzzle, dpr);

    // Emit puzzle info
    this.game.events.emit('puzzle-update', {
      puzzleIndex: this.currentPuzzleIdx,
      totalPuzzles: this.puzzles.length,
      question: puzzle.question,
      hint: puzzle.hint,
    });
  }

  private createChoiceButtons(puzzle: Puzzle, dpr: number): void {
    const { width, height } = this.scale;
    const choices = puzzle.choices;

    // Calculate button layout
    const buttonW = Math.min(width * 0.4, 180 * dpr);
    const buttonH = 50 * dpr;
    const gap = 16 * dpr;

    // For simple tap puzzles, arrange in a grid
    const cols = choices.length <= 3 ? choices.length : 2;
    const rows = Math.ceil(choices.length / cols);

    const startY = height * 0.45;
    const totalGridH = rows * buttonH + (rows - 1) * gap;

    for (let i = 0; i < choices.length; i++) {
      const option = choices[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const totalRowW = Math.min(cols, choices.length - row * cols) * buttonW + (Math.min(cols, choices.length - row * cols) - 1) * gap;
      const startX = (width - totalRowW) / 2 + buttonW / 2;

      const x = startX + col * (buttonW + gap);
      const y = startY + row * (buttonH + gap);

      // Button background
      const bg = this.add.rectangle(x, y, buttonW, buttonH, 0xFFFFFF, 1);
      bg.setStrokeStyle(2 * dpr, 0xE5E7EB);
      bg.setInteractive({ useHandCursor: true });

      // Button label
      const fontSize = option.label.length > 10 ? 14 * dpr : 18 * dpr;
      const label = this.add.text(x, y, option.label, {
        fontSize: `${fontSize}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#374151',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonW - 16 * dpr },
      }).setOrigin(0.5);

      const btn: ChoiceButton = { bg, label, option };
      this.choiceButtons.push(btn);

      // Input handler
      bg.on('pointerdown', () => this.handleChoiceTap(btn));
      bg.on('pointerover', () => {
        if (this.phase === GamePhase.PLAYING) {
          bg.setFillStyle(0xF3F4F6);
        }
      });
      bg.on('pointerout', () => {
        if (this.phase === GamePhase.PLAYING) {
          bg.setFillStyle(0xFFFFFF);
        }
      });
    }
  }

  // ─── INPUT HANDLING ──────────────────────────────────

  private handleChoiceTap(btn: ChoiceButton): void {
    if (this.phase !== GamePhase.PLAYING) return;

    const puzzle = this.puzzles[this.currentPuzzleIdx];
    if (!puzzle) return;

    // Handle multi-tap puzzles
    if (puzzle.interaction === 'multi-tap') {
      const count = (this.tapCounts.get(btn.option.id) ?? 0) + 1;
      this.tapCounts.set(btn.option.id, count);

      // Visual feedback for tap count
      btn.label.setText(`${btn.option.label} (${count})`);

      // Check multi-tap targets
      const requiredTaps = this.getRequiredTaps(puzzle);
      if (puzzle.correctIds.includes(btn.option.id) && count >= requiredTaps) {
        this.onCorrectAnswer(puzzle);
      }
      return;
    }

    // Handle sequence puzzles
    if (puzzle.interaction === 'sequence') {
      const tappedSoFar = this.tapCounts.get('__seq__') ?? 0;
      const expectedId = puzzle.correctIds[tappedSoFar];

      if (btn.option.id === expectedId) {
        // Correct sequence step
        this.tapCounts.set('__seq__', tappedSoFar + 1);
        btn.bg.setFillStyle(0xD1FAE5); // green tint
        btn.bg.disableInteractive();

        if (tappedSoFar + 1 >= puzzle.correctIds.length) {
          this.onCorrectAnswer(puzzle);
        }
      } else {
        // Wrong sequence
        this.onWrongAnswer(btn);
      }
      return;
    }

    // Standard tap — check if correct
    if (puzzle.correctIds.includes(btn.option.id)) {
      this.onCorrectAnswer(puzzle);
    } else {
      this.onWrongAnswer(btn);
    }
  }

  private getRequiredTaps(puzzle: Puzzle): number {
    // Extract tap count from question text
    const match = puzzle.question.match(/(\d+)번/);
    return match ? parseInt(match[1], 10) : 3;
  }

  // ─── ANSWER HANDLING ─────────────────────────────────

  private async onCorrectAnswer(puzzle: Puzzle): Promise<void> {
    this.phase = GamePhase.SHOWING_RESULT;

    // Score: +100 base, +50 per difficulty level
    const points = 100 + puzzle.difficulty * 50;
    this.score += points;
    this.emitScore();

    // Visual: highlight correct choices
    for (const btn of this.choiceButtons) {
      if (puzzle.correctIds.includes(btn.option.id)) {
        btn.bg.setFillStyle(0x10B981);
        btn.label.setColor('#FFFFFF');
      } else {
        btn.bg.setFillStyle(0xF3F4F6);
        btn.label.setColor('#9CA3AF');
      }
      btn.bg.disableInteractive();
    }

    // Show correct feedback
    this.showFeedback(true, puzzle.explanation);

    this.game.events.emit('correct-answer', {
      puzzleId: puzzle.id,
      explanation: puzzle.explanation,
    });

    // Wait and advance
    await this.delay(2000);
    this.advancePuzzle();
  }

  private async onWrongAnswer(btn: ChoiceButton): Promise<void> {
    // Flash red
    btn.bg.setFillStyle(0xFEE2E2);
    btn.label.setColor('#DC2626');

    // Shake animation
    this.tweens.add({
      targets: [btn.bg, btn.label],
      x: btn.bg.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        btn.bg.setFillStyle(0xFFFFFF);
        btn.label.setColor('#374151');
      },
    });

    this.game.events.emit('wrong-answer', {
      puzzleId: this.puzzles[this.currentPuzzleIdx]?.id,
    });
  }

  private showFeedback(correct: boolean, text: string): void {
    const dpr = this.dpr;
    const { width, height } = this.scale;

    // Explanation text at bottom
    this.explanationText = this.add.text(
      width / 2, height * 0.85,
      text,
      {
        fontSize: `${14 * dpr}px`,
        fontFamily: 'Arial, sans-serif',
        color: correct ? '#059669' : '#DC2626',
        align: 'center',
        wordWrap: { width: width * 0.85 },
        lineSpacing: 4 * dpr,
      },
    ).setOrigin(0.5);

    // Animate in
    this.explanationText.setAlpha(0);
    this.tweens.add({
      targets: this.explanationText,
      alpha: 1,
      y: height * 0.82,
      duration: 300,
      ease: 'Power2',
    });
  }

  // ─── PUZZLE FLOW ─────────────────────────────────────

  private advancePuzzle(): void {
    this.currentPuzzleIdx++;

    if (this.currentPuzzleIdx >= this.puzzles.length) {
      this.stageClear();
    } else {
      this.showPuzzle();
    }
  }

  /** Called externally by React to use a hint */
  public useHint(): void {
    if (this.phase !== GamePhase.PLAYING || this.hintsLeft <= 0) return;

    const puzzle = this.puzzles[this.currentPuzzleIdx];
    if (!puzzle) return;

    this.hintsLeft--;
    this.emitScore();

    // Show hint text
    const dpr = this.dpr;
    const { width, height } = this.scale;

    const hintText = this.add.text(
      width / 2, height * 0.35,
      `💡 ${puzzle.hint}`,
      {
        fontSize: `${14 * dpr}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#D97706',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: width * 0.8 },
      },
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: hintText,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });

    // Highlight correct answer briefly
    for (const btn of this.choiceButtons) {
      if (puzzle.correctIds.includes(btn.option.id)) {
        this.tweens.add({
          targets: btn.bg,
          fillColor: { from: 0xFEF3C7, to: 0xFFFFFF },
          duration: 1000,
          ease: 'Power2',
        });
      }
    }
  }

  // ─── GAME FLOW ───────────────────────────────────────

  private stageClear(): void {
    this.phase = GamePhase.CLEAR;
    this.gameConfig?.onClear?.();
    this.game.events.emit('stage-clear', {
      score: this.score,
      puzzlesSolved: this.puzzles.length,
    });
  }

  private gameOver(): void {
    this.phase = GamePhase.GAME_OVER;
    this.gameConfig?.onGameOver?.();
    this.game.events.emit('game-over', {
      score: this.score,
    });
  }

  // ─── EMITTERS ────────────────────────────────────────

  private emitScore(): void {
    this.game.events.emit('score-update', {
      score: this.score,
      hintsLeft: this.hintsLeft,
    });
  }

  // ─── UTILS ───────────────────────────────────────────

  private clearPuzzleVisuals(): void {
    if (this.questionText) { this.questionText.destroy(); this.questionText = undefined; }
    if (this.explanationText) { this.explanationText.destroy(); this.explanationText = undefined; }
    if (this.puzzleNumText) { this.puzzleNumText.destroy(); this.puzzleNumText = undefined; }
    if (this.feedbackOverlay) { this.feedbackOverlay.destroy(); this.feedbackOverlay = undefined; }
    if (this.feedbackIcon) { this.feedbackIcon.destroy(); this.feedbackIcon = undefined; }

    for (const btn of this.choiceButtons) {
      btn.bg.destroy();
      btn.label.destroy();
    }
    this.choiceButtons = [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((res) => this.time.delayedCall(ms, () => res()));
  }

  shutdown(): void {
    this.clearPuzzleVisuals();
  }
}
