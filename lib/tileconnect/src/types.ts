export enum GamePhase {
  PLAYING = 'playing',
  ANIMATING = 'animating',
  CLEAR = 'clear',
  GAME_OVER = 'game_over',
}

export interface GameConfig {
  stage?: number;
  onClear?: () => void;
  onGameOver?: () => void;
}

export type TileType = number; // 0-11, matches TILE_IMAGES index

export interface TileData {
  type: TileType;
  row: number;
  col: number;
}

export interface StageConfig {
  stage: number;
  rows: number; // board rows (not counting border)
  cols: number; // board cols (not counting border)
  typeCount: number; // distinct tile types
  timeLimit: number; // seconds (0 = no limit)
}

export interface PathPoint {
  row: number;
  col: number;
}

// Reuse existing pixel food tile assets
export const TILE_IMAGES: string[] = [
  'fruit_apple',
  'fruit_watermelon',
  'fruit_grape_red',
  'fruit_banana',
  'fruit_strawberry',
  'fruit_orange',
  'fruit_cherry',
  'fruit_pear',
  'pastry_croissant',
  'icecream_1scoop',
  'onigiri_1',
  'soda_coke',
];

export const TILE_COLORS: number[] = [
  0xffcccc, 0xc8e6c9, 0xe1bee7, 0xfff9c4,
  0xffcdd2, 0xffe0b2, 0xf8bbd0, 0xdcedc8,
  0xd7ccc8, 0xb3e5fc, 0xf0f4c3, 0xfff59d,
];
