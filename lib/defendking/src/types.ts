export enum GamePhase {
  READY = 'ready',
  AIMING = 'aiming',
  FLYING = 'flying',
  SETTLING = 'settling',
  LEVEL_CLEAR = 'level_clear',
  GAME_OVER = 'game_over',
}

export interface GameConfig {
  stage?: number;
  onClear?: () => void;
  onGameOver?: () => void;
}

export interface StageConfig {
  stage: number;
}

export interface BlockData {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wood' | 'stone' | 'ice';
}

export interface LevelData {
  ammo: number;
  enemies: { x: number; y: number }[];
  blocks: BlockData[];
  hero: { x: number; y: number };
}

export const COLORS = {
  enemy: 0xe74c3c,
  hero: 0x3498db,
  projectile: 0xf39c12,
  wood: 0x8b6914,
  stone: 0x7f8c8d,
  ice: 0xa8d8ea,
  ground: 0x27ae60,
  groundDark: 0x6b4226,
  slingshot: 0x5d4037,
  sky: 0x87ceeb,
} as const;

export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;
