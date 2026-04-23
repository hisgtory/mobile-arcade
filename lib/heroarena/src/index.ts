import { HeroArenaGame } from './game';
import { HeroDef } from './types';

export * from './types';
export * from './game';
export * from './logic/constants';

export function createGame(container: HTMLElement, options: { hero: HeroDef }) {
  return new HeroArenaGame(container, options.hero);
}

export function destroyGame(game: HeroArenaGame) {
  game.destroy();
}
