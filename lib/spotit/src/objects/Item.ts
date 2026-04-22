/**
 * Item game object for SpotIt
 *
 * Phaser Container with background + pixel art icon.
 */

import Phaser from 'phaser';
import { ITEM_IMAGES, type ItemType } from '../types';

export class Item extends Phaser.GameObjects.Container {
  public itemType: ItemType;
  public itemId: string;
  public isTarget: boolean;
  public found: boolean = false;
  private bg: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Image;
  private checkMark?: Phaser.GameObjects.Text;
  private cellSize: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: ItemType,
    itemId: string,
    isTarget: boolean,
    size: number,
    dpr: number,
  ) {
    super(scene, x, y);

    this.itemType = type;
    this.itemId = itemId;
    this.isTarget = isTarget;
    this.cellSize = size;

    // Background
    this.bg = scene.add.rectangle(0, 0, size - 3, size - 3, 0xffffff, 1);
    this.bg.setStrokeStyle(1, 0xe5e7eb, 0.6);
    this.bg.setOrigin(0.5);
    this.add(this.bg);

    // Icon
    const imageKey = ITEM_IMAGES[type % ITEM_IMAGES.length];
    this.icon = scene.add.image(0, 0, imageKey);
    const iconSize = Math.min(size * 0.7, 48 * dpr);
    this.icon.setDisplaySize(iconSize, iconSize);
    this.add(this.icon);

    this.setSize(size, size);
    this.setInteractive();
    scene.add.existing(this);
  }

  /** Mark this item as found with a check mark animation */
  markFound(): void {
    this.found = true;
    this.bg.setFillStyle(0xd1fae5, 1); // light green
    this.bg.setStrokeStyle(2, 0x10b981, 1);

    this.checkMark = this.scene.add.text(0, 0, '✓', {
      fontSize: `${Math.round(this.cellSize * 0.5)}px`,
      fontFamily: 'sans-serif',
      color: '#059669',
    });
    this.checkMark.setOrigin(0.5);
    this.add(this.checkMark);

    // Animate
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /** Wrong tap animation (shake) */
  animateWrong(): void {
    this.bg.setFillStyle(0xfee2e2, 1); // light red flash
    this.scene.tweens.add({
      targets: this,
      x: this.x - 4,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.bg.setFillStyle(0xffffff, 1);
      },
    });
  }

  /** Hint animation — pulse glow */
  animateHint(): void {
    this.bg.setFillStyle(0xfef9c3, 1); // light yellow
    this.bg.setStrokeStyle(2, 0xfbbf24, 1);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      ease: 'Sine.easeInOut',
      repeat: 1,
      onComplete: () => {
        if (!this.found) {
          this.bg.setFillStyle(0xffffff, 1);
          this.bg.setStrokeStyle(1, 0xe5e7eb, 0.6);
        }
      },
    });
  }

  animateSpawn(): void {
    this.setScale(0);
    this.setAlpha(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }
}
