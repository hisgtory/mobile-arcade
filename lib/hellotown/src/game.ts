/**
 * Phaser Game factory for HelloTown
 */

import Phaser from 'phaser';
import { PlayScene } from './scenes/PlayScene';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT, type GameConfig } from './types';

export function createGame(parent: HTMLElement, config?: GameConfig): Phaser.Game {
  const startStage = config?.stage ?? 1;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DEFAULT_WIDTH * dpr,
    height: DEFAULT_HEIGHT * dpr,
    backgroundColor: '#F5F0EB',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DEFAULT_WIDTH * dpr,
      height: DEFAULT_HEIGHT * dpr,
    },
    render: {
      antialias: true,
      roundPixels: true,
    },
    scene: [PlayScene],
  });

  (game as any).__hellotownConfig = config;
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
