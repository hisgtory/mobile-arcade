import type { StageConfig } from '../types';

const STAGES: StageConfig[] = [
  { stage: 1, typeCount: 6, rows: 8, cols: 8, maxMoves: 25, orders: [{ type: 0, target: 8 }, { type: 1, target: 7 }] },
  { stage: 2, typeCount: 7, rows: 8, cols: 8, maxMoves: 22, orders: [{ type: 0, target: 10 }, { type: 2, target: 10 }] },
  { stage: 3, typeCount: 7, rows: 8, cols: 8, maxMoves: 20, orders: [{ type: 0, target: 12 }, { type: 1, target: 10 }, { type: 2, target: 8 }] },
  { stage: 4, typeCount: 8, rows: 8, cols: 8, maxMoves: 18, orders: [{ type: 4, target: 12 }, { type: 3, target: 10 }, { type: 2, target: 10 }] },
  { stage: 5, typeCount: 8, rows: 8, cols: 8, maxMoves: 15, orders: [{ type: 0, target: 15 }, { type: 1, target: 12 }, { type: 2, target: 10 }] },
];

export function getStageConfig(stageNum: number): StageConfig {
  const n = Number.isFinite(stageNum) ? stageNum : 1;
  const idx = Math.max(0, Math.min(n - 1, STAGES.length - 1));
  return { ...STAGES[idx], orders: STAGES[idx].orders.map((o) => ({ ...o })) };
}
