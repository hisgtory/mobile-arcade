/**
 * Slot matching logic for found3
 *
 * When a tile is added to the slot:
 * 1. Insert it adjacent to any existing tile of the same type
 * 2. Check if 3 tiles of the same type exist -> remove them
 * 3. Return match result
 */

import { SlotItem, TileType, MAX_SLOT } from '../types';

export interface MatchResult {
  /** Updated slot items after insertion (and possible removal) */
  slotItems: SlotItem[];
  /** Whether a 3-match was found and removed */
  matched: boolean;
  /** The tile type that was matched (if any) */
  matchedType?: TileType;
  /** Whether the slot is full after this operation (game over condition) */
  slotFull: boolean;
}

/**
 * Add a tile to the slot and check for 3-match.
 *
 * Insertion rule: place the new item next to an existing item of the same type.
 * If no same-type item exists, append to the end.
 */
export function addToSlotAndMatch(
  currentSlot: SlotItem[],
  newItem: SlotItem,
): MatchResult {
  // Clone the slot
  const slot = [...currentSlot];

  // Find insertion index: next to same-type item
  let insertIdx = slot.length; // default: append
  for (let i = slot.length - 1; i >= 0; i--) {
    if (slot[i].type === newItem.type) {
      insertIdx = i + 1;
      break;
    }
  }

  // Insert
  slot.splice(insertIdx, 0, newItem);

  // Count same-type items
  const sameTypeCount = slot.filter((s) => s.type === newItem.type).length;

  if (sameTypeCount >= 3) {
    // Remove all items of this type
    const filtered = slot.filter((s) => s.type !== newItem.type);
    return {
      slotItems: filtered,
      matched: true,
      matchedType: newItem.type,
      slotFull: false, // just cleared some, can't be full
    };
  }

  // No match
  const isFull = slot.length >= MAX_SLOT;
  return {
    slotItems: slot,
    matched: false,
    slotFull: isFull,
  };
}

/**
 * Remove the last added item from the slot (Undo).
 * Returns the removed item or null.
 */
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
