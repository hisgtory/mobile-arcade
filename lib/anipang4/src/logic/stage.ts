import type { StageConfig } from '../types';

/** Time-based stages: more time early, less time + more types later */
const STAGES: StageConfig[] = [
  { stage: 1, typeCount: 6, rows: 8, cols: 8, timeLimit: 60, targetScore: 1500 },
  { stage: 2, typeCount: 7, rows: 8, cols: 8, timeLimit: 55, targetScore: 3000 },
  { stage: 3, typeCount: 7, rows: 8, cols: 8, timeLimit: 50, targetScore: 5000 },
  { stage: 4, typeCount: 8, rows: 8, cols: 8, timeLimit: 45, targetScore: 7000 },
  { stage: 5, typeCount: 8, rows: 8, cols: 8, timeLimit: 40, targetScore: 10000 },
];

export const TOTAL_STAGES = STAGES.length;

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx], stage: n };
}
