/**
 * found3 game type definitions
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

/** Runtime game state tracked in PlayScene */
export interface GameState {
  phase: GamePhase;
  stage: number;
  score: number;
  combo: number;
  remainingTiles: number;
  timeLeft: number;
  slotItems: SlotItem[];
}

/** Item counts for power-ups */
export interface ItemCounts {
  shuffle: number;
  undo: number;
  magnet: number;
}

/** Default item counts per game */
export const DEFAULT_ITEM_COUNTS: ItemCounts = {
  shuffle: 1,
  undo: 1,
  magnet: 1,
};

/** Undo history entry: remembers a tile that was moved to the slot */
export interface UndoEntry {
  slotItem: SlotItem;
  tileData: TileData;
  x: number;
  y: number;
}

/** Config passed when creating the Phaser game */
export interface GameConfig {
  stage?: number;
  onClear?: () => void;
  onGameOver?: () => void;
}

/** Max slot capacity */
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

/** Tile image asset keys — visually distinct pixel-art icons (16x16 PNGs) */
export const TILE_IMAGES: string[] = [
  'fruit_apple',
  'fruit_watermelon',
  'fruit_grape_red',
  'fruit_strawberry',
  'fruit_banana',
  'fruit_orange',
  'cake_chocolate',
  'cake_strawberry',
  'pastry_croissant',
  'onigiri_1',
  'icecream_3scoops',
  'soda_coke',
  'coffee_espresso',
  'popsicle_red',
  'eggs_fried',
];

/** Pastel background colors corresponding to tile types */
export const TILE_COLORS: number[] = [
  0xffcccc, // soft red (apple)
  0xc8e6c9, // soft green (watermelon)
  0xe1bee7, // soft purple (grape)
  0xffcdd2, // soft pink (strawberry)
  0xfff9c4, // soft yellow (banana)
  0xffe0b2, // soft orange (orange)
  0xd7ccc8, // soft brown (chocolate cake)
  0xf8bbd0, // rose (strawberry cake)
  0xffe8d6, // warm beige (croissant)
  0xe8eaf6, // soft lavender (onigiri)
  0xb3e5fc, // sky blue (ice cream)
  0xd4e157, // lime (soda)
  0xbcaaa4, // mocha (coffee)
  0xef9a9a, // coral (popsicle)
  0xfff59d, // light yellow (eggs)
];
