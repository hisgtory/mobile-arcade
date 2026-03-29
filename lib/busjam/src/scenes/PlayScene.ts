import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  PASSENGER_COLORS,
  BUS_CAPACITY,
  BOARDING_AREA_LIMIT,
  getStageConfig,
  type BoardState,
  type GameConfig,
  type Passenger,
} from '../types';
import {
  createBoard,
  moveToBoarding,
  tryBoard,
  departFullBuses,
  advanceBuses,
  isWon,
  isGameOver,
  getPickablePositions,
} from '../logic/board';

// ─── Layout Constants ───────────────────────────────────
const BUS_STOP_Y_RATIO = 0.10;    // bus stop area top
const BOARDING_Y_RATIO = 0.30;     // boarding area Y
const QUEUE_Y_START_RATIO = 0.45;  // queue grid start
const PASSENGER_RADIUS = 16;
const BUS_WIDTH = 80;
const BUS_HEIGHT = 48;

type GamePhase = 'idle' | 'animating' | 'celebrating' | 'gameover';

export class PlayScene extends Phaser.Scene {
  private board!: BoardState;
  private config!: GameConfig;
  private dpr = 1;
  private phase: GamePhase = 'idle';
  private score = 0;
  private moves = 0;

  // Display objects
  private busGraphics: Phaser.GameObjects.Container[] = [];
  private boardingGraphics: Phaser.GameObjects.Container[] = [];
  private queueGraphics: Phaser.GameObjects.Container[] = [];
  private pickableHighlights: Phaser.GameObjects.Graphics[] = [];
  private moveHistory: BoardState[] = [];

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
    this.score = 0;
    this.moves = 0;
    this.moveHistory = [];

