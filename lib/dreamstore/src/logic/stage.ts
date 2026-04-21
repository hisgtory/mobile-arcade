import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, productTypes: 4, rows: 5, cols: 5, customerCount: 5,  orderSize: 2, timeLimit: 90 },
  { stage: 2, productTypes: 5, rows: 5, cols: 6, customerCount: 6,  orderSize: 2, timeLimit: 90 },
  { stage: 3, productTypes: 6, rows: 6, cols: 6, customerCount: 8,  orderSize: 3, timeLimit: 100 },
  { stage: 4, productTypes: 7, rows: 6, cols: 6, customerCount: 10, orderSize: 3, timeLimit: 110 },
  { stage: 5, productTypes: 8, rows: 6, cols: 7, customerCount: 12, orderSize: 3, timeLimit: 120 },
];

export const TOTAL_STAGES = STAGES.length;

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx], stage: n };
}
