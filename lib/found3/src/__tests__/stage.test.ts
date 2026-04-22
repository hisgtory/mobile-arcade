import { describe, it, expect } from 'vitest';
import { getStageConfig, getMaxStage } from '../logic/stage';

describe('getMaxStage', () => {
  it('returns 5', () => {
    expect(getMaxStage()).toBe(5);
  });
});

describe('getStageConfig', () => {
  it('returns config for stage 1', () => {
    const cfg = getStageConfig(1);
    expect(cfg.stage).toBe(1);
    expect(cfg.typeCount).toBeGreaterThan(0);
    expect(cfg.tileCount).toBeGreaterThan(0);
    expect(cfg.timeLimit).toBeGreaterThan(0);
  });

  it('returns config for stage 5', () => {
    const cfg = getStageConfig(5);
    expect(cfg.stage).toBe(5);
    expect(cfg.typeCount).toBeGreaterThanOrEqual(getStageConfig(1).typeCount);
  });

  it('clamps to stage 1 for out-of-range low values', () => {
    expect(getStageConfig(0).stage).toBe(1);
    expect(getStageConfig(-1).stage).toBe(1);
  });

  it('clamps to last stage for out-of-range high values', () => {
    const max = getMaxStage();
    expect(getStageConfig(99).stage).toBe(max);
  });

  it('returns a copy (no mutation)', () => {
    const a = getStageConfig(1);
    const b = getStageConfig(1);
    a.typeCount = 999;
    expect(b.typeCount).not.toBe(999);
  });
});
