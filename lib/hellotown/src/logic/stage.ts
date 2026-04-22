import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, rows: 4, cols: 4, maxMoves: 30, targetLevel: 3, startLevels: 2, initialItems: 10 },
  { stage: 2, rows: 4, cols: 4, maxMoves: 28, targetLevel: 4, startLevels: 2, initialItems: 12 },
  { stage: 3, rows: 5, cols: 5, maxMoves: 30, targetLevel: 4, startLevels: 3, initialItems: 16 },
  { stage: 4, rows: 5, cols: 5, maxMoves: 25, targetLevel: 5, startLevels: 3, initialItems: 18 },
  { stage: 5, rows: 5, cols: 5, maxMoves: 25, targetLevel: 5, startLevels: 3, initialItems: 20 },
  { stage: 6, rows: 6, cols: 5, maxMoves: 28, targetLevel: 6, startLevels: 3, initialItems: 22 },
  { stage: 7, rows: 6, cols: 5, maxMoves: 25, targetLevel: 6, startLevels: 4, initialItems: 22 },
  { stage: 8, rows: 6, cols: 6, maxMoves: 30, targetLevel: 7, startLevels: 4, initialItems: 26 },
  { stage: 9, rows: 6, cols: 6, maxMoves: 25, targetLevel: 7, startLevels: 4, initialItems: 28 },
  { stage: 10, rows: 6, cols: 6, maxMoves: 25, targetLevel: 8, startLevels: 4, initialItems: 30 },
];

export const TOTAL_STAGES = STAGES.length;

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
