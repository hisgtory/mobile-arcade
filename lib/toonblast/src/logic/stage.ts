import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1,  colorCount: 5, rows: 11, cols: 9, maxMoves: 20, targetScore: 2000 },
  { stage: 2,  colorCount: 5, rows: 11, cols: 9, maxMoves: 18, targetScore: 4000 },
  { stage: 3,  colorCount: 5, rows: 11, cols: 9, maxMoves: 17, targetScore: 6000 },
  { stage: 4,  colorCount: 5, rows: 11, cols: 9, maxMoves: 16, targetScore: 8000 },
  { stage: 5,  colorCount: 5, rows: 11, cols: 9, maxMoves: 15, targetScore: 10000 },
  { stage: 6,  colorCount: 5, rows: 11, cols: 9, maxMoves: 14, targetScore: 13000 },
  { stage: 7,  colorCount: 5, rows: 11, cols: 9, maxMoves: 13, targetScore: 16000 },
  { stage: 8,  colorCount: 5, rows: 11, cols: 9, maxMoves: 12, targetScore: 20000 },
  { stage: 9,  colorCount: 5, rows: 11, cols: 9, maxMoves: 11, targetScore: 25000 },
  { stage: 10, colorCount: 5, rows: 11, cols: 9, maxMoves: 10, targetScore: 30000 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
