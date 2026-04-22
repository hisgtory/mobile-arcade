import type { StageConfig } from '../types';
import { BASE_INK } from '../types';

const STAGES: StageConfig[] = [
  // Stage 1: Simple — rain from top, doge centered
  {
    stage: 1,
    ink: BASE_INK,
    dogeX: 0.5,
    dogeY: 0.75,
    platformY: 0.82,
    hazards: [
      { type: 'rain', direction: 'top', count: 30, speed: 200 },
    ],
  },
  // Stage 2: More rain
  {
    stage: 2,
    ink: BASE_INK * 0.9,
    dogeX: 0.5,
    dogeY: 0.75,
    platformY: 0.82,
    hazards: [
      { type: 'rain', direction: 'top', count: 50, speed: 250 },
    ],
  },
  // Stage 3: Lava from top
  {
    stage: 3,
    ink: BASE_INK * 0.85,
    dogeX: 0.5,
    dogeY: 0.75,
    platformY: 0.82,
    hazards: [
      { type: 'lava', direction: 'top', count: 20, speed: 150 },
    ],
  },
  // Stage 4: Spikes from left
  {
    stage: 4,
    ink: BASE_INK * 0.85,
    dogeX: 0.6,
    dogeY: 0.75,
    platformY: 0.82,
    hazards: [
      { type: 'spikes', direction: 'left', count: 15, speed: 180 },
    ],
  },
  // Stage 5: Rain + lava combo
  {
    stage: 5,
    ink: BASE_INK * 0.8,
    dogeX: 0.5,
    dogeY: 0.7,
    platformY: 0.78,
    hazards: [
      { type: 'rain', direction: 'top', count: 30, speed: 250 },
      { type: 'lava', direction: 'top', count: 10, speed: 120 },
    ],
  },
  // Stage 6: Spikes from right + rain
  {
    stage: 6,
    ink: BASE_INK * 0.75,
    dogeX: 0.4,
    dogeY: 0.7,
    platformY: 0.78,
    hazards: [
      { type: 'spikes', direction: 'right', count: 20, speed: 200 },
      { type: 'rain', direction: 'top', count: 25, speed: 220 },
    ],
  },
  // Stage 7: Lava rain heavy
  {
    stage: 7,
    ink: BASE_INK * 0.7,
    dogeX: 0.5,
    dogeY: 0.65,
    platformY: 0.73,
    hazards: [
      { type: 'lava', direction: 'top', count: 30, speed: 180 },
    ],
  },
  // Stage 8: Multi-direction assault
  {
    stage: 8,
    ink: BASE_INK * 0.7,
    dogeX: 0.5,
    dogeY: 0.65,
    platformY: 0.73,
    hazards: [
      { type: 'spikes', direction: 'left', count: 15, speed: 200 },
      { type: 'spikes', direction: 'right', count: 15, speed: 200 },
    ],
  },
  // Stage 9: Everything at once
  {
    stage: 9,
    ink: BASE_INK * 0.65,
    dogeX: 0.5,
    dogeY: 0.65,
    platformY: 0.73,
    hazards: [
      { type: 'rain', direction: 'top', count: 30, speed: 280 },
      { type: 'lava', direction: 'top', count: 15, speed: 160 },
      { type: 'spikes', direction: 'left', count: 10, speed: 220 },
    ],
  },
  // Stage 10: Final challenge
  {
    stage: 10,
    ink: BASE_INK * 0.55,
    dogeX: 0.5,
    dogeY: 0.6,
    platformY: 0.68,
    hazards: [
      { type: 'lava', direction: 'top', count: 25, speed: 200 },
      { type: 'spikes', direction: 'left', count: 15, speed: 250 },
      { type: 'spikes', direction: 'right', count: 15, speed: 250 },
    ],
  },
];

export function getStageConfig(stage: number): StageConfig {
  if (stage <= STAGES.length) return STAGES[stage - 1];
  // Beyond stage 10: scale difficulty
  const base = STAGES[STAGES.length - 1];
  const extra = stage - STAGES.length;
  return {
    ...base,
    stage,
    ink: Math.max(200, base.ink - extra * 20),
    hazards: base.hazards.map((h) => ({
      ...h,
      count: h.count + extra * 3,
      speed: h.speed + extra * 15,
    })),
  };
}

export const TOTAL_STAGES = STAGES.length;
