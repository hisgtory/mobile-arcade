/**
 * Tile game object for Anipang3
 *
 * Phaser Container with background + pixel art icon.
 */

import Phaser from 'phaser';
import { TILE_IMAGES, type TileType } from '../types';

export class Tile extends Phaser.GameObjects.Container {
  public tileType: TileType;
  public gridRow: number;
  public gridCol: number;
  private bg: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Image;
  private tileSize: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: TileType,
    row: number,
    col: number,
    size: number,
  ) {
    super(scene, x, y);

    this.tileType = type;
    this.gridRow = row;
    this.gridCol = col;
    this.tileSize = size;

    // Background
    this.bg = scene.add.rectangle(0, 0, size - 2, size - 2, 0xffffff, 1);
    this.bg.setStrokeStyle(1, 0xe5e7eb, 0.8);
    this.add(this.bg);

    // Icon
    const imageKey = TILE_IMAGES[type % TILE_IMAGES.length];
    this.icon = scene.add.image(0, 0, imageKey);
    const iconSize = Math.min(size * 0.75, 40);
    this.icon.setDisplaySize(iconSize, iconSize);
    this.add(this.icon);

    this.setSize(size, size);
    this.setInteractive();
    scene.add.existing(this);
  }

  updateType(type: TileType): void {
    this.tileType = type;
    const imageKey = TILE_IMAGES[type % TILE_IMAGES.length];
    this.icon.setTexture(imageKey);
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

  animateSwap(x: number, y: number, onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: 200,
      ease: 'Quad.easeInOut',
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
}
