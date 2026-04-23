import { describe, it, expect } from 'vitest';
import { getStageConfig } from '../logic/stage';

describe('getStageConfig', () => {
  it('returns config for stage 1', () => {
    const cfg = getStageConfig(1);
    expect(cfg.stage).toBe(1);
    expect(cfg.rows).toBeGreaterThan(0);
    expect(cfg.cols).toBeGreaterThan(0);
    expect(cfg.maxMoves).toBeGreaterThan(0);
    expect(cfg.targetScore).toBeGreaterThan(0);
  });

  it('returns config for stage 5', () => {
    const cfg = getStageConfig(5);
    expect(cfg.stage).toBe(5);
    expect(cfg.targetScore).toBeGreaterThan(getStageConfig(1).targetScore);
  });

  it('clamps to stage 1 for low out-of-range values', () => {
    expect(getStageConfig(0).stage).toBe(1);
    expect(getStageConfig(-5).stage).toBe(1);
  });

  it('clamps to last stage for high out-of-range values', () => {
    expect(getStageConfig(100).stage).toBe(5);
  });

  it('handles non-finite input gracefully', () => {
    const cfg = getStageConfig(NaN);
    expect(cfg.stage).toBe(1);
  });

  it('returns a copy (no shared reference)', () => {
    const a = getStageConfig(2);
    const b = getStageConfig(2);
    a.maxMoves = 9999;
    expect(b.maxMoves).not.toBe(9999);
  });
});
