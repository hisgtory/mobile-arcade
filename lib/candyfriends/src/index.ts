// TODO: Commonize logic with crunch3 (board, PlayScene, useGame) and inject config
export { createGame, destroyGame, getPlayScene } from './game';
export { getStageConfig } from './logic/stage';
export type { GameConfig, StageConfig, TileType, CellPos, GamePhase } from './types';
