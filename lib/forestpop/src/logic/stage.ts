import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, typeCount: 4, rows: 8, cols: 8, maxMoves: 25, targetScore: 800, minGroupSize: 2 },
  { stage: 2, typeCount: 5, rows: 8, cols: 8, maxMoves: 22, targetScore: 1500, minGroupSize: 2 },
  { stage: 3, typeCount: 5, rows: 8, cols: 8, maxMoves: 20, targetScore: 2500, minGroupSize: 2 },
  { stage: 4, typeCount: 6, rows: 8, cols: 8, maxMoves: 18, targetScore: 4000, minGroupSize: 3 },
  { stage: 5, typeCount: 6, rows: 8, cols: 8, maxMoves: 15, targetScore: 6000, minGroupSize: 3 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
