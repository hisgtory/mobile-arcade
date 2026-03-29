import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1,  typeCount: 5, rows: 8, cols: 8, maxMoves: 30, targetScore: 800 },
  { stage: 2,  typeCount: 5, rows: 8, cols: 8, maxMoves: 28, targetScore: 1200 },
  { stage: 3,  typeCount: 6, rows: 8, cols: 8, maxMoves: 25, targetScore: 1800 },
  { stage: 4,  typeCount: 6, rows: 8, cols: 8, maxMoves: 23, targetScore: 2500 },
  { stage: 5,  typeCount: 7, rows: 8, cols: 8, maxMoves: 22, targetScore: 3000 },
  { stage: 6,  typeCount: 7, rows: 8, cols: 8, maxMoves: 20, targetScore: 4000 },
  { stage: 7,  typeCount: 7, rows: 8, cols: 8, maxMoves: 18, targetScore: 5000 },
  { stage: 8,  typeCount: 8, rows: 8, cols: 8, maxMoves: 18, targetScore: 6000 },
  { stage: 9,  typeCount: 8, rows: 8, cols: 8, maxMoves: 16, targetScore: 7500 },
  { stage: 10, typeCount: 8, rows: 8, cols: 8, maxMoves: 15, targetScore: 9000 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
