import Phaser from 'phaser';
import { PlayScene } from './scenes/PlayScene';
import type { GameConfig } from './types';

const DEFAULT_WIDTH = 390;
const DEFAULT_HEIGHT = 700;

export function createGame(parent: HTMLElement, config?: GameConfig): Phaser.Game {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DEFAULT_WIDTH * dpr,
    height: DEFAULT_HEIGHT * dpr,
    backgroundColor: '#f0f2f5',
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

  (game as any).__blockcrushConfig = config;
  (game as any).__dpr = dpr;
  game.scene.start('PlayScene', { gameConfig: config });

  return game;
}

export function destroyGame(game: Phaser.Game): void {
  game.destroy(true);
}
