/**
 * ProductTile game object for DreamStore
 *
 * Phaser Container with background + product icon.
 */

import Phaser from 'phaser';
import { PRODUCT_IMAGES, type ProductType } from '../types';

export class ProductTile extends Phaser.GameObjects.Container {
  public productType: ProductType;
  public gridRow: number;
  public gridCol: number;
  private bg: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Image;
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

    // Icon
    const imageKey = PRODUCT_IMAGES[type % PRODUCT_IMAGES.length];
    this.icon = scene.add.image(0, 0, imageKey);
    const iconSize = Math.min(size * 0.7, 40);
    this.icon.setDisplaySize(iconSize, iconSize);
    this.add(this.icon);

    this.setSize(size, size);
    this.setInteractive();
    scene.add.existing(this);
  }

  updateType(type: ProductType): void {
    this.productType = type;
    const imageKey = PRODUCT_IMAGES[type % PRODUCT_IMAGES.length];
    this.icon.setTexture(imageKey);
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
