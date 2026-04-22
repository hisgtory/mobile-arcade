import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, typeCount: 4, rows: 5, cols: 5, maxMoves: 20, targetScore: 800 },
  { stage: 2, typeCount: 5, rows: 6, cols: 6, maxMoves: 22, targetScore: 1500 },
  { stage: 3, typeCount: 5, rows: 6, cols: 6, maxMoves: 20, targetScore: 2500 },
  { stage: 4, typeCount: 6, rows: 7, cols: 7, maxMoves: 20, targetScore: 4000 },
  { stage: 5, typeCount: 6, rows: 7, cols: 7, maxMoves: 18, targetScore: 6000 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
