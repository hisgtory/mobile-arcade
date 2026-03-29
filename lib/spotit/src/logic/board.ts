/**
 * Board logic for SpotIt — Hidden Object Game
 *
 * Generates a board with items scattered across a grid.
 * Some items are targets the player must find, others are distractors.
 */

import type { StageConfig, ItemData, ItemType } from '../types';
import { ITEM_IMAGES } from '../types';

let idCounter = 0;

function nextId(): string {
  return `item-${++idCounter}`;
}

/** Shuffle array in-place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a board of items.
 * Returns:
 * - items: all items on the board
 * - targetTypes: the item types the player needs to find
 */
export function generateBoard(config: StageConfig): {
  items: ItemData[];
  targetTypes: ItemType[];
} {
  const { totalItems, targetCount, typeCount, cols, rows } = config;
  const itemCount = Math.min(totalItems, cols * rows);

  // Pick which types to use from all available
  const availableTypes = Array.from({ length: Math.min(typeCount, ITEM_IMAGES.length) }, (_, i) => i);
  shuffle(availableTypes);

  // Pick target types (first N shuffled types)
  const targetTypes = availableTypes.slice(0, targetCount);
  const distractorTypes = availableTypes.slice(targetCount);

  // Build items list: one of each target type, fill rest with distractors
  const itemTypes: ItemType[] = [];

  // Add exactly one of each target type
  for (const t of targetTypes) {
    itemTypes.push(t);
  }

  // Fill rest with distractors
  const remaining = itemCount - targetCount;
  for (let i = 0; i < remaining; i++) {
    if (distractorTypes.length > 0) {
      itemTypes.push(distractorTypes[i % distractorTypes.length]);
    } else {
      // fallback: use non-target types
      itemTypes.push(availableTypes[targetCount + (i % Math.max(1, availableTypes.length - targetCount))]);
    }
  }

  shuffle(itemTypes);

  // Generate grid positions
  const positions: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({ x: c, y: r });
    }
  }
  shuffle(positions);

  const items: ItemData[] = [];
  for (let i = 0; i < itemCount; i++) {
    const pos = positions[i];
    const type = itemTypes[i];
    const isTarget = targetTypes.includes(type) && !items.some(it => it.type === type && it.isTarget);

    items.push({
      id: nextId(),
      type,
      x: pos.x,
      y: pos.y,
      rotation: (Math.random() - 0.5) * 20,
      scale: 0.85 + Math.random() * 0.3,
      isTarget: isTarget,
      found: false,
    });
  }

  // Ensure all target types have exactly one target item
  for (const t of targetTypes) {
    const hasTarget = items.some(it => it.type === t && it.isTarget);
    if (!hasTarget) {
      // Find any item with this type and mark it as target
      const item = items.find(it => it.type === t);
      if (item) item.isTarget = true;
    }
  }

  return { items, targetTypes };
}
