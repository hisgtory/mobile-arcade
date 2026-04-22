// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Pin Colors ──────────────────────────────────────────
export const PIN_COLORS: readonly string[] = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#6366F1', // Indigo
] as const;

export const ROPE_COLORS: readonly string[] = [
  '#DC2626', // Red
  '#2563EB', // Blue
  '#16A34A', // Green
  '#CA8A04', // Yellow
  '#9333EA', // Purple
  '#EA580C', // Orange
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#65A30D', // Lime
  '#4F46E5', // Indigo
] as const;

// ─── Types ───────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Pin {
  id: number;
  x: number;
  y: number;
  colorIndex: number;
}

export interface Rope {
  id: number;
  pinA: number; // pin id
  pinB: number; // pin id
  colorIndex: number;
}

export interface BoardState {
  pins: Pin[];
  ropes: Rope[];
}

// ─── Stage Config ────────────────────────────────────────

export interface StageConfig {
  stage: number;
  pinCount: number;
  ropeCount: number;
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, pinCount: 4, ropeCount: 4 },
    { stage: 2, pinCount: 5, ropeCount: 5 },
    { stage: 3, pinCount: 5, ropeCount: 6 },
    { stage: 4, pinCount: 6, ropeCount: 7 },
    { stage: 5, pinCount: 6, ropeCount: 8 },
    { stage: 6, pinCount: 7, ropeCount: 9 },
    { stage: 7, pinCount: 7, ropeCount: 10 },
    { stage: 8, pinCount: 8, ropeCount: 11 },
    { stage: 9, pinCount: 8, ropeCount: 12 },
    { stage: 10, pinCount: 9, ropeCount: 13 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 10: scale up
  const pinCount = Math.min(9 + Math.floor((stage - 10) / 2), 14);
  const ropeCount = Math.min(13 + (stage - 10), 24);
  return { stage, pinCount, ropeCount };
}

// ─── Game Config ─────────────────────────────────────────

export interface GameConfig {
  stage?: number;
}
