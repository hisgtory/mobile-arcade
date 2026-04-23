export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

export const CATEGORIES = [
  { name: 'Books', emoji: '📚', color: '#3B82F6' },
  { name: 'Clothes', emoji: '👕', color: '#EC4899' },
  { name: 'Food', emoji: '🍎', color: '#22C55E' },
  { name: 'Toys', emoji: '🧸', color: '#EAB308' },
  { name: 'Music', emoji: '🎵', color: '#A855F7' },
  { name: 'Sports', emoji: '🏀', color: '#F97316' },
  { name: 'Medicine', emoji: '💊', color: '#EF4444' },
  { name: 'Tools', emoji: '🔧', color: '#6B7280' },
  { name: 'Plants', emoji: '🌸', color: '#84CC16' },
  { name: 'Art', emoji: '🎨', color: '#06B6D4' },
  { name: 'Stationery', emoji: '✏️', color: '#6366F1' },
  { name: 'Cleaning', emoji: '🧹', color: '#F43F5E' },
] as const;

export interface StageConfig {
  stage: number;
  numCategories: number;
  itemsPerCategory: number;
  timeLimit: number;
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, numCategories: 3, itemsPerCategory: 3, timeLimit: 60 },
    { stage: 2, numCategories: 4, itemsPerCategory: 3, timeLimit: 90 },
    { stage: 3, numCategories: 5, itemsPerCategory: 3, timeLimit: 90 },
    { stage: 4, numCategories: 6, itemsPerCategory: 3, timeLimit: 120 },
    { stage: 5, numCategories: 7, itemsPerCategory: 3, timeLimit: 120 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  const numCategories = Math.min(7 + (stage - 5), 12);
  return { stage, numCategories, itemsPerCategory: 3, timeLimit: 120 };
}

export interface ItemState {
  id: number;
  category: number;
  x: number;
  y: number;
  shelved: boolean;
}

export interface ShelfState {
  category: number;
  items: number[];
  capacity: number;
}

export interface BoardState {
  items: ItemState[];
  shelves: ShelfState[];
  numCategories: number;
}

export interface GameConfig {
  stage?: number;
}

export interface PlaceMove {
  itemId: number;
  shelfCategory: number;
  correct: boolean;
}
