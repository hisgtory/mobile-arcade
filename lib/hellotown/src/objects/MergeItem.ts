/**
 * MergeItem game object for HelloTown
 *
 * Phaser Container with colored background + emoji text.
 */

import Phaser from 'phaser';
import { ITEM_LABELS, ITEM_BG_COLORS, ITEM_COLORS, type ItemLevel } from '../types';

export class MergeItem extends Phaser.GameObjects.Container {
  public itemLevel: ItemLevel;
  public gridRow: number;
  public gridCol: number;
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private levelBadge: Phaser.GameObjects.Text;
  private itemSize: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    level: ItemLevel,
    row: number,
    col: number,
    size: number,
  ) {
    super(scene, x, y);

    this.itemLevel = level;
    this.gridRow = row;
    this.gridCol = col;
    this.itemSize = size;

    const bgColor = ITEM_BG_COLORS[level % ITEM_BG_COLORS.length];
    const borderColor = ITEM_COLORS[level % ITEM_COLORS.length];

    // Background rounded rectangle
    this.bg = scene.add.rectangle(0, 0, size - 4, size - 4, bgColor, 1);
    this.bg.setStrokeStyle(2, borderColor, 1);
    this.add(this.bg);

    // Emoji label
    const fontSize = Math.max(Math.floor(size * 0.45), 16);
    this.label = scene.add.text(0, -2, ITEM_LABELS[level % ITEM_LABELS.length], {
      fontSize: `${fontSize}px`,
      align: 'center',
    });
    this.label.setOrigin(0.5, 0.5);
    this.add(this.label);

    // Level badge
    const badgeSize = Math.max(Math.floor(size * 0.18), 10);
    this.levelBadge = scene.add.text(
      size / 2 - 8,
      -size / 2 + 8,
      `${level + 1}`,
      {
        fontSize: `${badgeSize}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        backgroundColor: `#${borderColor.toString(16).padStart(6, '0')}`,
        padding: { x: 3, y: 1 },
        align: 'center',
      },
    );
    this.levelBadge.setOrigin(0.5, 0.5);
    this.add(this.levelBadge);

    this.setSize(size, size);
    this.setInteractive();
    scene.add.existing(this);
  }

  updateLevel(level: ItemLevel): void {
    this.itemLevel = level;
    const bgColor = ITEM_BG_COLORS[level % ITEM_BG_COLORS.length];
    const borderColor = ITEM_COLORS[level % ITEM_COLORS.length];

    this.bg.setFillStyle(bgColor, 1);
    this.bg.setStrokeStyle(2, borderColor, 1);
    this.label.setText(ITEM_LABELS[level % ITEM_LABELS.length]);
    this.levelBadge.setText(`${level + 1}`);
    this.levelBadge.setBackgroundColor(`#${borderColor.toString(16).padStart(6, '0')}`);
  }

  animateDestroy(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete,
    });
  }

  animateMoveTo(x: number, y: number, onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: 150,
      ease: 'Power2',
      onComplete,
    });
  }

  animateMerge(x: number, y: number, onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      scaleX: 0.3,
      scaleY: 0.3,
      alpha: 0.5,
      duration: 200,
      ease: 'Quad.easeIn',
      onComplete,
    });
  }

  animateLevelUp(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete,
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
      duration: 250,
      ease: 'Back.easeOut',
    });
  }

  animateSelect(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      ease: 'Quad.easeOut',
    });
  }

  animateDeselect(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Quad.easeOut',
    });
  }
}
