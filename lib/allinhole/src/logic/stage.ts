import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, rows: 5, cols: 5, maxMoves: 15, ballCount: 3, holeCount: 3, wallCount: 2 },
  { stage: 2, rows: 5, cols: 5, maxMoves: 15, ballCount: 4, holeCount: 4, wallCount: 3 },
  { stage: 3, rows: 6, cols: 6, maxMoves: 18, ballCount: 5, holeCount: 5, wallCount: 5 },
  { stage: 4, rows: 6, cols: 6, maxMoves: 16, ballCount: 6, holeCount: 6, wallCount: 6 },
  { stage: 5, rows: 7, cols: 7, maxMoves: 20, ballCount: 7, holeCount: 7, wallCount: 8 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
