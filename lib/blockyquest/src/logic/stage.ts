import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, maxMoves: 12, targetScore: 200 },
  { stage: 2, maxMoves: 12, targetScore: 400 },
  { stage: 3, maxMoves: 11, targetScore: 600 },
  { stage: 4, maxMoves: 11, targetScore: 900 },
  { stage: 5, maxMoves: 10, targetScore: 1200 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
