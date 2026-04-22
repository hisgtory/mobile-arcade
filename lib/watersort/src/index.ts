export { createGame, destroyGame, getPlayScene } from './game';
export { getStageConfig, TUBE_CAPACITY, WATER_COLORS } from './types';
export type { GameConfig, StageConfig, Tube, BoardState, PourMove } from './types';

// Board logic — shared with getcolor and other sort-puzzle variants
export {
  createBoard,
  topCount,
  topColor,
  canPour,
  executePour,
  isTubeSolved,
  isWon,
  isSolvable,
} from './logic/board';
