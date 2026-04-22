import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, totalItems: 16, targetCount: 3, typeCount: 8,  cols: 4, rows: 4, timeLimit: 60  },
  { stage: 2, totalItems: 20, targetCount: 4, typeCount: 10, cols: 5, rows: 4, timeLimit: 60  },
  { stage: 3, totalItems: 25, targetCount: 5, typeCount: 12, cols: 5, rows: 5, timeLimit: 75  },
  { stage: 4, totalItems: 30, targetCount: 6, typeCount: 15, cols: 6, rows: 5, timeLimit: 90  },
  { stage: 5, totalItems: 36, targetCount: 7, typeCount: 18, cols: 6, rows: 6, timeLimit: 120 },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx] };
}
