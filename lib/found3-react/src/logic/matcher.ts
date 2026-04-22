/**
 * Slot matching logic for found3
 * Copied from lib/found3/src/logic/matcher.ts — Phaser-free
 */

import { SlotItem, TileType, MAX_SLOT } from '../types';

export interface MatchResult {
  slotItems: SlotItem[];
  matched: boolean;
  matchedType?: TileType;
  slotFull: boolean;
}

export function addToSlotAndMatch(
  currentSlot: SlotItem[],
  newItem: SlotItem,
): MatchResult {
  const slot = [...currentSlot];

  let insertIdx = slot.length;
  for (let i = slot.length - 1; i >= 0; i--) {
    if (slot[i].type === newItem.type) {
      insertIdx = i + 1;
      break;
    }
  }

  slot.splice(insertIdx, 0, newItem);

  const sameTypeCount = slot.filter((s) => s.type === newItem.type).length;

  if (sameTypeCount >= 3) {
    const filtered = slot.filter((s) => s.type !== newItem.type);
    return {
      slotItems: filtered,
      matched: true,
      matchedType: newItem.type,
      slotFull: false,
    };
  }

  const isFull = slot.length >= MAX_SLOT;
  return {
    slotItems: slot,
    matched: false,
    slotFull: isFull,
  };
}

export function undoLastSlotItem(
  currentSlot: SlotItem[],
): { slotItems: SlotItem[]; removed: SlotItem | null } {
  if (currentSlot.length === 0) {
    return { slotItems: [], removed: null };
  }
  const slot = [...currentSlot];
  const removed = slot.pop()!;
  return { slotItems: slot, removed };
}
