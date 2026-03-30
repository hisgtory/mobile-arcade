import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, typeCount: 5, rows: 8, cols: 8, maxMoves: 30, targetScore: 2000, minGroup: 2 },
  { stage: 2, typeCount: 5, rows: 8, cols: 8, maxMoves: 28, targetScore: 4000, minGroup: 2 },
  { stage: 3, typeCount: 6, rows: 8, cols: 8, maxMoves: 25, targetScore: 6000, minGroup: 2 },
  { stage: 4, typeCount: 6, rows: 9, cols: 9, maxMoves: 22, targetScore: 8000, minGroup: 3 },
  { stage: 5, typeCount: 7, rows: 9, cols: 9, maxMoves: 20, targetScore: 12000, minGroup: 3 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
