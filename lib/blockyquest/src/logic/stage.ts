import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, pieceSets: 5, targetScore: 300, piecePoolSize: 6 },
  { stage: 2, pieceSets: 5, targetScore: 500, piecePoolSize: 8 },
  { stage: 3, pieceSets: 6, targetScore: 800, piecePoolSize: 9 },
  { stage: 4, pieceSets: 6, targetScore: 1200, piecePoolSize: 10 },
  { stage: 5, pieceSets: 7, targetScore: 1800, piecePoolSize: 11 },
  { stage: 6, pieceSets: 7, targetScore: 2500, piecePoolSize: 12 },
  { stage: 7, pieceSets: 8, targetScore: 3500, piecePoolSize: 13 },
  { stage: 8, pieceSets: 8, targetScore: 4500, piecePoolSize: 14 },
  { stage: 9, pieceSets: 9, targetScore: 6000, piecePoolSize: 14 },
  { stage: 10, pieceSets: 10, targetScore: 8000, piecePoolSize: 14 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
