import type { StageConfig } from '../types';

const PUZZLES_PER_STAGE = 5;

function makePuzzleIds(stage: number): number[] {
  const start = (stage - 1) * PUZZLES_PER_STAGE + 1;
  return Array.from({ length: PUZZLES_PER_STAGE }, (_, i) => start + i);
}

const STAGES: StageConfig[] = [
  { stage: 1,  puzzleIds: makePuzzleIds(1),  timeLimit: 0,  hints: 3 },
  { stage: 2,  puzzleIds: makePuzzleIds(2),  timeLimit: 0,  hints: 3 },
  { stage: 3,  puzzleIds: makePuzzleIds(3),  timeLimit: 0,  hints: 2 },
  { stage: 4,  puzzleIds: makePuzzleIds(4),  timeLimit: 0,  hints: 2 },
  { stage: 5,  puzzleIds: makePuzzleIds(5),  timeLimit: 0,  hints: 2 },
  { stage: 6,  puzzleIds: makePuzzleIds(6),  timeLimit: 0,  hints: 1 },
  { stage: 7,  puzzleIds: makePuzzleIds(7),  timeLimit: 0,  hints: 1 },
  { stage: 8,  puzzleIds: makePuzzleIds(8),  timeLimit: 0,  hints: 1 },
  { stage: 9,  puzzleIds: makePuzzleIds(9),  timeLimit: 0,  hints: 1 },
  { stage: 10, puzzleIds: makePuzzleIds(10), timeLimit: 0,  hints: 0 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}

export function getTotalStages(): number {
  return STAGES.length;
}
