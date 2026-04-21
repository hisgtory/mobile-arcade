import Phaser from 'phaser';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT, type GameConfig } from './types';
import { PlayScene } from './scenes/PlayScene';

export function createGame(
  parent: HTMLElement,
  config?: GameConfig,
): Phaser.Game {
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
    },
    render: { antialias: true, roundPixels: true },
    scene: [],
  });

  game.registry.set('caroutConfig', config);
  game.registry.set('dpr', dpr);

  game.scene.add('PlayScene', PlayScene);
  game.scene.start('PlayScene', { stage: config?.stage ?? 1 });

  return game;
}

export function destroyGame(game: Phaser.Game) {
  game.destroy(true);
}

export function getPlayScene(game: Phaser.Game): PlayScene | null {
  return game.scene.getScene('PlayScene') as PlayScene | null;
}
