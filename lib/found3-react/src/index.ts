export { GameBoard } from './components/GameBoard';
export { TileGrid } from './components/TileGrid';
export { Tile } from './components/Tile';
export { SlotBar } from './components/SlotBar';

export type {
  TileData,
  TileType,
  TileId,
  SlotItem,
  StageConfig,
  GameState,
  ItemCounts,
  UndoEntry,
  HapticFn,
} from './types';
export { GamePhase, MAX_SLOT, TILE_EMOJIS, TILE_IMAGES, TILE_COLORS } from './types';

export { generateBoard, resetIdCounter, isTileBlocked } from './logic/board';
export { addToSlotAndMatch, undoLastSlotItem } from './logic/matcher';
export { getStageConfig, getMaxStage } from './logic/stage';
