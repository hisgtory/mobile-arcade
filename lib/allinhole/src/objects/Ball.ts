/**
 * Ball game object for All in Hole
 *
 * Phaser Container with colored circle.
 */

import Phaser from 'phaser';
import { BALL_COLORS, type BallColor } from '../types';

export class Ball extends Phaser.GameObjects.Container {
  public ballId: number;
  public ballColor: BallColor;
  public gridRow: number;
  public gridCol: number;
  private circle: Phaser.GameObjects.Ellipse;
  private highlight: Phaser.GameObjects.Ellipse;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: number,
    color: BallColor,
    row: number,
    col: number,
    size: number,
  ) {
    super(scene, x, y);

    this.ballId = id;
    this.ballColor = color;
    this.gridRow = row;
    this.gridCol = col;

    const radius = size * 0.38;
    const colorHex = Phaser.Display.Color.HexStringToColor(BALL_COLORS[color % BALL_COLORS.length]).color;

    // Main circle
    this.circle = scene.add.ellipse(0, 0, radius * 2, radius * 2, colorHex, 1);
    this.add(this.circle);

    // Highlight (glossy effect)
    this.highlight = scene.add.ellipse(-radius * 0.25, -radius * 0.25, radius * 0.6, radius * 0.6, 0xffffff, 0.35);
    this.add(this.highlight);

    this.setSize(size, size);
    scene.add.existing(this);
  }

  animateMoveTo(x: number, y: number, duration: number, onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration,
      ease: 'Power2',
      onComplete,
    });
  }

  animateSink(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn',
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
