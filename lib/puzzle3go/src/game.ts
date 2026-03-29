/**
 * Phaser Game factory for Puzzle3Go
 */

import Phaser from 'phaser';
import { PlayScene } from './scenes/PlayScene';
import type { GameConfig } from './types';

const DEFAULT_WIDTH = 390;
const DEFAULT_HEIGHT = 560;

export function createGame(parent: HTMLElement, config?: GameConfig): Phaser.Game {
  const startStage = config?.stage ?? 1;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DEFAULT_WIDTH * dpr,
    height: DEFAULT_HEIGHT * dpr,
    backgroundColor: '#faf3e0',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DEFAULT_WIDTH * dpr,
      height: DEFAULT_HEIGHT * dpr,
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: true,
    },
    scene: [PlayScene],
  });

  (game as any).__puzzle3goConfig = config;
  (game as any).__dpr = dpr;

  game.scene.start('PlayScene', { stage: startStage });

  return game;
}

export function destroyGame(game: Phaser.Game): void {
  game.destroy(true);
}

export function getPlayScene(game: Phaser.Game): PlayScene | null {
  return (game.scene.getScene('PlayScene') as PlayScene) ?? null;
}
