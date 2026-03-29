/**
 * Tile game object for Puzzle3Go
 *
 * Renders 화투 tiles as emoji text on colored tile backgrounds.
 */

import Phaser from 'phaser';
import { HWATU_TILES, type TileType } from '../types';

/** Background colors for each 화투 tile type */
const TILE_COLORS: number[] = [
  0xfce4ec,  // 1월 핑크
  0xe8f5e9,  // 2월 연초록
  0xf3e5f5,  // 3월 연보라
  0xfff3e0,  // 4월 연주황
  0xe0f2f1,  // 5월 연청록
  0xfff9c4,  // 6월 연노랑
  0xefebe9,  // 7월 연갈색
  0xe3f2fd,  // 8월 연파랑
  0xfbe9e7,  // 9월 연살구
  0xffe0b2,  // 10월 연오렌지
];

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

    // Background with 화투-themed color
    const bgColor = TILE_COLORS[type % TILE_COLORS.length];
    this.bg = scene.add.rectangle(0, 0, size - 2, size - 2, bgColor, 1);
    this.bg.setStrokeStyle(1, 0xbdbdbd, 0.8);
    this.add(this.bg);

    // Emoji icon
    const emoji = HWATU_TILES[type % HWATU_TILES.length];
    const fontSize = Math.floor(size * 0.5);
    this.icon = scene.add.text(0, 0, emoji, {
      fontSize: `${fontSize}px`,
    }).setOrigin(0.5);
    this.add(this.icon);

    this.setSize(size, size);
    this.setInteractive();
    scene.add.existing(this);
  }

  updateType(type: TileType): void {
    this.tileType = type;
    const emoji = HWATU_TILES[type % HWATU_TILES.length];
    this.icon.setText(emoji);
    const bgColor = TILE_COLORS[type % TILE_COLORS.length];
    this.bg.setFillStyle(bgColor, 1);
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
