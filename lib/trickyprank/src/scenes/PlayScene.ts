import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  COLOR_GREEN,
  COLOR_RED,
  COLOR_BLUE,
  COLOR_GRAY,
  getStageConfig,
  type GameConfig,
  type StageConfig,
} from '../types';
import {
  createPuzzle,
  checkAnswer,
  getRemainingTime,
  type PuzzleState,
  type PlayerAction,
} from '../logic/puzzle';

type GamePhase = 'playing' | 'correct' | 'wrong' | 'gameover' | 'waiting';

export class PlayScene extends Phaser.Scene {
  private puzzleState!: PuzzleState;
  private stageConfig!: StageConfig;
  private gameConfig!: GameConfig;
  private dpr = 1;
  private phase: GamePhase = 'playing';

  // UI elements
  private questionText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private timerBg!: Phaser.GameObjects.Graphics;
  private attemptsText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private feedbackContainer!: Phaser.GameObjects.Container;
  private puzzleContainer!: Phaser.GameObjects.Container;
  private interactiveElements: Map<string, Phaser.GameObjects.GameObject> =
    new Map();

  // Wait puzzle timer
  private waitTimer: Phaser.Time.TimerEvent | null = null;
  private waitElapsed = 0;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.gameConfig = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    const stage = this.gameConfig.stage ?? 1;
    this.stageConfig = getStageConfig(stage);
    this.puzzleState = createPuzzle(this.stageConfig);
    this.phase = 'playing';
    this.interactiveElements.clear();
    this.waitElapsed = 0;

    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Stage indicator
    this.stageText = this.add
      .text(w / 2, 20 * s, `Stage ${stage}`, {
        fontSize: `${14 * s}px`,
        color: COLOR_GRAY,
        fontFamily: 'system-ui, sans-serif',
      })
      .setOrigin(0.5, 0);

    // Timer bar background
    this.timerBg = this.add.graphics();
    this.timerBg.fillStyle(0xe5e7eb, 1);
    this.timerBg.fillRoundedRect(20 * s, 42 * s, w - 40 * s, 8 * s, 4 * s);

    // Timer bar fill
    this.timerBar = this.add.graphics();
    this.drawTimerBar(1);

    // Question text at top
    this.questionText = this.add
      .text(w / 2, 75 * s, this.stageConfig.puzzle.question, {
        fontSize: `${22 * s}px`,
        color: '#1F2937',
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
        wordWrap: { width: w - 40 * s },
        align: 'center',
      })
      .setOrigin(0.5, 0);

    // Attempts counter
    this.attemptsText = this.add
      .text(w - 20 * s, 20 * s, '시도: 0', {
        fontSize: `${12 * s}px`,
        color: COLOR_GRAY,
        fontFamily: 'system-ui, sans-serif',
      })
      .setOrigin(1, 0);

    // Puzzle container
    this.puzzleContainer = this.add.container(0, 0);

    // Feedback container
    this.feedbackContainer = this.add.container(0, 0);
    this.feedbackContainer.setDepth(100);

    // Draw the puzzle
    this.drawPuzzle();

