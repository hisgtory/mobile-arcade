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
      { x: 0.65, y: 0.72 },
      { x: 0.80, y: 0.72 },
    ],
    blocks: [
      { x: 0.60, y: 0.82, width: 0.35, height: 0.04, type: 'wood' },
      { x: 0.62, y: 0.90, width: 0.05, height: 0.12, type: 'wood' },
      { x: 0.90, y: 0.90, width: 0.05, height: 0.12, type: 'wood' },
    ],
  },
  // Level 2: Tower - 3 enemies on a tall tower
  {
    ammo: 4,
    hero: { x: 0.12, y: 0.85 },
    enemies: [
      { x: 0.72, y: 0.35 },
      { x: 0.72, y: 0.55 },
      { x: 0.72, y: 0.72 },
    ],
    blocks: [
      { x: 0.65, y: 0.42, width: 0.20, height: 0.03, type: 'wood' },
      { x: 0.65, y: 0.62, width: 0.20, height: 0.03, type: 'wood' },
      { x: 0.65, y: 0.82, width: 0.20, height: 0.03, type: 'wood' },
      { x: 0.64, y: 0.62, width: 0.04, height: 0.38, type: 'stone' },
      { x: 0.84, y: 0.62, width: 0.04, height: 0.38, type: 'stone' },
      { x: 0.66, y: 0.45, width: 0.04, height: 0.15, type: 'wood' },
      { x: 0.82, y: 0.45, width: 0.04, height: 0.15, type: 'wood' },
    ],
  },
  // Level 3: Walled - 3 enemies behind walls
  {
    ammo: 4,
    hero: { x: 0.12, y: 0.85 },
    enemies: [
      { x: 0.60, y: 0.78 },
      { x: 0.75, y: 0.78 },
      { x: 0.90, y: 0.78 },
    ],
    blocks: [
      { x: 0.50, y: 0.88, width: 0.48, height: 0.04, type: 'stone' },
      { x: 0.52, y: 0.70, width: 0.04, height: 0.20, type: 'stone' },
      { x: 0.67, y: 0.70, width: 0.04, height: 0.20, type: 'wood' },
      { x: 0.82, y: 0.70, width: 0.04, height: 0.20, type: 'wood' },
      { x: 0.50, y: 0.65, width: 0.48, height: 0.03, type: 'ice' },
    ],
  },
  // Level 4: Multi-level - 4 enemies on different heights
  {
    ammo: 5,
    hero: { x: 0.12, y: 0.85 },
    enemies: [
      { x: 0.55, y: 0.72 },
      { x: 0.70, y: 0.52 },
      { x: 0.85, y: 0.32 },
      { x: 0.85, y: 0.72 },
    ],
    blocks: [
      { x: 0.48, y: 0.82, width: 0.18, height: 0.03, type: 'wood' },
      { x: 0.50, y: 0.90, width: 0.04, height: 0.12, type: 'wood' },
      { x: 0.62, y: 0.90, width: 0.04, height: 0.12, type: 'wood' },
      { x: 0.63, y: 0.62, width: 0.18, height: 0.03, type: 'stone' },
      { x: 0.65, y: 0.72, width: 0.04, height: 0.18, type: 'stone' },
      { x: 0.78, y: 0.72, width: 0.04, height: 0.18, type: 'stone' },
      { x: 0.78, y: 0.42, width: 0.18, height: 0.03, type: 'wood' },
      { x: 0.80, y: 0.52, width: 0.04, height: 0.18, type: 'wood' },
      { x: 0.93, y: 0.52, width: 0.04, height: 0.18, type: 'wood' },
      { x: 0.78, y: 0.82, width: 0.18, height: 0.03, type: 'stone' },
      { x: 0.80, y: 0.90, width: 0.04, height: 0.12, type: 'wood' },
      { x: 0.93, y: 0.90, width: 0.04, height: 0.12, type: 'wood' },
    ],
  },
  // Level 5: Fortress - 5 enemies in a castle-like structure
  {
    ammo: 5,
    hero: { x: 0.12, y: 0.85 },
    enemies: [
      { x: 0.58, y: 0.72 },
      { x: 0.72, y: 0.72 },
      { x: 0.86, y: 0.72 },
      { x: 0.65, y: 0.45 },
      { x: 0.79, y: 0.45 },
    ],
    blocks: [
      { x: 0.50, y: 0.85, width: 0.46, height: 0.04, type: 'stone' },
      { x: 0.51, y: 0.68, width: 0.04, height: 0.20, type: 'stone' },
      { x: 0.65, y: 0.68, width: 0.04, height: 0.20, type: 'stone' },
      { x: 0.79, y: 0.68, width: 0.04, height: 0.20, type: 'stone' },
      { x: 0.93, y: 0.68, width: 0.04, height: 0.20, type: 'stone' },
      { x: 0.55, y: 0.55, width: 0.34, height: 0.03, type: 'stone' },
      { x: 0.58, y: 0.42, width: 0.04, height: 0.12, type: 'wood' },
      { x: 0.86, y: 0.42, width: 0.04, height: 0.12, type: 'wood' },
      { x: 0.55, y: 0.38, width: 0.34, height: 0.03, type: 'ice' },
      { x: 0.50, y: 0.56, width: 0.04, height: 0.08, type: 'wood' },
      { x: 0.94, y: 0.56, width: 0.04, height: 0.08, type: 'wood' },
    ],
  },
];
