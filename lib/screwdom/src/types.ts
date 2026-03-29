// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

/** Maximum screws per hole */
export const HOLE_CAPACITY = 1;

// ─── Screw Colors ────────────────────────────────────────
export const SCREW_COLORS: readonly string[] = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
] as const;

// ─── Board Types ─────────────────────────────────────────

/** A screw has a color index and sits on a plank */
export interface Screw {
  id: number;
  color: number; // index into SCREW_COLORS
  plankId: number;
  slotIndex: number; // position within the plank
  removed: boolean;
}

/** A plank (wooden board) holds screws and overlaps other planks */
export interface Plank {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // rotation in degrees
  layer: number; // z-order — higher = on top
  screwSlots: (number | null)[]; // screw IDs (null = empty slot)
}

/** A hole accepts screws of a specific color */
export interface Hole {
  id: number;
  color: number; // expected screw color index
  filled: boolean;
  screwId: number | null;
}

export interface BoardState {
  screws: Screw[];
  planks: Plank[];
  holes: Hole[];
  numColors: number;
}

// ─── Stage Config ────────────────────────────────────────

export interface StageConfig {
  stage: number;
  numPlanks: number;
  numColors: number;
  screwsPerColor: number;
}

export function getStageConfig(stage: number): StageConfig {
  if (stage < 1) stage = 1;
  const configs: StageConfig[] = [
    { stage: 1, numPlanks: 2, numColors: 2, screwsPerColor: 2 },
    { stage: 2, numPlanks: 3, numColors: 2, screwsPerColor: 3 },
    { stage: 3, numPlanks: 3, numColors: 3, screwsPerColor: 2 },
    { stage: 4, numPlanks: 4, numColors: 3, screwsPerColor: 3 },
    { stage: 5, numPlanks: 4, numColors: 4, screwsPerColor: 3 },
    { stage: 6, numPlanks: 5, numColors: 4, screwsPerColor: 3 },
    { stage: 7, numPlanks: 5, numColors: 5, screwsPerColor: 3 },
    { stage: 8, numPlanks: 6, numColors: 5, screwsPerColor: 3 },
    { stage: 9, numPlanks: 6, numColors: 6, screwsPerColor: 3 },
    { stage: 10, numPlanks: 7, numColors: 6, screwsPerColor: 3 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  const numColors = Math.min(6 + Math.floor((stage - 10) / 2), 8);
  const numPlanks = Math.min(7 + Math.floor((stage - 10) / 3), 10);
  return { stage, numPlanks, numColors, screwsPerColor: 3 };
}

// ─── Game Types ──────────────────────────────────────────

export interface GameConfig {
  stage?: number;
}
