import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  getStageConfig,
  type RoomState,
  type StageConfig,
  type GameConfig,
} from '../types';
import {
  createRoom,
  isClue,
  isCollected,
  collectClue,
  addCodeInput,
  checkSolution,
  resetCodeInput,
  solveRoom,
} from '../logic/rooms';

const OBJ_SIZE = 48;
const OBJ_GAP = 12;
const INV_SLOT_SIZE = 40;

type GamePhase = 'exploring' | 'solving' | 'celebrating';

export class PlayScene extends Phaser.Scene {
  private room!: RoomState;
  private stageConfig!: StageConfig;
  private config!: GameConfig;
  private dpr = 1;

  private phase: GamePhase = 'exploring';
  private score = 0;
  private attempts = 0;
  private objectContainers: Phaser.GameObjects.Container[] = [];
  private inventoryContainers: Phaser.GameObjects.Container[] = [];
  private codeSlots: Phaser.GameObjects.Container[] = [];
  private puzzleGroup: Phaser.GameObjects.Container | null = null;
  private puzzleButton: Phaser.GameObjects.Container | null = null;
  private discoveredObjects: Set<number> = new Set();

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
    this.room = createRoom(this.stageConfig);
    this.phase = 'exploring';
    this.score = 0;
    this.attempts = 0;
    this.discoveredObjects.clear();

    this.drawRoom();
    this.drawInventory();
    this.emitState();

