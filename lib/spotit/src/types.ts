/**
 * SpotIt — Hidden Object Game type definitions
 *
 * Players must find specific target items scattered across a cluttered board.
 */

export type ItemType = number;

export interface ItemData {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  isTarget: boolean;
  found: boolean;
}

export interface StageConfig {
  stage: number;
  /** Total items on the board (targets + distractors) */
  totalItems: number;
  /** Number of target items to find */
  targetCount: number;
  /** Number of distinct item types used */
  typeCount: number;
  /** Grid columns */
  cols: number;
  /** Grid rows */
  rows: number;
  /** Time limit in seconds (0 = no limit) */
  timeLimit: number;
}

export interface GameConfig {
  stage?: number;
  assetBaseUrl?: string;
  onClear?: () => void;
  onGameOver?: () => void;
}

export enum GamePhase {
  IDLE = 'idle',
  PLAYING = 'playing',
  ANIMATING = 'animating',
  CLEAR = 'clear',
  GAME_OVER = 'game_over',
}

/** All available item images (pixel-art food tiles) */
export const ITEM_IMAGES: string[] = [
  'fruit_apple',
  'fruit_banana',
  'fruit_cherry',
  'fruit_orange',
  'fruit_strawberry',
  'fruit_watermelon',
  'fruit_grape_red',
  'fruit_kiwi',
  'fruit_lemon',
  'fruit_peach',
  'cake_strawberry',
  'cake_chocolate',
  'cake_cheese',
  'pastry_croissant',
  'pastry_pretzel',
  'icecream_1scoop',
  'icecream_3scoops',
  'boba_matcha',
  'boba_strawberry',
  'coffee_espresso',
  'onigiri_1',
  'onigiri_2',
  'popsicle_pink',
  'popsicle_blue',
  'eggs_fried',
  'vegetable_carrot',
  'vegetable_corn',
  'vegetable_tomato',
  'cheese_gouda',
  'soda_coke',
];

export const ITEM_COLORS: string[] = [
  '#FF6B6B', '#FFD93D', '#C0392B', '#F39C12', '#E74C3C',
  '#2ECC71', '#8E44AD', '#1ABC9C', '#F1C40F', '#E67E22',
  '#FF69B4', '#8B4513', '#FFD700', '#D2691E', '#DEB887',
  '#87CEEB', '#FF1493', '#9370DB', '#FFB6C1', '#4682B4',
  '#F5DEB3', '#FFA07A', '#FF6EB4', '#4169E1', '#FFDEAD',
  '#FF7F50', '#FFD700', '#FF4500', '#DAA520', '#DC143C',
];
