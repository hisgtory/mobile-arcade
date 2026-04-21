import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, rows: 4, cols: 4, typeCount: 4, timeLimit: 120 },
  { stage: 2, rows: 4, cols: 6, typeCount: 6, timeLimit: 120 },
  { stage: 3, rows: 6, cols: 6, typeCount: 8, timeLimit: 150 },
  { stage: 4, rows: 6, cols: 8, typeCount: 10, timeLimit: 150 },
  { stage: 5, rows: 8, cols: 8, typeCount: 12, timeLimit: 180 },
];

export function getStageConfig(stage: number): StageConfig {
  const idx = Math.min(stage - 1, STAGES.length - 1);
  return { ...STAGES[Math.max(0, idx)] };
}

export function getMaxStage(): number {
  return STAGES.length;
}
