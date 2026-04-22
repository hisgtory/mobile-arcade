/**
 * Tile game object for CandyPop Forest
 *
 * Phaser Container with forest-themed background + pixel art fruit icon.
 */

import Phaser from 'phaser';
import { TILE_IMAGES, type TileType } from '../types';

// Forest-themed soft pastel backgrounds for tile types
const TILE_COLORS: number[] = [
  0xffe0e0, // apple — soft red
  0xffc8c8, // strawberry — pink
  0xffddb0, // orange — soft orange
  0xe0d0f0, // grape — lavender
  0xf8c0c0, // cherry — rose
  0xc8d8f0, // blueberry — soft blue
  0xffd8c0, // peach — soft peach
  0xd0f0d0, // kiwi — soft green
  0xfff0b0, // lemon — soft yellow
  0xd0f0d8, // watermelon — mint
];

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

    // Forest-themed colored background
    const bgColor = TILE_COLORS[type % TILE_COLORS.length];
    this.bg = scene.add.rectangle(0, 0, size - 2, size - 2, bgColor, 1);
    this.bg.setStrokeStyle(1, 0xd1d5db, 0.6);

    // Rounded corners effect via smaller radius
    this.add(this.bg);

    // Icon
    const imageKey = TILE_IMAGES[type % TILE_IMAGES.length];
    this.icon = scene.add.image(0, 0, imageKey);
    const iconSize = Math.min(size * 0.7, 38);
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
    const bgColor = TILE_COLORS[type % TILE_COLORS.length];
    this.bg.setFillStyle(bgColor, 1);
  }

  animateDestroy(onComplete: () => void): void {
    // "Pop" effect — scale up briefly then shrink
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 150,
          ease: 'Back.easeIn',
          onComplete,
        });
      },
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
