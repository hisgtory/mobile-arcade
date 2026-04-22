import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1,  colorCount: 4, rows: 9,  cols: 7, maxMoves: 25, targetScore: 1500 },
  { stage: 2,  colorCount: 4, rows: 9,  cols: 8, maxMoves: 25, targetScore: 2500 },
  { stage: 3,  colorCount: 5, rows: 10, cols: 8, maxMoves: 25, targetScore: 3500 },
  { stage: 4,  colorCount: 5, rows: 10, cols: 9, maxMoves: 25, targetScore: 5000 },
  { stage: 5,  colorCount: 5, rows: 11, cols: 9, maxMoves: 25, targetScore: 6500 },
  { stage: 6,  colorCount: 5, rows: 11, cols: 9, maxMoves: 22, targetScore: 8000 },
  { stage: 7,  colorCount: 5, rows: 11, cols: 9, maxMoves: 20, targetScore: 10000 },
  { stage: 8,  colorCount: 5, rows: 11, cols: 9, maxMoves: 20, targetScore: 12000 },
  { stage: 9,  colorCount: 5, rows: 11, cols: 9, maxMoves: 18, targetScore: 14000 },
  { stage: 10, colorCount: 5, rows: 11, cols: 9, maxMoves: 18, targetScore: 16000 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
