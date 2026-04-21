import type { LevelData } from '../types';

// Positions are normalized 0-1 of the play area (above the ground)
// x: 0=left, 1=right; y: 0=top, 1=bottom (ground level)
// Block dimensions are in normalized units scaled by the scene

export const levels: LevelData[] = [
  // Level 1: Simple - 2 enemies on a small platform
  {
    ammo: 3,
    hero: { x: 0.12, y: 0.85 },
    enemies: [
      { x: 0.65, y: 0.76 },
      { x: 0.80, y: 0.76 },
    ],
    blocks: [
      { x: 0.72, y: 0.82, width: 0.30, height: 0.04, type: 'wood' },
      { x: 0.62, y: 0.90, width: 0.05, height: 0.14, type: 'wood' },
      { x: 0.82, y: 0.90, width: 0.05, height: 0.14, type: 'wood' },
    ],
  },
  // Level 2: Tower - 3 enemies on a tall tower
  {
    ammo: 4,
    hero: { x: 0.12, y: 0.85 },
    enemies: [
      { x: 0.72, y: 0.36 },
      { x: 0.72, y: 0.56 },
      { x: 0.72, y: 0.76 },
    ],
    blocks: [
      { x: 0.72, y: 0.43, width: 0.20, height: 0.03, type: 'wood' },
      { x: 0.72, y: 0.63, width: 0.20, height: 0.03, type: 'wood' },
      { x: 0.72, y: 0.83, width: 0.20, height: 0.03, type: 'wood' },
      { x: 0.64, y: 0.63, width: 0.04, height: 0.38, type: 'stone' },
      { x: 0.80, y: 0.63, width: 0.04, height: 0.38, type: 'stone' },
      { x: 0.66, y: 0.48, width: 0.04, height: 0.12, type: 'wood' },
      { x: 0.78, y: 0.48, width: 0.04, height: 0.12, type: 'wood' },
    ],
  },
  // Level 3: Walled - 3 enemies behind walls
  {
    ammo: 4,
    hero: { x: 0.12, y: 0.85 },
    enemies: [
      { x: 0.60, y: 0.82 },
      { x: 0.75, y: 0.82 },
      { x: 0.90, y: 0.82 },
    ],
    blocks: [
      { x: 0.75, y: 0.88, width: 0.44, height: 0.04, type: 'stone' },
      { x: 0.55, y: 0.75, width: 0.04, height: 0.22, type: 'stone' },
      { x: 0.67, y: 0.75, width: 0.04, height: 0.22, type: 'wood' },
      { x: 0.83, y: 0.75, width: 0.04, height: 0.22, type: 'wood' },
      { x: 0.75, y: 0.62, width: 0.44, height: 0.03, type: 'ice' },
    ],
  },
  // Level 4: Multi-level - 4 enemies on different heights
  {
    ammo: 5,
    hero: { x: 0.12, y: 0.85 },
    enemies: [
      { x: 0.55, y: 0.76 },
      { x: 0.70, y: 0.56 },
      { x: 0.85, y: 0.36 },
      { x: 0.85, y: 0.76 },
    ],
    blocks: [
      { x: 0.55, y: 0.83, width: 0.16, height: 0.03, type: 'wood' },
      { x: 0.50, y: 0.91, width: 0.04, height: 0.14, type: 'wood' },
      { x: 0.60, y: 0.91, width: 0.04, height: 0.14, type: 'wood' },
      { x: 0.70, y: 0.63, width: 0.16, height: 0.03, type: 'stone' },
      { x: 0.65, y: 0.76, width: 0.04, height: 0.24, type: 'stone' },
      { x: 0.75, y: 0.76, width: 0.04, height: 0.24, type: 'stone' },
      { x: 0.85, y: 0.43, width: 0.16, height: 0.03, type: 'wood' },
      { x: 0.80, y: 0.56, width: 0.04, height: 0.24, type: 'wood' },
      { x: 0.90, y: 0.56, width: 0.04, height: 0.24, type: 'wood' },
      { x: 0.85, y: 0.83, width: 0.16, height: 0.03, type: 'stone' },
      { x: 0.80, y: 0.91, width: 0.04, height: 0.14, type: 'wood' },
      { x: 0.90, y: 0.91, width: 0.04, height: 0.14, type: 'wood' },
    ],
  },
  // Level 5: Fortress - 5 enemies in a castle-like structure
  {
    ammo: 5,
    hero: { x: 0.12, y: 0.85 },
    enemies: [
      { x: 0.58, y: 0.76 },
      { x: 0.72, y: 0.76 },
      { x: 0.86, y: 0.76 },
      { x: 0.65, y: 0.49 },
      { x: 0.79, y: 0.49 },
    ],
    blocks: [
      { x: 0.72, y: 0.83, width: 0.44, height: 0.04, type: 'stone' },
      { x: 0.53, y: 0.73, width: 0.04, height: 0.18, type: 'stone' },
      { x: 0.65, y: 0.73, width: 0.04, height: 0.18, type: 'stone' },
      { x: 0.79, y: 0.73, width: 0.04, height: 0.18, type: 'stone' },
      { x: 0.91, y: 0.73, width: 0.04, height: 0.18, type: 'stone' },
      { x: 0.72, y: 0.56, width: 0.34, height: 0.03, type: 'stone' },
      { x: 0.58, y: 0.46, width: 0.04, height: 0.12, type: 'wood' },
      { x: 0.86, y: 0.46, width: 0.04, height: 0.12, type: 'wood' },
      { x: 0.72, y: 0.38, width: 0.34, height: 0.03, type: 'ice' },
      { x: 0.53, y: 0.60, width: 0.04, height: 0.06, type: 'wood' },
      { x: 0.91, y: 0.60, width: 0.04, height: 0.06, type: 'wood' },
    ],
  },
];

export const TOTAL_STAGES = levels.length;
