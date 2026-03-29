// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Tile Emojis ─────────────────────────────────────────
export const TILE_EMOJIS: string[] = [
  '🀄', '🎋', '🎍', '🏮', '🧧', '🎎', '🎏', '🎐',
  '🎑', '🌸', '🍵', '🏯', '🎴', '🐉', '🐲', '🦊',
  '🌙', '🔥', '💎', '🌊', '⭐', '🎪', '🍀', '🌺',
];

// ─── Data Types ──────────────────────────────────────────
export interface TileData {
  id: number;
  typeIndex: number;
  gridX: number;
  gridY: number;
  gridZ: number;
  removed: boolean;
}

export interface BoardState {
  tiles: TileData[];
  numTypes: number;
}

export interface StageConfig {
  stage: number;
  layers: number;
  tilesPerLayer: number;
  numTypes: number;
}

export interface GameConfig {
  stage?: number;
}

// ─── Stage Config ────────────────────────────────────────
export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, layers: 3, tilesPerLayer: 36, numTypes: 6 },
    { stage: 2, layers: 3, tilesPerLayer: 48, numTypes: 8 },
    { stage: 3, layers: 4, tilesPerLayer: 60, numTypes: 10 },
    { stage: 4, layers: 4, tilesPerLayer: 72, numTypes: 12 },
    { stage: 5, layers: 5, tilesPerLayer: 84, numTypes: 14 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  const layers = Math.min(5 + Math.floor((stage - 5) / 2), 7);
  const tilesPerLayer = Math.min(84 + (stage - 5) * 12, 144);
  const numTypes = Math.min(14 + (stage - 5), 18);
  return { stage, layers, tilesPerLayer, numTypes };
}
