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
    backgroundColor: '#0f0f23',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: { antialias: true, roundPixels: true },
    scene: [PlayScene],
  });

  game.scene.start('PlayScene', { config, dpr });

  return game;
}

export function destroyGame(game: Phaser.Game) {
  game.destroy(true);
}

export function getPlayScene(game: Phaser.Game): PlayScene | null {
  return game.scene.getScene('PlayScene') as PlayScene | null;
}
