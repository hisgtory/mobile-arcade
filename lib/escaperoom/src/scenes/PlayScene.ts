import Phaser from 'phaser';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  type RoomConfig,
  type RoomObject,
  type GameConfig,
  type GamePhase,
} from '../types';
import { getRoomConfig } from '../logic/rooms';

/** Padding around the room area */
const PAD = 16;

export class PlayScene extends Phaser.Scene {
  private room!: RoomConfig;
  private config!: GameConfig;
  private dpr = 1;

  private phase: GamePhase = 'playing';
  private inventory: Set<string> = new Set();
  private resolvedObjects: Set<string> = new Set();
  private inspectText: string | null = null;
  private score = 0;
  private moves = 0;

  // Visual layers
  private roomContainer!: Phaser.GameObjects.Container;
  private objectSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private overlayContainer!: Phaser.GameObjects.Container;
  private inspectBg!: Phaser.GameObjects.Rectangle;
  private inspectLabel!: Phaser.GameObjects.Text;
  private inspectClose!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { config?: GameConfig; dpr?: number }) {
    this.config = data.config ?? {};
    this.dpr = data.dpr ?? 1;
  }

  create() {
    const stage = this.config.stage ?? 1;
    this.room = getRoomConfig(stage);
    this.inventory = new Set();
    this.resolvedObjects = new Set();
    this.phase = 'playing';
    this.inspectText = null;
    this.score = 0;
    this.moves = 0;

    this.buildRoom();
    this.buildInspectOverlay();
    this.emitState();
  }

  // ─── Room Building ────────────────────────────────────

  private buildRoom() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, this.room.bgColor);

    // Room border (walls)
    const pad = PAD * this.dpr;
    const wallG = this.add.graphics();
    wallG.lineStyle(3 * this.dpr, 0x555555, 1);
    wallG.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    // Floor line
    const floorY = h * 0.75;
    wallG.lineStyle(2 * this.dpr, 0x888888, 0.5);
    wallG.lineBetween(pad, floorY, w - pad, floorY);

    this.roomContainer = this.add.container(0, 0);

    // Place objects
    this.objectSprites.clear();
    for (const obj of this.room.objects) {
      this.createObject(obj, w, h);
    }

    this.updateObjectVisibility();
  }

  private createObject(obj: RoomObject, roomW: number, roomH: number) {
    const s = this.dpr;
    const x = obj.x * roomW;
    const y = obj.y * roomH;
    const ow = obj.w * roomW;
    const oh = obj.h * roomH;
    const cx = x + ow / 2;
    const cy = y + oh / 2;

    const container = this.add.container(cx, cy);

    // Background rect
    const bg = this.add.graphics();
    bg.fillStyle(obj.color, 0.85);
    bg.fillRoundedRect(-ow / 2, -oh / 2, ow, oh, 6 * s);
    bg.lineStyle(1.5 * s, 0x444444, 0.6);
    bg.strokeRoundedRect(-ow / 2, -oh / 2, ow, oh, 6 * s);
    container.add(bg);

    // Icon
    if (obj.icon) {
      const iconSize = Math.min(ow, oh) * 0.5;
      const icon = this.add.text(0, -4 * s, obj.icon, {
        fontSize: `${iconSize}px`,
      }).setOrigin(0.5);
      container.add(icon);
    }

    // Label
    const labelSize = Math.max(9 * s, 11);
    const label = this.add.text(0, oh / 2 - labelSize * 0.8, obj.label, {
      fontSize: `${labelSize}px`,
      color: '#333',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(label);

    // Hit area
    const hitArea = this.add
      .rectangle(0, 0, ow + 4 * s, oh + 4 * s)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    hitArea.on('pointerdown', () => this.onObjectTap(obj));
    container.add(hitArea);

    this.roomContainer.add(container);
    this.objectSprites.set(obj.id, container);
  }

  // ─── Inspect Overlay ──────────────────────────────────

  private buildInspectOverlay() {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    this.overlayContainer = this.add.container(0, 0);
    this.overlayContainer.setDepth(100);
    this.overlayContainer.setVisible(false);

    this.inspectBg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6)
      .setInteractive();
    this.overlayContainer.add(this.inspectBg);

    // Text box
    const boxW = w * 0.8;
    const boxH = h * 0.3;
    const boxBg = this.add.graphics();
    boxBg.fillStyle(0xffffff, 0.95);
    boxBg.fillRoundedRect(w / 2 - boxW / 2, h / 2 - boxH / 2, boxW, boxH, 12 * s);
    this.overlayContainer.add(boxBg);

    this.inspectLabel = this.add.text(w / 2, h / 2 - 10 * s, '', {
      fontSize: `${16 * s}px`,
      color: '#1a1a1a',
      fontFamily: 'sans-serif',
      wordWrap: { width: boxW - 32 * s },
      align: 'center',
      lineSpacing: 6 * s,
    }).setOrigin(0.5);
    this.overlayContainer.add(this.inspectLabel);

    this.inspectClose = this.add.text(w / 2, h / 2 + boxH / 2 - 30 * s, '[ 닫기 ]', {
      fontSize: `${14 * s}px`,
      color: '#2563EB',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.inspectClose.on('pointerdown', () => this.closeInspect());
    this.overlayContainer.add(this.inspectClose);

    // Also close when tapping background
    this.inspectBg.on('pointerdown', () => this.closeInspect());
  }

  // ─── Interaction ──────────────────────────────────────

  private onObjectTap(obj: RoomObject) {
    if (this.phase !== 'playing') return;

    // Hidden objects can't be tapped
    if (obj.hidden && !this.isObjectVisible(obj)) return;

    this.moves++;

    switch (obj.kind) {
      case 'inspectable':
        this.handleInspect(obj);
        break;
      case 'collectible':
        this.handleCollect(obj);
        break;
      case 'usable':
        this.handleUsable(obj);
        break;
      case 'exit':
        this.handleExit(obj);
        break;
    }

    this.emitState();
  }

  private handleInspect(obj: RoomObject) {
    if (this.resolvedObjects.has(obj.id)) {
      this.showInspect(`이미 확인한 ${obj.label}이다.`);
      return;
    }
    this.resolvedObjects.add(obj.id);
    this.score += 10;
    this.showInspect(obj.inspectText ?? `${obj.label}을(를) 조사했다.`);
    this.pulseObject(obj.id);
    this.updateObjectVisibility();
    this.emitState();
  }

  private handleCollect(obj: RoomObject) {
    if (this.resolvedObjects.has(obj.id)) return;
    if (!obj.grantsItem) return;

    this.resolvedObjects.add(obj.id);
    this.inventory.add(obj.grantsItem);
    this.score += 25;

    const item = this.room.items.find((i) => i.id === obj.grantsItem);
    const itemLabel = item ? `${item.icon} ${item.label}` : obj.grantsItem;
    this.showInspect(`${itemLabel}을(를) 획득했다!`);

    // Hide collected object
    const sprite = this.objectSprites.get(obj.id);
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300,
        ease: 'Back.easeIn',
      });
    }

    this.updateObjectVisibility();
    this.emitState();
  }

  private handleUsable(obj: RoomObject) {
    if (this.resolvedObjects.has(obj.id)) {
      this.showInspect(`이미 사용한 ${obj.label}이다.`);
      return;
    }

    if (obj.requiresItem && !this.inventory.has(obj.requiresItem)) {
      this.showInspect(obj.inspectText ?? `${obj.label}에 무언가가 필요하다.`);
      this.shakeObject(obj.id);
      return;
    }

    // Use the required item
    if (obj.requiresItem) {
      this.inventory.delete(obj.requiresItem);
    }
    this.resolvedObjects.add(obj.id);
    this.score += 50;

    const item = obj.requiresItem
      ? this.room.items.find((i) => i.id === obj.requiresItem)
      : null;
    const itemLabel = item ? `${item.icon} ${item.label}` : '';
    this.showInspect(
      itemLabel
        ? `${itemLabel}을(를) 사용했다! ${obj.label}이(가) 열렸다.`
        : `${obj.label}을(를) 해결했다!`,
    );
    this.pulseObject(obj.id);
    this.updateObjectVisibility();
    this.emitState();
  }

  private handleExit(obj: RoomObject) {
    if (obj.requiresItem && !this.inventory.has(obj.requiresItem)) {
      this.showInspect('잠겨 있다. 열 수 있는 것이 필요하다.');
      this.shakeObject(obj.id);
      return;
    }

    // Stage clear!
    this.phase = 'cleared';
    this.score += 100;

    // Victory animation
    this.celebrateExit(obj);
  }

  // ─── Visibility ───────────────────────────────────────

  private isObjectVisible(obj: RoomObject): boolean {
    if (!obj.hidden) return true;
    if (!obj.prerequisite) return true;
    return this.resolvedObjects.has(obj.prerequisite);
  }

  private updateObjectVisibility() {
    for (const obj of this.room.objects) {
      const sprite = this.objectSprites.get(obj.id);
      if (!sprite) continue;

      if (obj.hidden) {
        const visible = this.isObjectVisible(obj);
        if (visible && !sprite.visible) {
          sprite.setVisible(true);
          sprite.setAlpha(0);
          sprite.setScale(0.5);
          this.tweens.add({
            targets: sprite,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut',
          });
        } else if (!visible) {
          sprite.setVisible(false);
        }
      }

      // Grey out resolved objects
      if (this.resolvedObjects.has(obj.id) && obj.kind !== 'exit') {
        sprite.setAlpha(Math.min(sprite.alpha, 0.4));
      }
    }
  }

  // ─── Inspect Modal ────────────────────────────────────

  private showInspect(text: string) {
    this.inspectText = text;
    this.inspectLabel.setText(text);
    this.overlayContainer.setVisible(true);
    this.phase = 'inspecting';
  }

  private closeInspect() {
    this.overlayContainer.setVisible(false);
    this.inspectText = null;
    if (this.phase === 'inspecting') {
      this.phase = 'playing';
    }
  }

  // ─── Visual Effects ───────────────────────────────────

  private pulseObject(id: string) {
    const sprite = this.objectSprites.get(id);
    if (!sprite) return;
    this.tweens.add({
      targets: sprite,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  private shakeObject(id: string) {
    const sprite = this.objectSprites.get(id);
    if (!sprite) return;
    const origX = sprite.x;
    this.tweens.add({
      targets: sprite,
      x: origX + 6 * this.dpr,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => { sprite.x = origX; },
    });
  }

  private celebrateExit(obj: RoomObject) {
    const w = DEFAULT_WIDTH * this.dpr;
    const h = DEFAULT_HEIGHT * this.dpr;
    const s = this.dpr;

    // Flash the door green
    const sprite = this.objectSprites.get(obj.id);
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 400,
        ease: 'Back.easeOut',
      });
    }

    // Confetti
    const colors = [0x22c55e, 0x3b82f6, 0xeab308, 0xef4444, 0xa855f7];
    for (let i = 0; i < 25; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (3 + Math.random() * 5) * s;
      const p = this.add.rectangle(
        w / 2 + (Math.random() - 0.5) * 40 * s,
        h * 0.4,
        size,
        size * 1.5,
        color,
      );
      p.setDepth(200);
      p.setRotation(Math.random() * Math.PI);
      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * w * 0.8,
        y: p.y + (Math.random() - 0.5) * h * 0.5,
        rotation: p.rotation + (Math.random() - 0.5) * 4,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    // Emit stage clear after delay
    this.time.delayedCall(1200, () => {
      this.game.events.emit('stage-clear', {
        score: this.score,
        moves: this.moves,
        stage: this.config.stage ?? 1,
      });
    });
  }

  // ─── Public API ───────────────────────────────────────

  public restart() {
    this.scene.restart({ config: this.config, dpr: this.dpr });
  }

  public getInventory(): string[] {
    return Array.from(this.inventory);
  }

  public getInventoryItems(): { id: string; label: string; icon: string }[] {
    return this.room.items.filter((item) => this.inventory.has(item.id));
  }

  // ─── Events ───────────────────────────────────────────

  private emitState() {
    this.game.events.emit('score-update', { score: this.score });
    this.game.events.emit('moves-update', { moves: this.moves });
    this.game.events.emit('inventory-update', {
      items: this.getInventoryItems(),
    });
  }
}