    this.events.on('shutdown', this.shutdown, this);
  }

  // ─── Layout ───────────────────────────────────────────

  private getObjectLayout(): { x: number; y: number }[] {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const count = this.stageConfig.objectCount;
    const cols = Math.ceil(Math.sqrt(count * 1.5));
    const rows = Math.ceil(count / cols);
    const scale = this.dpr;

    const objW = OBJ_SIZE * scale;
    const gap = OBJ_GAP * scale;
    const positions: { x: number; y: number }[] = [];

    const totalW = cols * objW + (cols - 1) * gap;
    const totalH = rows * objW + (rows - 1) * gap;
    const startX = (w - totalW) / 2 + objW / 2;
    const startY = (h - totalH) / 2 + objW / 2 - 30 * scale;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: startX + col * (objW + gap),
        y: startY + row * (objW + gap),
      });
    }

    return positions;
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawRoom() {
    // Clear previous
    this.objectContainers.forEach((c) => c.destroy());
    this.objectContainers = [];
    if (this.puzzleButton) {
      this.puzzleButton.destroy();
      this.puzzleButton = null;
    }

    const positions = this.getObjectLayout();
    const scale = this.dpr;
    const objW = OBJ_SIZE * scale;

    this.stageConfig.objects.forEach((emoji, idx) => {
      const pos = positions[idx];
      const container = this.add.container(pos.x, pos.y);

      const isClueObj = isClue(this.stageConfig, idx);
      const collected = isCollected(this.room, idx);
      const discovered = this.discoveredObjects.has(idx);

      // Background card
      const bg = this.add.graphics();
      if (collected) {
        // Collected clue — dimmed
        bg.fillStyle(0x22c55e, 0.2);
        bg.fillRoundedRect(-objW / 2, -objW / 2, objW, objW, 10 * scale);
        bg.lineStyle(2 * scale, 0x22c55e, 0.6);
        bg.strokeRoundedRect(-objW / 2, -objW / 2, objW, objW, 10 * scale);
      } else if (discovered && isClueObj) {
        // Clue discovered but not collected — subtle glow
        bg.fillStyle(0xfef3c7, 1);
        bg.fillRoundedRect(-objW / 2, -objW / 2, objW, objW, 10 * scale);
        bg.lineStyle(2 * scale, 0xf59e0b, 0.5);
        bg.strokeRoundedRect(-objW / 2, -objW / 2, objW, objW, 10 * scale);
      } else {
        // Regular object or undiscovered clue
        bg.fillStyle(0xf3f4f6, 1);
        bg.fillRoundedRect(-objW / 2, -objW / 2, objW, objW, 10 * scale);
        bg.lineStyle(1.5 * scale, 0xd1d5db, 1);
        bg.strokeRoundedRect(-objW / 2, -objW / 2, objW, objW, 10 * scale);
      }
      container.add(bg);

      // Emoji text
      const fontSize = Math.round(24 * scale);
      const text = this.add.text(0, 0, emoji, {
        fontSize: `${fontSize}px`,
      }).setOrigin(0.5, 0.5);
      if (collected) text.setAlpha(0.4);
      container.add(text);

      // Check mark for collected
      if (collected) {
        const checkSize = Math.round(14 * scale);
        const check = this.add.text(objW / 2 - 4 * scale, -objW / 2 + 2 * scale, '✓', {
          fontSize: `${checkSize}px`,
          color: '#22c55e',
          fontStyle: 'bold',
        }).setOrigin(1, 0);
        container.add(check);
      }

      // Hit area
      const hitArea = this.add
        .rectangle(0, 0, objW + 4 * scale, objW + 4 * scale)
        .setInteractive()
        .setAlpha(0.001);
      hitArea.on('pointerdown', () => this.onObjectTap(idx));
      container.add(hitArea);

      this.objectContainers.push(container);
    });
  }

  private drawInventory() {
    // Clear previous
    this.inventoryContainers.forEach((c) => c.destroy());
    this.inventoryContainers = [];
    if (this.puzzleButton) {
      this.puzzleButton.destroy();
      this.puzzleButton = null;
    }

    const scale = this.dpr;
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const slotW = INV_SLOT_SIZE * scale;
    const gap = 8 * scale;
    const totalSlots = this.stageConfig.clueIndices.length;
    const totalW = totalSlots * slotW + (totalSlots - 1) * gap;
    const startX = (w - totalW) / 2 + slotW / 2;
    const y = h - 50 * scale;

    for (let i = 0; i < totalSlots; i++) {
      const container = this.add.container(startX + i * (slotW + gap), y);

      const bg = this.add.graphics();
      if (i < this.room.collectedClues.length) {
        bg.fillStyle(0xdbeafe, 1);
        bg.fillRoundedRect(-slotW / 2, -slotW / 2, slotW, slotW, 8 * scale);
        bg.lineStyle(2 * scale, 0x3b82f6, 0.6);
        bg.strokeRoundedRect(-slotW / 2, -slotW / 2, slotW, slotW, 8 * scale);
      } else {
        bg.fillStyle(0xe5e7eb, 0.5);
        bg.fillRoundedRect(-slotW / 2, -slotW / 2, slotW, slotW, 8 * scale);
        bg.lineStyle(1.5 * scale, 0xd1d5db, 1);
        bg.strokeRoundedRect(-slotW / 2, -slotW / 2, slotW, slotW, 8 * scale);
      }
      container.add(bg);

      if (i < this.room.collectedClues.length) {
        const clueIdx = this.room.collectedClues[i];
        const emoji = this.stageConfig.objects[clueIdx];
        const fontSize = Math.round(20 * scale);
        const text = this.add.text(0, 0, emoji, {
          fontSize: `${fontSize}px`,
        }).setOrigin(0.5, 0.5);
        container.add(text);
      } else {
        const fontSize = Math.round(14 * scale);
        const qMark = this.add.text(0, 0, '?', {
          fontSize: `${fontSize}px`,
          color: '#9ca3af',
          fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);
        container.add(qMark);
      }

      this.inventoryContainers.push(container);
    }

    // Puzzle button (only when all clues collected)
    if (this.room.puzzleActive && !this.room.solved && this.phase === 'exploring') {
      this.drawPuzzleButton();
    }
  }

  private drawPuzzleButton() {
    const scale = this.dpr;
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const btnW = 180 * scale;
    const btnH = 40 * scale;
    const x = w / 2;
    const y = h - 100 * scale;

    this.puzzleButton = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x2563eb, 1);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12 * scale);
    this.puzzleButton.add(bg);

    const fontSize = Math.round(16 * scale);
    const label = this.add.text(0, 0, '🔓 Solve Puzzle', {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.puzzleButton.add(label);

    const hitArea = this.add
      .rectangle(0, 0, btnW + 8 * scale, btnH + 8 * scale)
      .setInteractive()
      .setAlpha(0.001);
    hitArea.on('pointerdown', () => this.openPuzzle());
    this.puzzleButton.add(hitArea);
  }

  // ─── Puzzle Panel ─────────────────────────────────────

  private openPuzzle() {
    if (this.phase !== 'exploring') return;
    this.phase = 'solving';
    this.room = { ...this.room, codeInput: [] };
    this.drawPuzzlePanel();
  }

  private drawPuzzlePanel() {
    if (this.puzzleGroup) this.puzzleGroup.destroy();

    const scale = this.dpr;
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    this.puzzleGroup = this.add.container(0, 0);
    this.puzzleGroup.setDepth(500);

    // Backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.5);
    backdrop.fillRect(0, 0, w, h);
    const backdropHit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive().setAlpha(0.001);
    this.puzzleGroup.add(backdrop);
    this.puzzleGroup.add(backdropHit);

    // Panel
    const panelW = 320 * scale;
    const panelH = 300 * scale;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16 * scale);
    this.puzzleGroup.add(panel);

    // Title
    const titleSize = Math.round(18 * scale);
    const title = this.add.text(w / 2, panelY + 30 * scale, '🔐 Enter the Code', {
      fontSize: `${titleSize}px`,
      color: '#111827',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.puzzleGroup.add(title);

    // Code display slots
    const slotW = 40 * scale;
    const slotGap = 8 * scale;
    const codeLen = this.stageConfig.solutionOrder.length;
    const codeTotalW = codeLen * slotW + (codeLen - 1) * slotGap;
    const codeStartX = (w - codeTotalW) / 2 + slotW / 2;
    const codeY = panelY + 80 * scale;

    this.codeSlots = [];
    for (let i = 0; i < codeLen; i++) {
      const slot = this.add.container(codeStartX + i * (slotW + slotGap), codeY);

      const slotBg = this.add.graphics();
      if (i < this.room.codeInput.length) {
        slotBg.fillStyle(0xdbeafe, 1);
        slotBg.fillRoundedRect(-slotW / 2, -slotW / 2, slotW, slotW, 8 * scale);
        slotBg.lineStyle(2 * scale, 0x3b82f6, 1);
        slotBg.strokeRoundedRect(-slotW / 2, -slotW / 2, slotW, slotW, 8 * scale);

        const clueIdx = this.room.codeInput[i];
        const emoji = this.stageConfig.objects[clueIdx];
        const emojiSize = Math.round(20 * scale);
        const emojiText = this.add.text(0, 0, emoji, {
          fontSize: `${emojiSize}px`,
        }).setOrigin(0.5, 0.5);
        slot.add(emojiText);
      } else {
        slotBg.fillStyle(0xf3f4f6, 1);
        slotBg.fillRoundedRect(-slotW / 2, -slotW / 2, slotW, slotW, 8 * scale);
        slotBg.lineStyle(1.5 * scale, 0xd1d5db, 1);
        slotBg.strokeRoundedRect(-slotW / 2, -slotW / 2, slotW, slotW, 8 * scale);
      }
      slot.add(slotBg);
      slot.sendToBack(slotBg);

      this.codeSlots.push(slot);
      this.puzzleGroup.add(slot);
    }

    // Clue buttons to tap
    const btnY = panelY + 160 * scale;
    const btnW = 48 * scale;
    const btnGap = 10 * scale;
    const clueCount = this.room.collectedClues.length;
    const btnTotalW = clueCount * btnW + (clueCount - 1) * btnGap;
    const btnStartX = (w - btnTotalW) / 2 + btnW / 2;

    this.room.collectedClues.forEach((clueIdx, i) => {
      const btn = this.add.container(btnStartX + i * (btnW + btnGap), btnY);

      const alreadyUsed = this.room.codeInput.includes(clueIdx);

      const btnBg = this.add.graphics();
      if (alreadyUsed) {
        btnBg.fillStyle(0xe5e7eb, 0.5);
      } else {
        btnBg.fillStyle(0xfef3c7, 1);
        btnBg.lineStyle(2 * scale, 0xf59e0b, 0.8);
        btnBg.strokeRoundedRect(-btnW / 2, -btnW / 2, btnW, btnW, 10 * scale);
      }
      btnBg.fillRoundedRect(-btnW / 2, -btnW / 2, btnW, btnW, 10 * scale);
      btn.add(btnBg);

      const emoji = this.stageConfig.objects[clueIdx];
      const emojiSize = Math.round(22 * scale);
      const emojiText = this.add.text(0, 0, emoji, {
        fontSize: `${emojiSize}px`,
      }).setOrigin(0.5, 0.5);
      if (alreadyUsed) emojiText.setAlpha(0.3);
      btn.add(emojiText);

      if (!alreadyUsed) {
        const hitArea = this.add
          .rectangle(0, 0, btnW + 4 * scale, btnW + 4 * scale)
          .setInteractive()
          .setAlpha(0.001);
        hitArea.on('pointerdown', () => this.onCodeTap(clueIdx));
        btn.add(hitArea);
      }

      this.puzzleGroup!.add(btn);
    });

    // Close / Reset button
    const closeBtnY = panelY + panelH - 40 * scale;
    const closeBtn = this.add.container(w / 2, closeBtnY);

    const closeBtnBg = this.add.graphics();
    closeBtnBg.fillStyle(0xef4444, 0.1);
    closeBtnBg.fillRoundedRect(-60 * scale, -16 * scale, 120 * scale, 32 * scale, 8 * scale);
    closeBtn.add(closeBtnBg);

    const closeLabelSize = Math.round(14 * scale);
    const closeLabel = this.add.text(0, 0, '✕ Close', {
      fontSize: `${closeLabelSize}px`,
      color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    closeBtn.add(closeLabel);

    const closeHit = this.add
      .rectangle(0, 0, 120 * scale, 36 * scale)
      .setInteractive()
      .setAlpha(0.001);
    closeHit.on('pointerdown', () => this.closePuzzle());
    closeBtn.add(closeHit);

    this.puzzleGroup.add(closeBtn);
  }

  private closePuzzle() {
    if (this.puzzleGroup) {
      this.puzzleGroup.destroy();
      this.puzzleGroup = null;
    }
    this.room = { ...this.room, codeInput: [] };
    this.phase = 'exploring';
    this.drawRoom();
    this.drawInventory();
  }

  // ─── Interaction ──────────────────────────────────────

  private onObjectTap(idx: number) {
    if (this.phase !== 'exploring') return;
    if (this.room.solved) return;

    this.discoveredObjects.add(idx);

    if (!isClue(this.stageConfig, idx)) {
      // Not a clue — shake
      this.shakeObject(idx);
      return;
    }

    if (isCollected(this.room, idx)) return;

    // Collect clue
    this.room = collectClue(this.room, this.stageConfig, idx);
    this.score += 50;

    // Animate collection
    this.animateCollect(idx);

    this.drawRoom();
    this.drawInventory();
    this.emitState();
  }

  private onCodeTap(clueIdx: number) {
    if (this.phase !== 'solving') return;

    this.room = addCodeInput(this.room, clueIdx);

    const result = checkSolution(this.room, this.stageConfig);

    if (result === 'correct') {
      this.room = solveRoom(this.room);
      this.attempts++;
      this.score += this.attempts === 1 ? 500 : 200;
      this.score += 300; // stage clear bonus
      this.phase = 'celebrating';

      if (this.puzzleGroup) {
        this.puzzleGroup.destroy();
        this.puzzleGroup = null;
      }

      this.drawRoom();
      this.drawInventory();
      this.emitState();
      this.celebrateWin();
    } else if (result === 'wrong') {
      this.attempts++;
      // Shake and reset
      this.shakePuzzlePanel();
      this.time.delayedCall(400, () => {
        this.room = resetCodeInput(this.room);
        this.drawPuzzlePanel();
      });
    } else {
      // Incomplete — redraw to show progress
      this.drawPuzzlePanel();
    }
  }

  // ─── Animations ───────────────────────────────────────

  private shakeObject(idx: number) {
    const container = this.objectContainers[idx];
    if (!container) return;
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

  private animateCollect(idx: number) {
    const container = this.objectContainers[idx];
    if (!container) return;

    this.tweens.add({
      targets: container,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    // Sparkle effect
    const pos = this.getObjectLayout()[idx];
    const scale = this.dpr;
    for (let i = 0; i < 8; i++) {
      const p = this.add.circle(
        pos.x,
        pos.y,
        (2 + Math.random() * 2) * scale,
        0xf59e0b,
        1,
      );
      p.setDepth(200);
      const angle = (Math.PI * 2 * i) / 8;
      const dist = (25 + Math.random() * 15) * scale;
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

  private shakePuzzlePanel() {
    if (!this.puzzleGroup) return;
    const origX = this.puzzleGroup.x;

    this.tweens.add({
      targets: this.puzzleGroup,
      x: origX + 8 * this.dpr,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (this.puzzleGroup) this.puzzleGroup.x = origX;
      },
    });
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
        moves: this.room.collectedClues.length + this.attempts,
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
    this.game.events.emit('clue-update', {
      collected: this.room.collectedClues.length,
      total: this.stageConfig.clueIndices.length,
    });
  }

  shutdown(): void {
    this.tweens.killAll();
    this.objectContainers.forEach((c) => c.destroy());
    this.objectContainers = [];
    this.inventoryContainers.forEach((c) => c.destroy());
    this.inventoryContainers = [];
    this.codeSlots.forEach((c) => c.destroy());
    this.codeSlots = [];
    if (this.puzzleGroup) {
      this.puzzleGroup.destroy();
      this.puzzleGroup = null;
    }
    if (this.puzzleButton) {
      this.puzzleButton.destroy();
      this.puzzleButton = null;
    }
    this.discoveredObjects.clear();
  }
}
