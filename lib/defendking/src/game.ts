import Phaser from 'phaser';
import { PlayScene } from './scenes/PlayScene';
import type { GameConfig, StageConfig } from './types';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from './types';

export function createGame(
  parent: HTMLElement,
  config?: GameConfig,
): Phaser.Game {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const startStage = config?.stage ?? 1;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DEFAULT_WIDTH * dpr,
    height: DEFAULT_HEIGHT * dpr,
    backgroundColor: '#87CEEB',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DEFAULT_WIDTH * dpr,
      height: DEFAULT_HEIGHT * dpr,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 1 },
        debug: false,
      },
    },
    render: {
      antialias: true,
      roundPixels: true,
    },
    scene: [],
  });

  game.registry.set('defendkingConfig', config);
  game.registry.set('dpr', dpr);

  game.scene.add('PlayScene', PlayScene);
  game.scene.start('PlayScene', { stage: startStage });

  return game;
}

export function destroyGame(game: Phaser.Game): void {
  game.destroy(true);
}
