/**
 * Phaser Game factory for found3
 *
 * Creates and configures the Phaser.Game instance.
 * Phaser handles only the tile board; UI is rendered by React.
 */

import Phaser from 'phaser';
import { PlayScene } from './scenes/PlayScene';
import { GameConfig } from './types';

/** Default game dimensions (mobile portrait) */
const DEFAULT_WIDTH = 390;
const DEFAULT_HEIGHT = 560;

/**
 * Create a new Phaser Game instance for found3.
 *
 * @param parent - The HTML element to attach the game canvas to
 * @param config - Optional game config (stage number, callbacks)
 * @returns Phaser.Game instance
 */
export function createGame(
  parent: HTMLElement,
  config?: GameConfig,
): Phaser.Game {
  const startStage = config?.stage ?? 1;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  // Use parent dimensions for exact fit (no letterboxing)
  const parentW = parent.clientWidth || DEFAULT_WIDTH;
  const parentH = parent.clientHeight || DEFAULT_HEIGHT;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parentW * dpr,
    height: parentH * dpr,
    backgroundColor: '#f0f2f5',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
    },
    scene: [PlayScene],
  });

  // Store config so scenes can access callbacks
  (game as any).__found3Config = config;
  (game as any).__dpr = dpr;

  // Start PlayScene directly
  game.scene.start('PlayScene', { stage: startStage });

  return game;
}

/**
 * Destroy a found3 Phaser Game instance.
 *
 * @param game - The game instance to destroy
 */
export function destroyGame(game: Phaser.Game): void {
  game.destroy(true);
}

/**
 * Get the active PlayScene instance from a game.
 * Useful for calling public methods (doShuffle, doUndo, doMagnet).
 */
export function getPlayScene(game: Phaser.Game): PlayScene | null {
  return (game.scene.getScene('PlayScene') as PlayScene) ?? null;
}
