/**
 * DreamStore game type definitions
 */

export type ProductType = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface CustomerOrder {
  /** Items the customer wants */
  items: ProductType[];
  /** Which items have been fulfilled */
  fulfilled: boolean[];
}

export interface StageConfig {
  stage: number;
  /** Number of distinct product types on grid */
  productTypes: number;
  /** Grid rows */
  rows: number;
  /** Grid cols */
  cols: number;
  /** Total customers to serve */
  customerCount: number;
  /** Items per customer order */
  orderSize: number;
  /** Time limit in seconds */
  timeLimit: number;
}

export interface GameConfig {
  stage?: number;
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

// Store product images — cute food & drink items
export const PRODUCT_IMAGES: string[] = [
  'cake_strawberry',
  'boba_matcha',
  'coffee_espresso',
  'pastry_croissant',
  'icecream_1scoop',
  'popsicle_pink',
  'cake_chocolate',
  'boba_strawberry',
  'cake_matcha',
  'icecream_2scoops',
];

export const PRODUCT_EMOJIS: string[] = [
  '🍰', '🍵', '☕', '🥐', '🍦', '🍧', '🍫', '🧋', '🍵', '🍨'
];
