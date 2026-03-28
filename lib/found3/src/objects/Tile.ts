/**
 * Tile game object for found3
 *
 * A visual tile on the board. Container with a colored rectangle + pixel-art image.
 * Supports multi-layer rendering with depth, shadows, and selectable state visuals.
 */

import Phaser from 'phaser';
import { TileData, TILE_IMAGES, TILE_COLORS } from '../types';

export class Tile extends Phaser.GameObjects.Container {
  public tileData: TileData;
  private bg: Phaser.GameObjects.Rectangle;
  private shadow: Phaser.GameObjects.Rectangle | null = null;
  private icon: Phaser.GameObjects.Image;
  private _isSelectable: boolean = true;
  private _tileSize: number;

  constructor(scene: Phaser.Scene, x: number, y: number, data: TileData, size: number) {
    super(scene, x, y);

    this.tileData = data;
    this._tileSize = size;

    const color = TILE_COLORS[data.type % TILE_COLORS.length];
    const imageKey = TILE_IMAGES[data.type % TILE_IMAGES.length];

    // Shadow for upper layers (layer >= 1)
    if (data.layer > 0) {
      const shadowOffset = 3 * data.layer;
      this.shadow = scene.add.rectangle(
        shadowOffset,
        shadowOffset,
        size - 4,
        size - 4,
        0xaaaaaa,
        0.25,
      );
      this.add(this.shadow);
    }

    // Background rounded rect (pastel tone)
    this.bg = scene.add.rectangle(0, 0, size - 4, size - 4, color, 1);
    this.bg.setStrokeStyle(2, 0xcccccc, 0.6);
    this.add(this.bg);

    // Pixel-art image icon — fixed display size regardless of tile size
    const dpr = (scene.game as any).__dpr || 1;
    const iconSize = 40 * dpr; // consistent icon size
    this.icon = scene.add.image(0, 0, imageKey);
    this.icon.setDisplaySize(Math.min(iconSize, size * 0.75), Math.min(iconSize, size * 0.75));
    this.add(this.icon);

    // Set depth based on layer (higher layer = rendered on top)
    this.setDepth(data.layer * 10);

    // Make interactive
    this.setSize(size - 4, size - 4);
    this.setInteractive({ useHandCursor: true });

    // Hover effect
    this.on('pointerover', () => {
      if (this._isSelectable) {
        this.setScale(1.08);
      }
    });
    this.on('pointerout', () => {
      this.setScale(1.0);
    });

    scene.add.existing(this);
  }

  get isSelectable(): boolean {
    return this._isSelectable;
  }

  get tileSize(): number {
    return this._tileSize;
  }

  setSelectable(selectable: boolean): void {
    this._isSelectable = selectable;
    // No dimming — all tiles stay fully visible regardless of selectability
    // Only interaction is blocked for non-selectable tiles
    this.setAlpha(1.0);
    this.bg.setStrokeStyle(2, 0xcccccc, 0.6);
  }

  /** Update visual appearance when tile type changes (e.g., after shuffle) */
  updateVisual(): void {
    const color = TILE_COLORS[this.tileData.type % TILE_COLORS.length];
    const imageKey = TILE_IMAGES[this.tileData.type % TILE_IMAGES.length];
    this.bg.setFillStyle(color, 1);
    this.icon.setTexture(imageKey);
  }

  /** Animate tile being selected (shrink and fade out) */
  animateSelect(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.3,
      scaleY: 0.3,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        onComplete?.();
      },
    });
  }
}
