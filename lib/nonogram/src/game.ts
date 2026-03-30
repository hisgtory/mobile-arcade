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
      width: DEFAULT_WIDTH * dpr,
      height: DEFAULT_HEIGHT * dpr,
    },
    render: { antialias: true, roundPixels: true },
    scene: [],
  });

  game.registry.set('config', config);
  game.registry.set('dpr', dpr);
  game.scene.add('PlayScene', PlayScene, true);

  return game;
}

export function destroyGame(game: Phaser.Game): void {
  game.destroy(true);
}

export function getPlayScene(game: Phaser.Game): PlayScene | null {
  return (game.scene.getScene('PlayScene') as PlayScene) ?? null;
}
