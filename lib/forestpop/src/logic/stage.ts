import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, typeCount: 5, rows: 8, cols: 8, maxMoves: 30, targetScore: 1000 },
  { stage: 2, typeCount: 6, rows: 8, cols: 8, maxMoves: 25, targetScore: 2000 },
  { stage: 3, typeCount: 6, rows: 8, cols: 8, maxMoves: 22, targetScore: 3500 },
  { stage: 4, typeCount: 7, rows: 8, cols: 8, maxMoves: 20, targetScore: 5000 },
  { stage: 5, typeCount: 7, rows: 8, cols: 8, maxMoves: 18, targetScore: 7000 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
