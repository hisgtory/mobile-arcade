import Phaser from 'phaser';
import { PlayScene } from './scenes/PlayScene';
import type { GameConfig } from './types';

const DEFAULT_WIDTH = 390;
const DEFAULT_HEIGHT = 560;

export function createGame(parent: HTMLElement, config?: GameConfig): Phaser.Game {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DEFAULT_WIDTH * dpr,
    height: DEFAULT_HEIGHT * dpr,
    backgroundColor: '#0f172a',
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
    scene: [],
  });

  game.scene.add('PlayScene', PlayScene);
  (game as any).__starrynightConfig = config;
  (game as any).__dpr = dpr;
  game.scene.start('PlayScene', { gameConfig: config });

  return game;
}

export function destroyGame(game: Phaser.Game): void {
  game.destroy(true);
}
