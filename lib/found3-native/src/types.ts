/**
 * found3-react type definitions
 * Copied from lib/found3/src/types.ts — Phaser-free
 */

/** Unique identifier for a tile type (e.g., emoji index) */
export type TileType = number;

/** Unique instance ID for each tile on the board */
export type TileId = string;

/** Data for a single tile */
export interface TileData {
  id: TileId;
  type: TileType;
  /** Grid column */
  col: number;
  /** Grid row */
  row: number;
  /** Layer (0 = bottom). MVP uses layer 0 only */
  layer: number;
}

/** Stage configuration */
export interface StageConfig {
  /** Stage number (1-based) */
  stage: number;
  /** Number of distinct tile types */
  typeCount: number;
  /** Total tile count (typeCount * 3) */
  tileCount: number;
  /** Number of layers (MVP: 1) */
  layers: number;
  /** Time limit in seconds */
  timeLimit: number;
  /** Grid columns */
  cols: number;
  /** Grid rows */
  rows: number;
}

/** Slot item: a tile sitting in the slot bar */
export interface SlotItem {
  id: TileId;
  type: TileType;
}

/** Overall game state */
export enum GamePhase {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  CLEAR = 'CLEAR',
  GAME_OVER = 'GAME_OVER',
}

/** Runtime game state */
export interface GameState {
  phase: GamePhase;
  stage: number;
  score: number;
  combo: number;
  remainingTiles: number;
  totalTiles: number;
  timeLeft: number;
  elapsedMs: number;
  slotItems: SlotItem[];
}

/** Item counts for power-ups */
export interface ItemCounts {
  shuffle: number;
  undo: number;
  expand: number;
}

/** Default item counts per game */
export const DEFAULT_ITEM_COUNTS: ItemCounts = {
  shuffle: 3,
  undo: 3,
  expand: 3,
};

/** Undo history entry */
export interface UndoEntry {
  slotItem: SlotItem;
  tileData: TileData;
}

/** Base slot capacity */
export const MAX_SLOT = 7;

/** @deprecated Use TILE_IMAGES instead */
export const TILE_EMOJIS: string[] = [
  '\u{1F33B}', // sunflower
  '\u{1F338}', // cherry blossom
  '\u{1F33A}', // hibiscus
  '\u{1F34E}', // red apple
  '\u{1F352}', // cherries
  '\u{1F353}', // strawberry
  '\u{1F347}', // grapes
  '\u{1F34A}', // tangerine
  '\u{1F34B}', // lemon
  '\u{1F349}', // watermelon
  '\u{1F351}', // peach
  '\u{1F350}', // pear
];

/** Tile image asset keys */
export const TILE_IMAGES: string[] = [
  'apple',
  'banana',
  'cherry',
  'grape',
  'kiwi',
  'lemon',
  'orange',
  'peach',
  'pear',
  'pineapple',
  'strawberry',
  'watermelon',
  'mangosteen',
  'pomegranate',
];

/** Pastel background colors corresponding to tile types */
export const TILE_COLORS: string[] = [
  '#ffcccc', // apple
  '#fff9c4', // banana
  '#ffcdd2', // cherry
  '#e1bee7', // grape
  '#dcedc8', // kiwi
  '#fff59d', // lemon
  '#ffe0b2', // orange
  '#f8bbd0', // peach
  '#f0f4c3', // pear
  '#fff9c4', // pineapple
  '#ffcdd2', // strawberry
  '#c8e6c9', // watermelon
  '#e1bee7', // mangosteen
  '#ffcdd2', // pomegranate
];

/** Haptic callback type */
export type HapticFn = (event: string) => void;
