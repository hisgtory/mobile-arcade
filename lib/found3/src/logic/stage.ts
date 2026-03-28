/**
 * Stage configurations for found3
 *
 * MVP: 5 stages, single layer
 */

import { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, typeCount: 4,  tileCount: 12, layers: 2, timeLimit: 120, cols: 4, rows: 3 },
  { stage: 2, typeCount: 6,  tileCount: 18, layers: 2, timeLimit: 120, cols: 6, rows: 3 },
  { stage: 3, typeCount: 8,  tileCount: 24, layers: 2, timeLimit: 150, cols: 6, rows: 4 },
  { stage: 4, typeCount: 10, tileCount: 30, layers: 3, timeLimit: 150, cols: 6, rows: 5 },
  { stage: 5, typeCount: 12, tileCount: 36, layers: 3, timeLimit: 180, cols: 6, rows: 6 },
];

export function getStageConfig(stage: number): StageConfig {
  const idx = Math.max(0, Math.min(stage - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}

export function getMaxStage(): number {
  return STAGES.length;
}
