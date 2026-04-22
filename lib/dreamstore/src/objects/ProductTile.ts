/**
 * ProductTile game object for DreamStore
 *
 * Phaser Container with background + product icon.
 */

import Phaser from 'phaser';
import { PRODUCT_IMAGES, PRODUCT_EMOJIS, type ProductType } from '../types';

export class ProductTile extends Phaser.GameObjects.Container {
  public productType: ProductType;
  public gridRow: number;
  public gridCol: number;
  private bg: Phaser.GameObjects.Rectangle;
  private icon?: Phaser.GameObjects.Image;
  private emojiText?: Phaser.GameObjects.Text;
  private tileSize: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: ProductType,
    row: number,
    col: number,
    size: number,
  ) {
    super(scene, x, y);

    this.productType = type;
    this.gridRow = row;
    this.gridCol = col;
    this.tileSize = size;

    // Background — soft rounded card
    this.bg = scene.add.rectangle(0, 0, size - 4, size - 4, 0xffffff, 1);
    this.bg.setStrokeStyle(1.5, 0xf9a8d4, 0.6);
    this.add(this.bg);

    // Icon (try Image, fallback to Emoji)
    const imageKey = PRODUCT_IMAGES[type % PRODUCT_IMAGES.length];
    const iconSize = Math.min(size * 0.7, 40);

    if (scene.textures.exists(imageKey)) {
      this.icon = scene.add.image(0, 0, imageKey);
      this.icon.setDisplaySize(iconSize, iconSize);
      this.add(this.icon);
    } else {
      const emoji = PRODUCT_EMOJIS[type % PRODUCT_EMOJIS.length];
      this.emojiText = scene.add.text(0, 0, emoji, {
        fontSize: `${Math.round(iconSize * 0.8)}px`,
      }).setOrigin(0.5);
      this.add(this.emojiText);
    }

    this.setSize(size, size);
    this.setInteractive();
    scene.add.existing(this);
  }

  updateType(type: ProductType): void {
    this.productType = type;
    const imageKey = PRODUCT_IMAGES[type % PRODUCT_IMAGES.length];
    
    if (this.icon && this.scene.textures.exists(imageKey)) {
      this.icon.setTexture(imageKey);
    } else if (this.emojiText) {
      this.emojiText.setText(PRODUCT_EMOJIS[type % PRODUCT_EMOJIS.length]);
    }
  }

  /** Highlight tile as matchable */
  highlight(): void {
    this.bg.setFillStyle(0xfff1f2, 1);
    this.bg.setStrokeStyle(2, 0xfb7185, 1);
  }

  /** Remove highlight */
  unhighlight(): void {
    this.bg.setFillStyle(0xffffff, 1);
    this.bg.setStrokeStyle(1.5, 0xf9a8d4, 0.6);
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

  animateBounce(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      ease: 'Quad.easeOut',
      yoyo: true,
    });
  }
}