    // Timer update loop
    this.time.addEvent({
      delay: 100,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Wait puzzle setup
    if (this.stageConfig.puzzle.puzzleType === 'wait') {
      this.setupWaitPuzzle();
    }

    this.emitState();
  }

  // ─── Timer ─────────────────────────────────────────

  private drawTimerBar(ratio: number) {
    const w = DEFAULT_WIDTH * this.dpr;
    const s = this.dpr;
    const barW = (w - 40 * s) * Math.max(0, Math.min(1, ratio));

    this.timerBar.clear();
    const color =
      ratio > 0.3 ? 0x3b82f6 : ratio > 0.1 ? 0xeab308 : 0xef4444;
    this.timerBar.fillStyle(color, 1);
    if (barW > 0) {
      this.timerBar.fillRoundedRect(20 * s, 42 * s, barW, 8 * s, 4 * s);
    }
  }

  private updateTimer() {
    if (this.phase !== 'playing' && this.phase !== 'waiting') return;

    const remaining = getRemainingTime(this.puzzleState);
    const ratio = remaining / this.stageConfig.puzzle.timeLimit;
    this.drawTimerBar(ratio);

    if (remaining <= 0) {
      this.onTimeUp();
    }
  }

  private onTimeUp() {
    if (this.phase === 'correct') return;
    this.phase = 'gameover';
    this.showFeedback('시간 초과! ⏰', COLOR_RED, () => {
      this.game.events.emit('game-over', {
        stage: this.stageConfig.stage,
        attempts: this.puzzleState.attempts,
        reason: 'timeout',
      });
    });
  }

  // ─── Puzzle Drawing ────────────────────────────────

  private drawPuzzle() {
    this.puzzleContainer.removeAll(true);
    this.interactiveElements.clear();

    const stage = ((this.stageConfig.stage - 1) % 10) + 1;
    switch (stage) {
      case 1:
        this.drawStage1();
        break;
      case 2:
        this.drawStage2();
        break;
      case 3:
        this.drawStage3();
        break;
      case 4:
        this.drawStage4();
        break;
      case 5:
        this.drawStage5();
        break;
      case 6:
        this.drawStage6();
        break;
      case 7:
        this.drawStage7();
        break;
      case 8:
        this.drawStage8();
        break;
      case 9:
        this.drawStage9();
        break;
      case 10:
        this.drawStage10();
        break;
      default:
        this.drawStage1();
        break;
    }
  }

  // Stage 1: "가장 큰 숫자를 터치하세요" — tap the question text
  private drawStage1() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Make question text interactive — this IS the answer
    this.questionText.setInteractive({ useHandCursor: true });
    this.questionText.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: 'question_text' }),
    );
    this.interactiveElements.set('question_text', this.questionText);

    // Scattered number distractors
    const numbers = [
      { val: '1', x: 0.2, y: 0.4, size: 36 },
      { val: '22', x: 0.5, y: 0.35, size: 48 },
      { val: '7', x: 0.8, y: 0.45, size: 32 },
      { val: '15', x: 0.35, y: 0.55, size: 40 },
      { val: '3', x: 0.65, y: 0.6, size: 28 },
    ];

    numbers.forEach((n) => {
      const txt = this.add
        .text(w * n.x, h * n.y, n.val, {
          fontSize: `${n.size * s}px`,
          color: COLOR_BLUE,
          fontFamily: 'system-ui, sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () =>
        this.onAction({ type: 'tap', targetId: `num_${n.val}` }),
      );
      this.puzzleContainer.add(txt);
      this.interactiveElements.set(`num_${n.val}`, txt);
    });
  }

  // Stage 2: "사과는 몇 개일까요?" — 4 apples + 1 tomato
  private drawStage2() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    const fruits = [
      { emoji: '🍎', x: 0.2, y: 0.35 },
      { emoji: '🍎', x: 0.4, y: 0.32 },
      { emoji: '🍅', x: 0.6, y: 0.36 },
      { emoji: '🍎', x: 0.8, y: 0.33 },
      { emoji: '🍎', x: 0.5, y: 0.45 },
    ];

    fruits.forEach((f) => {
      const txt = this.add
        .text(w * f.x, h * f.y, f.emoji, {
          fontSize: `${40 * s}px`,
        })
        .setOrigin(0.5);
      this.puzzleContainer.add(txt);
    });

    // Answer buttons
    const btnY = h * 0.65;
    for (let i = 1; i <= 5; i++) {
      const btnX = w * (0.15 + (i - 1) * 0.175);
      this.createOptionButton(btnX, btnY, `${i}`, `btn_${i}`, s);
    }
  }

  // Stage 3: "아래 화살표를 눌러주세요" — tap "아래" in question
  private drawStage3() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Arrow distractors
    const arrows = [
      { emoji: '⬆️', id: 'arrow_up', x: 0.5, y: 0.35 },
      { emoji: '⬇️', id: 'arrow_down', x: 0.5, y: 0.55 },
      { emoji: '⬅️', id: 'arrow_left', x: 0.3, y: 0.45 },
      { emoji: '➡️', id: 'arrow_right', x: 0.7, y: 0.45 },
    ];

    arrows.forEach((a) => {
      const txt = this.add
        .text(w * a.x, h * a.y, a.emoji, {
          fontSize: `${40 * s}px`,
        })
        .setOrigin(0.5);
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () =>
        this.onAction({ type: 'tap', targetId: a.id }),
      );
      this.puzzleContainer.add(txt);
      this.interactiveElements.set(a.id, txt);
    });

    // Hit area over "아래" in the question text
    const qBounds = this.questionText.getBounds();
    const hitW = 50 * s;
    const hitH = 30 * s;
    const hitX = qBounds.x + hitW / 2 + 5 * s;
    const hitY = qBounds.y + qBounds.height / 2;
    const targetHit = this.add
      .rectangle(hitX, hitY, hitW, hitH)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    targetHit.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: 'word_아래' }),
    );
    this.puzzleContainer.add(targetHit);
    this.interactiveElements.set('word_아래', targetHit);
  }

  // Stage 4: "이 중 가장 작은 것은?" — tap "작은" in question
  private drawStage4() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    const circles = [
      { r: 50, x: 0.25, y: 0.4, id: 'circle_big', color: 0x3b82f6 },
      { r: 35, x: 0.55, y: 0.45, id: 'circle_med', color: 0x22c55e },
      { r: 20, x: 0.78, y: 0.42, id: 'circle_small', color: 0xeab308 },
    ];

    circles.forEach((c) => {
      const gfx = this.add.graphics();
      gfx.fillStyle(c.color, 1);
      gfx.fillCircle(0, 0, c.r * s);
      gfx.setPosition(w * c.x, h * c.y);
      const hitArea = this.add
        .circle(w * c.x, h * c.y, c.r * s)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      hitArea.on('pointerdown', () =>
        this.onAction({ type: 'tap', targetId: c.id }),
      );
      this.puzzleContainer.add(gfx);
      this.puzzleContainer.add(hitArea);
      this.interactiveElements.set(c.id, hitArea);
    });

    // Hit area over "작은" in question
    const qBounds = this.questionText.getBounds();
    const hitW = 50 * s;
    const hitH = 30 * s;
    const hitX = qBounds.x + qBounds.width * 0.5;
    const hitY = qBounds.y + qBounds.height / 2;
    const targetHit = this.add
      .rectangle(hitX, hitY, hitW, hitH)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    targetHit.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: 'question_작은' }),
    );
    this.puzzleContainer.add(targetHit);
    this.interactiveElements.set('question_작은', targetHit);
  }

  // Stage 5: "삼각형은 몇 개일까요?" — 7 overlapping triangles
  private drawStage5() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    const triangles = [
      { x: 0.3, y: 0.35, size: 60, color: 0x3b82f6, alpha: 0.7 },
      { x: 0.5, y: 0.32, size: 70, color: 0x22c55e, alpha: 0.7 },
      { x: 0.7, y: 0.36, size: 55, color: 0xeab308, alpha: 0.7 },
      { x: 0.4, y: 0.48, size: 50, color: 0xef4444, alpha: 0.6 },
      { x: 0.6, y: 0.46, size: 45, color: 0xa855f7, alpha: 0.6 },
      { x: 0.35, y: 0.42, size: 35, color: 0xf97316, alpha: 0.5 },
      { x: 0.65, y: 0.4, size: 30, color: 0x06b6d4, alpha: 0.5 },
    ];

    triangles.forEach((t) => {
      const gfx = this.add.graphics();
      gfx.fillStyle(t.color, t.alpha);
      gfx.lineStyle(2 * s, t.color, 1);
      const cx = w * t.x;
      const cy = h * t.y;
      const sz = t.size * s;
      gfx.beginPath();
      gfx.moveTo(cx, cy - sz / 2);
      gfx.lineTo(cx - sz / 2, cy + sz / 2);
      gfx.lineTo(cx + sz / 2, cy + sz / 2);
      gfx.closePath();
      gfx.fillPath();
      gfx.strokePath();
      this.puzzleContainer.add(gfx);
    });

    // Answer buttons
    const btnY = h * 0.68;
    [5, 6, 7, 8].forEach((num, i) => {
      const btnX = w * (0.2 + i * 0.2);
      this.createOptionButton(btnX, btnY, `${num}`, `btn_${num}`, s);
    });
  }

  // Stage 6: "빨간 버튼을 누르세요" — real red vs fake labeled
  private drawStage6() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Fake "빨간" button in GREEN
    const fakeBtn = this.add.graphics();
    fakeBtn.fillStyle(0x22c55e, 1);
    fakeBtn.fillRoundedRect(
      w * 0.3 - 60 * s,
      h * 0.45 - 25 * s,
      120 * s,
      50 * s,
      12 * s,
    );
    const fakeLabel = this.add
      .text(w * 0.3, h * 0.45, '빨간', {
        fontSize: `${24 * s}px`,
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const fakeHit = this.add
      .rectangle(w * 0.3, h * 0.45, 120 * s, 50 * s)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    fakeHit.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: 'fake_red_btn' }),
    );

    // Real red button (small, in corner)
    const realBtn = this.add.graphics();
    realBtn.fillStyle(0xef4444, 1);
    realBtn.fillRoundedRect(
      w * 0.8 - 20 * s,
      h * 0.6 - 15 * s,
      40 * s,
      30 * s,
      8 * s,
    );
    const realHit = this.add
      .rectangle(w * 0.8, h * 0.6, 40 * s, 30 * s)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    realHit.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: 'real_red_btn' }),
    );

    this.puzzleContainer.add(fakeBtn);
    this.puzzleContainer.add(fakeLabel);
    this.puzzleContainer.add(fakeHit);
    this.puzzleContainer.add(realBtn);
    this.puzzleContainer.add(realHit);
    this.interactiveElements.set('fake_red_btn', fakeHit);
    this.interactiveElements.set('real_red_btn', realHit);
  }

  // Stage 7: "숫자를 작은 순서대로 누르세요: 10 1 8"
  private drawStage7() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    const nums = [
      { val: '10', x: 0.25, y: 0.42, size: 20 },
      { val: '1', x: 0.5, y: 0.38, size: 52 },
      { val: '8', x: 0.75, y: 0.44, size: 36 },
    ];

    this.puzzleState.sequenceProgress = [];
    const correctOrder = ['1', '8', '10'];

    nums.forEach((n) => {
      const txt = this.add
        .text(w * n.x, h * n.y, n.val, {
          fontSize: `${n.size * s}px`,
          color: COLOR_BLUE,
          fontFamily: 'system-ui, sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () => {
        this.puzzleState.sequenceProgress.push(n.val);
        txt.setAlpha(0.4);
        txt.disableInteractive();

        if (this.puzzleState.sequenceProgress.length === correctOrder.length) {
          const isCorrect = this.puzzleState.sequenceProgress.every(
            (v, i) => v === correctOrder[i],
          );
          if (isCorrect) {
            this.onAction({ type: 'tap', targetId: 'seq_correct' });
          } else {
            this.onAction({ type: 'tap', targetId: 'seq_wrong' });
            this.time.delayedCall(800, () => {
              this.puzzleState.sequenceProgress = [];
              this.drawPuzzle();
            });
          }
        }
      });
      this.puzzleContainer.add(txt);
      this.interactiveElements.set(`num_${n.val}`, txt);
    });
  }

  // Stage 8: "문제를 풀지 마세요" — just wait
  private drawStage8() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    const options = ['A', 'B', 'C', 'D'];
    options.forEach((opt, i) => {
      const btnX = w * (0.2 + i * 0.2);
      const btnY = h * 0.5;
      const btn = this.add.graphics();
      btn.fillStyle(0x3b82f6, 1);
      btn.fillRoundedRect(
        btnX - 25 * s,
        btnY - 20 * s,
        50 * s,
        40 * s,
        8 * s,
      );
      const label = this.add
        .text(btnX, btnY, opt, {
          fontSize: `${20 * s}px`,
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      const hitArea = this.add
        .rectangle(btnX, btnY, 50 * s, 40 * s)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => {
        this.onAction({ type: 'tap', targetId: `trap_${opt}` });
      });
      this.puzzleContainer.add(btn);
      this.puzzleContainer.add(label);
      this.puzzleContainer.add(hitArea);
    });

    const waitText = this.add
      .text(w / 2, h * 0.65, '아무것도 누르지 마세요...', {
        fontSize: `${16 * s}px`,
        color: COLOR_GRAY,
        fontFamily: 'system-ui, sans-serif',
      })
      .setOrigin(0.5);
    this.puzzleContainer.add(waitText);
  }

  // Stage 9: "화면에서 고양이를 찾으세요" — hidden cat in question
  private drawStage9() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    const animals = [
      { emoji: '🐶', x: 0.2, y: 0.35, id: 'dog' },
      { emoji: '🐰', x: 0.5, y: 0.4, id: 'rabbit' },
      { emoji: '🐦', x: 0.8, y: 0.35, id: 'bird' },
      { emoji: '🐸', x: 0.35, y: 0.55, id: 'frog' },
      { emoji: '🐟', x: 0.65, y: 0.5, id: 'fish' },
    ];

    animals.forEach((a) => {
      const txt = this.add
        .text(w * a.x, h * a.y, a.emoji, {
          fontSize: `${36 * s}px`,
        })
        .setOrigin(0.5);
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () =>
        this.onAction({ type: 'tap', targetId: a.id }),
      );
      this.puzzleContainer.add(txt);
      this.interactiveElements.set(a.id, txt);
    });

    // Hidden cat near the question text
    const qBounds = this.questionText.getBounds();
    const hiddenCat = this.add
      .text(qBounds.right - 10 * s, qBounds.y + 2 * s, '🐱', {
        fontSize: `${8 * s}px`,
      })
      .setOrigin(0.5, 0);
    hiddenCat.setInteractive({ useHandCursor: true });
    hiddenCat.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: 'hidden_cat' }),
    );
    this.puzzleContainer.add(hiddenCat);
    this.interactiveElements.set('hidden_cat', hiddenCat);
  }

  // Stage 10: "전구를 켜세요" — tap the dark background
  private drawStage10() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Dark overlay
    const darkBg = this.add.graphics();
    darkBg.fillStyle(0x1f2937, 0.85);
    darkBg.fillRect(0, 100 * s, w, h - 100 * s);
    darkBg.setInteractive(
      new Phaser.Geom.Rectangle(0, 100 * s, w, h - 100 * s),
      Phaser.Geom.Rectangle.Contains,
    );
    darkBg.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: 'dark_bg' }),
    );
    this.puzzleContainer.add(darkBg);
    this.interactiveElements.set('dark_bg', darkBg);

    // Lightbulb distractor
    const bulb = this.add
      .text(w * 0.5, h * 0.4, '💡', {
        fontSize: `${48 * s}px`,
      })
      .setOrigin(0.5);
    bulb.setInteractive({ useHandCursor: true });
    bulb.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: 'bulb' }),
    );
    this.puzzleContainer.add(bulb);
    this.interactiveElements.set('bulb', bulb);

    // Switch distractor
    const switchBtn = this.add.graphics();
    switchBtn.fillStyle(0x6b7280, 1);
    switchBtn.fillRoundedRect(
      w * 0.5 - 20 * s,
      h * 0.6 - 15 * s,
      40 * s,
      30 * s,
      6 * s,
    );
    const switchLabel = this.add
      .text(w * 0.5, h * 0.6, 'ON', {
        fontSize: `${14 * s}px`,
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const switchHit = this.add
      .rectangle(w * 0.5, h * 0.6, 40 * s, 30 * s)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    switchHit.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: 'switch' }),
    );

    this.puzzleContainer.add(switchBtn);
    this.puzzleContainer.add(switchLabel);
    this.puzzleContainer.add(switchHit);
    this.interactiveElements.set('switch', switchHit);
  }

  // ─── Shared UI Helpers ─────────────────────────────

  private createOptionButton(
    x: number,
    y: number,
    label: string,
    id: string,
    s: number,
  ) {
    const btn = this.add.graphics();
    btn.fillStyle(0xf3f4f6, 1);
    btn.fillRoundedRect(x - 25 * s, y - 20 * s, 50 * s, 40 * s, 8 * s);
    btn.lineStyle(2 * s, 0xd1d5db, 1);
    btn.strokeRoundedRect(x - 25 * s, y - 20 * s, 50 * s, 40 * s, 8 * s);

    const text = this.add
      .text(x, y, label, {
        fontSize: `${22 * s}px`,
        color: '#374151',
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const hitArea = this.add
      .rectangle(x, y, 50 * s, 40 * s)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    hitArea.on('pointerdown', () =>
      this.onAction({ type: 'tap', targetId: id }),
    );

    this.puzzleContainer.add(btn);
    this.puzzleContainer.add(text);
    this.puzzleContainer.add(hitArea);
    this.interactiveElements.set(id, hitArea);
  }

  // ─── Wait Puzzle Logic ─────────────────────────────

  private setupWaitPuzzle() {
    this.phase = 'waiting';
    const answer = this.stageConfig.puzzle.answer;
    if (answer.type !== 'wait') return;

    this.waitTimer = this.time.delayedCall(answer.duration, () => {
      this.onAction({ type: 'wait' });
    });
  }

  // ─── Action Handler ────────────────────────────────

  private onAction(action: PlayerAction) {
    if (this.phase !== 'playing' && this.phase !== 'waiting') return;

    // For wait puzzles, any tap is a failure
    if (this.stageConfig.puzzle.puzzleType === 'wait' && action.type === 'tap') {
      this.puzzleState.attempts++;
      if (this.waitTimer) {
        this.waitTimer.destroy();
        this.waitTimer = null;
      }
      this.showWrongFeedback();
      this.time.delayedCall(1000, () => {
        if (this.phase === 'wrong') {
          this.phase = 'waiting';
          this.feedbackContainer.removeAll(true);
          this.setupWaitPuzzle();
        }
      });
      return;
    }

    const isCorrect = checkAnswer(this.puzzleState, action);
    this.attemptsText.setText(`시도: ${this.puzzleState.attempts}`);
    this.emitState();

    if (isCorrect) {
      this.onCorrect();
    } else {
      this.showWrongFeedback();
    }
  }

  private onCorrect() {
    this.phase = 'correct';
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Green flash overlay
    const flash = this.add.graphics();
    flash.fillStyle(0x22c55e, 0.3);
    flash.fillRect(0, 0, w, h);
    this.feedbackContainer.add(flash);
    this.tweens.add({ targets: flash, alpha: 0, duration: 500 });

    // "정답! 🎉" text
    const correctText = this.add
      .text(w / 2, h * 0.4, '정답! 🎉', {
        fontSize: `${36 * s}px`,
        color: COLOR_GREEN,
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(0);
    this.feedbackContainer.add(correctText);
    this.tweens.add({
      targets: correctText,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    this.spawnConfetti();

    // Show explanation after delay
    this.time.delayedCall(1200, () => {
      const explanation = this.add
        .text(w / 2, h * 0.55, this.stageConfig.puzzle.explanation, {
          fontSize: `${16 * s}px`,
          color: '#4B5563',
          fontFamily: 'system-ui, sans-serif',
          wordWrap: { width: w - 60 * s },
          align: 'center',
        })
        .setOrigin(0.5)
        .setAlpha(0);
      this.feedbackContainer.add(explanation);
      this.tweens.add({ targets: explanation, alpha: 1, duration: 300 });
    });

    // Emit stage clear
    this.time.delayedCall(2500, () => {
      this.game.events.emit('stage-clear', {
        stage: this.stageConfig.stage,
        score: Math.max(100 - (this.puzzleState.attempts - 1) * 10, 10),
        attempts: this.puzzleState.attempts,
      });
    });
  }

  private showWrongFeedback() {
    this.phase = 'wrong';
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Red flash
    const flash = this.add.graphics();
    flash.fillStyle(0xef4444, 0.2);
    flash.fillRect(0, 0, w, h);
    this.feedbackContainer.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    // "틀렸어요! 😝" with shake
    const wrongText = this.add
      .text(w / 2, h * 0.4, '틀렸어요! 😝', {
        fontSize: `${28 * s}px`,
        color: COLOR_RED,
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.feedbackContainer.add(wrongText);

    const origX = wrongText.x;
    this.tweens.add({
      targets: wrongText,
      x: origX + 10 * s,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        wrongText.x = origX;
        this.tweens.add({
          targets: wrongText,
          alpha: 0,
          duration: 300,
          delay: 300,
          onComplete: () => {
            wrongText.destroy();
            if (this.phase === 'wrong') {
              this.phase = 'playing';
            }
          },
        });
      },
    });
  }

  private spawnConfetti() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;
    const colors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316];

    for (let i = 0; i < 25; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (3 + Math.random() * 5) * s;
      const p = this.add.rectangle(
        w / 2 + (Math.random() - 0.5) * 60 * s,
        h * 0.4,
        size,
        size * 1.5,
        color,
      );
      p.setDepth(200);
      p.setRotation(Math.random() * Math.PI);
      this.feedbackContainer.add(p);

      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * w * 0.7,
        y: p.y + (Math.random() - 0.5) * h * 0.5,
        rotation: p.rotation + (Math.random() - 0.5) * 4,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  private showFeedback(
    text: string,
    color: string,
    onComplete?: () => void,
  ) {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    const txt = this.add
      .text(w / 2, h * 0.45, text, {
        fontSize: `${30 * s}px`,
        color,
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(0);
    this.feedbackContainer.add(txt);

    this.tweens.add({
      targets: txt,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          if (onComplete) onComplete();
        });
      },
    });
  }

  // ─── Public API ────────────────────────────────────

  public showHint() {
    const answer = this.stageConfig.puzzle.answer;
    if (answer.type === 'tap_target') {
      const target = this.interactiveElements.get(answer.targetId);
      if (target) {
        this.tweens.add({
          targets: target,
          alpha: 0.5,
          duration: 200,
          yoyo: true,
          repeat: 2,
        });
      }
    } else if (answer.type === 'wait') {
      const w = DEFAULT_WIDTH * this.dpr;
      const h = DEFAULT_HEIGHT * this.dpr;
      const s = this.dpr;
      const hint = this.add
        .text(w / 2, h * 0.8, '💤 가만히...', {
          fontSize: `${14 * s}px`,
          color: COLOR_GRAY,
          fontFamily: 'system-ui, sans-serif',
        })
        .setOrigin(0.5)
        .setAlpha(0);
      this.tweens.add({
        targets: hint,
        alpha: 1,
        duration: 300,
        yoyo: true,
        hold: 1000,
        onComplete: () => hint.destroy(),
      });
    }

    this.game.events.emit('hint-request', { stage: this.stageConfig.stage });
  }

  public restart() {
    this.scene.restart({ config: this.gameConfig, dpr: this.dpr });
  }

  private emitState() {
    this.game.events.emit('score-update', {
      attempts: this.puzzleState.attempts,
      stage: this.stageConfig.stage,
    });
  }
}
