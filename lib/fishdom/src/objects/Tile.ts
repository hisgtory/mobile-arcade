/**
 * Tile game object for Fishdom
 *
 * Phaser Container with background + emoji text.
 */

import Phaser from 'phaser';
import { TILE_EMOJIS, type TileType } from '../types';

export class Tile extends Phaser.GameObjects.Container {
  public tileType: TileType;
  public gridRow: number;
  public gridCol: number;
  private bg: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Text;
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
    this.bg = scene.add.rectangle(0, 0, size - 2, size - 2, 0xe8f4fd, 1);
    this.bg.setStrokeStyle(1, 0xb3d9f2, 0.8);
    this.add(this.bg);

    // Emoji icon
    const emoji = TILE_EMOJIS[type % TILE_EMOJIS.length];
    const fontSize = Math.floor(size * 0.55);
    this.icon = scene.add.text(0, 0, emoji, {
      fontSize: `${fontSize}px`,
    });
    this.icon.setOrigin(0.5, 0.5);
    this.add(this.icon);

    this.setSize(size, size);
    this.setInteractive();
    scene.add.existing(this);
  }

  updateType(type: TileType): void {
    this.tileType = type;
    const emoji = TILE_EMOJIS[type % TILE_EMOJIS.length];
    this.icon.setText(emoji);
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
