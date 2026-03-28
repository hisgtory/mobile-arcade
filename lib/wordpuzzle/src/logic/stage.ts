import type { StageConfig } from '../types';

export function getStageConfig(stage: number): StageConfig {
  // Stages 1-30 map to puzzleId 1-30; beyond 30 cycle back
  const puzzleId = ((stage - 1) % 30) + 1;
  return { stage, puzzleId };
}
