/**
 * HelloTown merge game type definitions
 *
 * A merge game where players drag identical items together to create
 * higher-level items. Stage-based with target level goals.
 */

/** Item level (1-based). Merge two level-N items → one level-(N+1) item. */
export type ItemLevel = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface ItemData {
  level: ItemLevel;
  row: number;
  col: number;
}

export interface MergeResult {
  from: CellPos;
  to: CellPos;
  newLevel: ItemLevel;
}

export interface StageConfig {
  stage: number;
  /** Grid rows */
  rows: number;
  /** Grid cols */
  cols: number;
  /** Max moves allowed */
  maxMoves: number;
  /** Target: reach this item level to clear */
  targetLevel: number;
  /** Number of distinct starting item levels */
  startLevels: number;
  /** Initial item count to populate the board */
  initialItems: number;
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

/**
 * Merge items represented as emoji-style office/town themed items.
 * Level 0 = ☕ coffee, Level 1 = 📋 clipboard, Level 2 = 💼 briefcase, etc.
 * Each level shows progression from intern to CEO.
 */
export const ITEM_LABELS: string[] = [
  '☕',   // Level 0: Coffee
  '📋',   // Level 1: Clipboard
  '💼',   // Level 2: Briefcase
  '💻',   // Level 3: Laptop
  '📊',   // Level 4: Chart
  '🏆',   // Level 5: Trophy
  '👔',   // Level 6: Suit
  '🏢',   // Level 7: Office Building
  '🌆',   // Level 8: City
  '🌟',   // Level 9: Star
];

export const ITEM_COLORS: number[] = [
  0x8B4513,  // Coffee brown
  0x4CAF50,  // Green clipboard
  0x795548,  // Brown briefcase
  0x2196F3,  // Blue laptop
  0xFF9800,  // Orange chart
  0xFFC107,  // Gold trophy
  0x3F51B5,  // Indigo suit
  0x607D8B,  // Blue-grey building
  0xE91E63,  // Pink city
  0xFFEB3B,  // Yellow star
];

export const ITEM_BG_COLORS: number[] = [
  0xFFF3E0,  // Light orange
  0xE8F5E9,  // Light green
  0xEFEBE9,  // Light brown
  0xE3F2FD,  // Light blue
  0xFFF8E1,  // Light amber
  0xFFFDE7,  // Light yellow
  0xE8EAF6,  // Light indigo
  0xECEFF1,  // Light blue-grey
  0xFCE4EC,  // Light pink
  0xFFFDE7,  // Light yellow
];

export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;
