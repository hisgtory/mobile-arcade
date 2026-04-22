/**
 * Board logic for SpotIt — Hidden Object Game
 *
 * Generates a board with items scattered across a grid.
 * Some items are targets the player must find, others are distractors.
 */

import type { StageConfig, ItemData, ItemType } from '../types';
import { ITEM_IMAGES } from '../types';

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
  const maxTypes = Math.min(typeCount, ITEM_IMAGES.length);
  const availableTypes = Array.from({ length: maxTypes }, (_, i) => i);
  shuffle(availableTypes);

  // Pick target types (first N shuffled types)
  const targetTypes = availableTypes.slice(0, Math.min(targetCount, availableTypes.length));
  const distractorTypes = availableTypes.slice(targetTypes.length);

  // Build items list: one of each target type, fill rest with distractors
  const itemTypes: ItemType[] = [];

  // Add exactly one of each target type
  for (const t of targetTypes) {
    itemTypes.push(t);
  }

  // Fill rest with distractors
  const remaining = itemCount - targetTypes.length;
  for (let i = 0; i < remaining; i++) {
    if (distractorTypes.length > 0) {
      itemTypes.push(distractorTypes[i % distractorTypes.length]);
    } else {
      // fallback: reuse a random type if no distractors left
      itemTypes.push(availableTypes[i % availableTypes.length]);
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
  const assignedTargetTypes = new Set<ItemType>();
  let localIdCounter = 0;

  for (let i = 0; i < itemCount; i++) {
    const pos = positions[i];
    const type = itemTypes[i];
    const isTarget = targetTypes.includes(type) && !assignedTargetTypes.has(type);

    if (isTarget) {
      assignedTargetTypes.add(type);
    }

    items.push({
      id: `item-${++localIdCounter}`,
      type,
      x: pos.x,
      y: pos.y,
      rotation: (Math.random() - 0.5) * 20,
      scale: 0.85 + Math.random() * 0.3,
      isTarget,
      found: false,
    });
  }

  // Safety: ensure every target type has exactly one target item
  for (const t of targetTypes) {
    if (!assignedTargetTypes.has(t)) {
      const item = items.find(it => it.type === t);
      if (item) {
        item.isTarget = true;
        assignedTargetTypes.add(t);
      }
    }
  }

  return { items, targetTypes };
}
