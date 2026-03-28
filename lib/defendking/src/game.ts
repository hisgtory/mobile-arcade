import Phaser from 'phaser';
import { PlayScene } from './scenes/PlayScene';
import type { GameConfig, StageConfig } from './types';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from './types';

export function createGame(
  parent: HTMLElement,
  config?: GameConfig,
  stageConfig?: StageConfig,
): Phaser.Game {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

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
    scene: [PlayScene],
  });

  (game as any).__defendkingConfig = config;
  (game as any).__stageConfig = stageConfig;
  (game as any).__dpr = dpr;
  game.scene.start('PlayScene', { gameConfig: config, stageConfig });

  return game;
}

export function destroyGame(game: Phaser.Game): void {
  game.destroy(true);
}
