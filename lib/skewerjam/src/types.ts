// ─── Constants ───────────────────────────────────────────
export const SKEWER_CAPACITY = 4;
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Food Items ─────────────────────────────────────────
/** Each food type has a display name and a tile image filename (without .png). */
export interface FoodType {
  name: string;
  tile: string;
}

export const FOOD_TYPES: readonly FoodType[] = [
  { name: 'Apple', tile: 'fruit_apple' },
  { name: 'Strawberry', tile: 'fruit_strawberry' },
  { name: 'Orange', tile: 'fruit_orange' },
  { name: 'Grape', tile: 'fruit_grape_red' },
  { name: 'Cherry', tile: 'fruit_cherry' },
  { name: 'Banana', tile: 'fruit_banana' },
  { name: 'Watermelon', tile: 'fruit_watermelon' },
  { name: 'Kiwi', tile: 'fruit_kiwi' },
  { name: 'Peach', tile: 'fruit_peach' },
  { name: 'Lemon', tile: 'fruit_lemon' },
  { name: 'Blueberry', tile: 'fruit_blueberry' },
  { name: 'Lime', tile: 'fruit_lime' },
] as const;

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  numFoods: number;
  emptySkewers: number;
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, numFoods: 3, emptySkewers: 2 },
    { stage: 2, numFoods: 4, emptySkewers: 2 },
    { stage: 3, numFoods: 5, emptySkewers: 2 },
    { stage: 4, numFoods: 6, emptySkewers: 2 },
    { stage: 5, numFoods: 7, emptySkewers: 2 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 5: scale up foods, cap at 12
  const numFoods = Math.min(7 + (stage - 5), 12);
  return { stage, numFoods, emptySkewers: 2 };
}

// ─── Game Types ──────────────────────────────────────────
/** A skewer is an array of food indices (0-based). Index 0 = bottom (handle-end). */
export type Skewer = number[];

export interface BoardState {
  skewers: Skewer[];
  numFoods: number;
}

export interface GameConfig {
  stage?: number;
}

export interface MoveAction {
  from: number;
  to: number;
  count: number;
}
