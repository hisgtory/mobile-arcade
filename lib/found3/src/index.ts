/**
 * @arcade/lib-found3
 *
 * Public API for the found3 game core.
 *
 * Phaser handles tile board rendering only.
 * React handles UI (HUD, slot bar, item bar, title, clear screens).
 *
 * Usage:
 *   import { createGame, destroyGame, getPlayScene } from '@arcade/lib-found3';
 *   const game = createGame(document.getElementById('game')!, { stage: 1 });
 *   game.events.on('tile-selected', (data) => { ... });
 *   getPlayScene(game)?.doShuffle();
 */

export { createGame, destroyGame, getPlayScene } from './game';
export { PlayScene } from './scenes/PlayScene';
export type { GameConfig, TileData, StageConfig, SlotItem, GamePhase, ItemCounts, UndoEntry } from './types';
export { MAX_SLOT, TILE_EMOJIS, TILE_IMAGES, TILE_COLORS, DEFAULT_ITEM_COUNTS } from './types';

// Bridge protocol
export { BridgeClient, DEFAULT_BRIDGE_GAME_STATE, RESPONSE_TYPE_MAP } from './bridge';
export type {
  BridgeMessage,
  BridgeResponse,
  BridgeRequestType,
  BridgeResponseType,
  BridgeGameState,
  BridgeLeaderboardEntry,
  BridgeClientConfig,
  HapticStyle,
} from './bridge';
