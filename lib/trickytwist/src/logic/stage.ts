import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, puzzleCount: 5, gridSize: 3, timeLimit: 60, puzzleTypes: ['odd_one_out'] },
  { stage: 2, puzzleCount: 5, gridSize: 3, timeLimit: 55, puzzleTypes: ['odd_one_out', 'count'] },
  { stage: 3, puzzleCount: 6, gridSize: 4, timeLimit: 60, puzzleTypes: ['odd_one_out', 'count', 'pattern'] },
  { stage: 4, puzzleCount: 6, gridSize: 4, timeLimit: 55, puzzleTypes: ['odd_one_out', 'count', 'pattern', 'sequence'] },
  { stage: 5, puzzleCount: 8, gridSize: 4, timeLimit: 60, puzzleTypes: ['odd_one_out', 'count', 'pattern', 'sequence', 'mirror'] },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  if (n <= STAGES.length) return { ...STAGES[idx] };

  // Dynamic stages beyond defined ones
  const puzzleCount = Math.min(8 + Math.floor((n - 5) / 2), 15);
  const timeLimit = Math.max(40, 60 - (n - 5) * 2);
  return {
    stage: n,
    puzzleCount,
    gridSize: 4,
    timeLimit,
    puzzleTypes: ['odd_one_out', 'count', 'pattern', 'sequence', 'mirror'],
  };
}