    this.drawAll();
    this.emitState();
  }

  // ─── Drawing ──────────────────────────────────────────

  private drawAll() {
    this.clearAll();
    this.drawBuses();
    this.drawBoardingArea();
    this.drawQueue();
    this.drawPickableHighlights();
    this.drawLabels();
  }

  private clearAll() {
    this.busGraphics.forEach((c) => c.destroy());
    this.busGraphics = [];
    this.boardingGraphics.forEach((c) => c.destroy());
    this.boardingGraphics = [];
    this.queueGraphics.forEach((c) => c.destroy());
    this.queueGraphics = [];
    this.pickableHighlights.forEach((g) => g.destroy());
    this.pickableHighlights = [];
  }

  private drawLabels() {
    const s = this.dpr;
    const w = DEFAULT_WIDTH * s;

    // Bus stops label
    const busLabel = this.add.text(20 * s, (BUS_STOP_Y_RATIO * DEFAULT_HEIGHT - 18) * s, '🚌 Bus Stops', {
      fontSize: `${13 * s}px`,
      color: '#6B7280',
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
    });
    this.busGraphics.push(this.add.container(0, 0, [busLabel]));

    // Boarding area label
    const boardLabel = this.add.text(20 * s, (BOARDING_Y_RATIO * DEFAULT_HEIGHT - 18) * s, '🚏 Boarding Area', {
      fontSize: `${13 * s}px`,
      color: '#6B7280',
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
    });
    this.boardingGraphics.push(this.add.container(0, 0, [boardLabel]));

    // Queue label
    const queueLabel = this.add.text(20 * s, (QUEUE_Y_START_RATIO * DEFAULT_HEIGHT - 18) * s, '👥 Passengers', {
      fontSize: `${13 * s}px`,
      color: '#6B7280',
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
    });
    this.queueGraphics.push(this.add.container(0, 0, [queueLabel]));

    // Boarding area capacity indicator
    const capText = `${this.board.boardingArea.length}/${BOARDING_AREA_LIMIT}`;
    const capColor = this.board.boardingArea.length >= BOARDING_AREA_LIMIT - 1 ? '#EF4444' : '#9CA3AF';
    const capLabel = this.add.text(w - 80 * s, (BOARDING_Y_RATIO * DEFAULT_HEIGHT - 18) * s, capText, {
      fontSize: `${12 * s}px`,
      color: capColor,
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
    });
    this.boardingGraphics.push(this.add.container(0, 0, [capLabel]));
  }

  private drawBuses() {
    const s = this.dpr;
    const w = DEFAULT_WIDTH * s;
    const y = BUS_STOP_Y_RATIO * DEFAULT_HEIGHT * s;
    const busW = BUS_WIDTH * s;
    const busH = BUS_HEIGHT * s;
    const gap = 16 * s;

    const totalW = this.board.buses.length * busW + (this.board.buses.length - 1) * gap;
    const startX = (w - totalW) / 2 + busW / 2;

    this.board.buses.forEach((bus, idx) => {
      if (bus.departed) return;
      const x = startX + idx * (busW + gap);
      const container = this.add.container(x, y);

      const color = PASSENGER_COLORS[bus.colorIdx];
      const hex = parseInt(color.replace('#', ''), 16);

      // Bus body
      const body = this.add.graphics();
      body.fillStyle(hex, 0.85);
      body.fillRoundedRect(-busW / 2, -busH / 2, busW, busH, 10 * s);
      body.lineStyle(2 * s, hex, 1);
      body.strokeRoundedRect(-busW / 2, -busH / 2, busW, busH, 10 * s);
      container.add(body);

      // Windows
      const winSize = 10 * s;
      for (let wi = 0; wi < BUS_CAPACITY; wi++) {
        const wx = -busW / 2 + 10 * s + wi * (winSize + 6 * s);
        const win = this.add.graphics();
        win.fillStyle(0xffffff, 0.7);
        win.fillRoundedRect(wx, -busH / 2 + 6 * s, winSize, winSize, 3 * s);

        // If passenger seated, fill window with color
        if (wi < bus.passengers.length) {
          win.fillStyle(hex, 1);
          win.fillRoundedRect(wx + 2 * s, -busH / 2 + 8 * s, winSize - 4 * s, winSize - 4 * s, 2 * s);
        }
        container.add(win);
      }

      // Passenger count
      const countText = this.add.text(busW / 2 - 20 * s, busH / 2 - 16 * s, `${bus.passengers.length}/${BUS_CAPACITY}`, {
        fontSize: `${10 * s}px`,
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontStyle: 'bold',
      });
      container.add(countText);

      // Bus queue indicator
      if (this.board.busQueue.length > 0 && idx === this.board.buses.length - 1) {
        const queueText = this.add.text(busW / 2 + 8 * s, -8 * s, `+${this.board.busQueue.length}`, {
          fontSize: `${11 * s}px`,
          color: '#9CA3AF',
          fontFamily: 'system-ui, sans-serif',
        });
        container.add(queueText);
      }

      this.busGraphics.push(container);
    });
  }

  private drawBoardingArea() {
    const s = this.dpr;
    const w = DEFAULT_WIDTH * s;
    const y = BOARDING_Y_RATIO * DEFAULT_HEIGHT * s;
    const r = PASSENGER_RADIUS * s;
    const gap = 6 * s;

    // Background zone
    const zoneBg = this.add.graphics();
    const zoneW = w - 40 * s;
    const zoneH = r * 2 + 20 * s;
    zoneBg.fillStyle(0xf3f4f6, 1);
    zoneBg.fillRoundedRect(20 * s, y - zoneH / 2, zoneW, zoneH, 12 * s);
    zoneBg.lineStyle(1 * s, 0xe5e7eb, 1);
    zoneBg.strokeRoundedRect(20 * s, y - zoneH / 2, zoneW, zoneH, 12 * s);
    this.boardingGraphics.push(this.add.container(0, 0, [zoneBg]));

    // Draw empty slots
    for (let i = 0; i < BOARDING_AREA_LIMIT; i++) {
      const slotX = 40 * s + i * (r * 2 + gap) + r;
      const slot = this.add.graphics();
      slot.lineStyle(1 * s, 0xd1d5db, 0.5);
      slot.strokeCircle(slotX, y, r * 0.7);
      this.boardingGraphics.push(this.add.container(0, 0, [slot]));
    }

    // Draw passengers in boarding area
    this.board.boardingArea.forEach((passenger, idx) => {
      const px = 40 * s + idx * (r * 2 + gap) + r;
      const container = this.add.container(px, y);

      const color = PASSENGER_COLORS[passenger.colorIdx];
      const hex = parseInt(color.replace('#', ''), 16);

      // Body circle
      const circle = this.add.graphics();
      circle.fillStyle(hex, 1);
      circle.fillCircle(0, 0, r);
      circle.lineStyle(2 * s, 0xffffff, 0.8);
      circle.strokeCircle(0, 0, r);
      container.add(circle);

      // Face emoji
      const face = this.add.text(-5 * s, -6 * s, '😊', {
        fontSize: `${12 * s}px`,
      });
      container.add(face);

      this.boardingGraphics.push(container);
    });
  }

  private drawQueue() {
    const s = this.dpr;
    const w = DEFAULT_WIDTH * s;
    const yStart = QUEUE_Y_START_RATIO * DEFAULT_HEIGHT * s;
    const r = PASSENGER_RADIUS * s;
    const gapX = 12 * s;
    const gapY = 10 * s;
    const cellW = r * 2 + gapX;
    const cellH = r * 2 + gapY;

    const cols = this.board.queue[0]?.length ?? 0;
    const totalW = cols * cellW - gapX;
    const startX = (w - totalW) / 2 + r;

    const pickable = getPickablePositions(this.board);
    const pickableSet = new Set(pickable.map((p) => `${p.row},${p.col}`));

    this.board.queue.forEach((row, rIdx) => {
      row.forEach((passenger, cIdx) => {
        if (!passenger) return;

        const px = startX + cIdx * cellW;
        const py = yStart + rIdx * cellH;
        const container = this.add.container(px, py);
        const isPickable = pickableSet.has(`${rIdx},${cIdx}`);

        const color = PASSENGER_COLORS[passenger.colorIdx];
        const hex = parseInt(color.replace('#', ''), 16);

        // Shadow for pickable
        if (isPickable) {
          const shadow = this.add.graphics();
          shadow.fillStyle(hex, 0.15);
          shadow.fillCircle(0, 2 * s, r + 3 * s);
          container.add(shadow);
        }

        // Body circle
        const circle = this.add.graphics();
        circle.fillStyle(hex, isPickable ? 1 : 0.5);
        circle.fillCircle(0, 0, r);
        if (isPickable) {
          circle.lineStyle(2 * s, 0xffffff, 0.9);
          circle.strokeCircle(0, 0, r);
        }
        container.add(circle);

        // Face
        const face = this.add.text(-5 * s, -6 * s, isPickable ? '😊' : '😶', {
          fontSize: `${12 * s}px`,
        });
        container.add(face);

        // Hit area for pickable passengers
        if (isPickable) {
          const hitArea = this.add
            .rectangle(0, 0, cellW, cellH)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.001);
          hitArea.on('pointerdown', () => this.onPassengerTap(rIdx, cIdx));
          container.add(hitArea);
        }

        this.queueGraphics.push(container);
      });
    });
  }

  private drawPickableHighlights() {
    // Pulse animation on pickable passengers is handled by their visual
  }

  // ─── Interaction ──────────────────────────────────────

  private onPassengerTap(row: number, col: number) {
    if (this.phase !== 'idle') return;

    // Save state for undo
    this.moveHistory.push(this.cloneBoard());

    const success = moveToBoarding(this.board, row, col);
    if (!success) {
      this.moveHistory.pop();
      return;
    }

    this.moves++;
    this.phase = 'animating';

    // Redraw and then try boarding
    this.drawAll();
    this.emitState();

    // Try boarding after short delay
    this.time.delayedCall(200, () => {
      this.processBoarding();
    });
  }

  private processBoarding() {
    const results = tryBoard(this.board);

    if (results.length > 0) {
      // Animate boarding
      this.drawAll();
      this.emitState();

      // Check for full buses
      this.time.delayedCall(300, () => {
        const departed = departFullBuses(this.board);
        if (departed.length > 0) {
          this.score += departed.length * 100;
          this.emitState();

          // Animate departure
          this.time.delayedCall(400, () => {
            advanceBuses(this.board);
            this.drawAll();
            this.emitState();

            // Recursively try boarding with new buses
            this.time.delayedCall(200, () => {
              this.processBoarding();
            });
          });
        } else {
          this.finishTurn();
        }
      });
    } else {
      this.finishTurn();
    }
  }

  private finishTurn() {
    this.drawAll();
    this.emitState();

    if (isWon(this.board)) {
      this.phase = 'celebrating';
      this.time.delayedCall(400, () => {
        this.celebrateWin();
      });
    } else if (isGameOver(this.board)) {
      this.phase = 'gameover';
      this.time.delayedCall(400, () => {
        this.game.events.emit('game-over', {
          score: this.score,
          moves: this.moves,
          stage: this.config.stage ?? 1,
        });
      });
    } else {
      this.phase = 'idle';
    }
  }

  // ─── Win Celebration ──────────────────────────────────

  private celebrateWin() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

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
        moves: this.moves,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Undo & Restart ───────────────────────────────────

  public undo() {
    if (this.phase !== 'idle' || this.moveHistory.length === 0) return;
    const prev = this.moveHistory.pop()!;
    this.board = prev;
    this.moves = Math.max(0, this.moves - 1);
    this.drawAll();
    this.emitState();
  }

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  // ─── Helpers ──────────────────────────────────────────

  private cloneBoard(): BoardState {
    return {
      queue: this.board.queue.map((row) =>
        row.map((p) => (p ? { ...p } : null)),
      ),
      boardingArea: this.board.boardingArea.map((p) => ({ ...p })),
      buses: this.board.buses.map((b) => ({
        ...b,
        passengers: b.passengers.map((p) => ({ ...p })),
      })),
      busQueue: this.board.busQueue.map((b) => ({
        ...b,
        passengers: b.passengers.map((p) => ({ ...p })),
      })),
      numStops: this.board.numStops,
      numColors: this.board.numColors,
    };
  }

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
  }
}
