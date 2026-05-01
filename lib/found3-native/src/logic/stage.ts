/**
 * Stage configurations for found3
 * Copied from lib/found3/src/logic/stage.ts — Phaser-free
 */

import { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, typeCount: 6,  tileCount: 18, layers: 2, timeLimit: 120, cols: 5, rows: 4 },
  { stage: 2, typeCount: 9,  tileCount: 27, layers: 3, timeLimit: 120, cols: 6, rows: 5 },
  { stage: 3, typeCount: 12, tileCount: 36, layers: 3, timeLimit: 150, cols: 7, rows: 6 },
  { stage: 4, typeCount: 13, tileCount: 39, layers: 4, timeLimit: 150, cols: 7, rows: 7 },
  { stage: 5, typeCount: 13, tileCount: 45, layers: 5, timeLimit: 200, cols: 8, rows: 8 },
];

export function getStageConfig(stage: number): StageConfig {
  const idx = Math.max(0, Math.min(stage - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}

export function getMaxStage(): number {
  return STAGES.length;
}
