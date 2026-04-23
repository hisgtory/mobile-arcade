import { describe, it, expect } from 'vitest';
import { addToSlotAndMatch, undoLastSlotItem } from '../logic/matcher';
import { MAX_SLOT } from '../types';

describe('addToSlotAndMatch', () => {
  it('appends item when slot is empty', () => {
    const result = addToSlotAndMatch([], { id: 'a1', type: 0 });
    expect(result.slotItems).toHaveLength(1);
    expect(result.matched).toBe(false);
    expect(result.slotFull).toBe(false);
  });

  it('inserts new item next to existing same-type item', () => {
    const slot = [
      { id: 'a1', type: 0 },
      { id: 'b1', type: 1 },
    ];
    const result = addToSlotAndMatch(slot, { id: 'a2', type: 0 });
    // a2 should be placed after a1 (index 1), before b1
    expect(result.slotItems[1]).toMatchObject({ id: 'a2', type: 0 });
    expect(result.matched).toBe(false);
  });

  it('matches and removes 3 tiles of same type', () => {
    const slot = [
      { id: 'a1', type: 0 },
      { id: 'a2', type: 0 },
    ];
    const result = addToSlotAndMatch(slot, { id: 'a3', type: 0 });
    expect(result.matched).toBe(true);
    expect(result.matchedType).toBe(0);
    expect(result.slotItems.every((s) => s.type !== 0)).toBe(true);
    expect(result.slotFull).toBe(false);
  });

  it('does not match when only 2 of same type', () => {
    const slot = [{ id: 'a1', type: 0 }];
    const result = addToSlotAndMatch(slot, { id: 'a2', type: 0 });
    expect(result.matched).toBe(false);
    expect(result.slotItems.filter((s) => s.type === 0)).toHaveLength(2);
  });

  it('reports slotFull when slot reaches MAX_SLOT without match', () => {
    const slot = Array.from({ length: MAX_SLOT - 1 }, (_, i) => ({
      id: `x${i}`,
      type: i + 10, // distinct types to avoid match
    }));
    const result = addToSlotAndMatch(slot, { id: 'y', type: 99 });
    expect(result.slotFull).toBe(true);
  });

  it('does not report slotFull after a match clears items', () => {
    // Fill 6 slots with pairs, then add 3rd of same type to trigger match
    const slot = Array.from({ length: 6 }, (_, i) => ({
      id: `x${i}`,
      type: i < 2 ? 0 : i + 10,
    }));
    const result = addToSlotAndMatch(slot, { id: 'x6', type: 0 });
    expect(result.matched).toBe(true);
    expect(result.slotFull).toBe(false);
  });
});

describe('undoLastSlotItem', () => {
  it('returns null removed when slot is empty', () => {
    const result = undoLastSlotItem([]);
    expect(result.removed).toBeNull();
    expect(result.slotItems).toHaveLength(0);
  });

  it('pops the last item from slot', () => {
    const slot = [
      { id: 'a1', type: 0 },
      { id: 'b1', type: 1 },
    ];
    const result = undoLastSlotItem(slot);
    expect(result.removed).toMatchObject({ id: 'b1', type: 1 });
    expect(result.slotItems).toHaveLength(1);
    expect(result.slotItems[0]).toMatchObject({ id: 'a1', type: 0 });
  });

  it('does not mutate the original slot', () => {
    const slot = [{ id: 'a1', type: 0 }];
    undoLastSlotItem(slot);
    expect(slot).toHaveLength(1);
  });
});
