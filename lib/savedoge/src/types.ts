// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 600;

/** Maximum ink per stage (in logical px of line length) */
export const BASE_INK = 600;

/** Grace period in ms before hazards start */
export const GRACE_MS = 1500;

/** Duration in ms for the hazard phase */
export const HAZARD_DURATION_MS = 4000;

// ─── Hazard Types ────────────────────────────────────────

export type HazardType = 'lava' | 'rain' | 'spikes';

export interface HazardConfig {
  type: HazardType;
  /** Where the hazard originates: 'top' means falls from above */
  direction: 'top' | 'left' | 'right';
  /** Number of hazard particles/objects */
  count: number;
  /** Speed of hazard objects */
  speed: number;
}

// ─── Stage Config ────────────────────────────────────────

export interface StageConfig {
  stage: number;
  /** Max ink the player can use (line length in px) */
  ink: number;
  /** Doge position (ratio 0-1 of canvas) */
  dogeX: number;
  dogeY: number;
  /** Hazards for this stage */
  hazards: HazardConfig[];
  /** Optional platform configs for the doge to stand on */
  platformY?: number;
}

export interface GameConfig {
  stage?: number;
}

// ─── Game Events ─────────────────────────────────────────

export interface ScoreData {
  score: number;
}

export interface StageClearData {
  score: number;
  stage: number;
  inkUsed: number;
}

export interface InkData {
  ink: number;
  maxInk: number;
}
