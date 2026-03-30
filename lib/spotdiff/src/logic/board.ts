import {
  SHAPE_TYPES,
  SHAPE_COLORS,
  MAX_LIVES,
  type ShapeType,
  type ShapeItem,
  type DiffType,
  type Difference,
  type StageConfig,
  type BoardState,
} from '../types';

// Spatial bounds for shape placement (logical px, relative to panel)
const SHAPE_MIN_X = 20;
const SHAPE_MAX_X = 370;
const SHAPE_MIN_Y = 20;
const SHAPE_MAX_Y = 250;
const SHAPE_MIN_SIZE = 15;
const SHAPE_SIZE_RANGE = 20;

// Position-diff offset range
const MIN_POSITION_OFFSET = 8;
const POSITION_OFFSET_RANGE = 7;

// Size-diff factor range
const SIZE_SHRINK_MIN = 0.5;
const SIZE_SHRINK_RANGE = 0.2;
const SIZE_GROW_MIN = 1.3;
const SIZE_GROW_RANGE = 0.2;

export function createBoard(config: StageConfig): BoardState {
  const shapes: ShapeItem[] = [];
  for (let i = 0; i < config.shapeCount; i++) {
    shapes.push({
      id: i,
      type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
      x: SHAPE_MIN_X + Math.random() * (SHAPE_MAX_X - SHAPE_MIN_X),
      y: SHAPE_MIN_Y + Math.random() * (SHAPE_MAX_Y - SHAPE_MIN_Y),
      size: SHAPE_MIN_SIZE + Math.random() * SHAPE_SIZE_RANGE,
      color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
    });
  }

  // Select diffCount shapes via Fisher-Yates partial shuffle
  const indices = shapes.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const diffIndices = indices.slice(0, config.diffCount);

  const differences: Difference[] = diffIndices.map((shapeIdx, diffId) => {
    const shape = shapes[shapeIdx];
    const diffType = config.diffTypes[Math.floor(Math.random() * config.diffTypes.length)];
    let origValue: unknown;
    let diffValue: unknown;

    switch (diffType) {
      case 'color': {
        origValue = shape.color;
        const otherColors = SHAPE_COLORS.filter((c) => c !== shape.color);
        diffValue = otherColors[Math.floor(Math.random() * otherColors.length)];
        break;
      }
      case 'shape': {
        origValue = shape.type;
        const otherTypes = SHAPE_TYPES.filter((t) => t !== shape.type);
        diffValue = otherTypes[Math.floor(Math.random() * otherTypes.length)];
        break;
      }
      case 'missing': {
        origValue = false;
        diffValue = true;
        break;
      }
      case 'position': {
        const offsetX = (MIN_POSITION_OFFSET + Math.random() * POSITION_OFFSET_RANGE) * (Math.random() < 0.5 ? -1 : 1);
        const offsetY = (MIN_POSITION_OFFSET + Math.random() * POSITION_OFFSET_RANGE) * (Math.random() < 0.5 ? -1 : 1);
        origValue = { x: shape.x, y: shape.y };
        const newX = Math.max(SHAPE_MIN_X, Math.min(SHAPE_MAX_X, shape.x + offsetX));
        const newY = Math.max(SHAPE_MIN_Y, Math.min(SHAPE_MAX_Y, shape.y + offsetY));
        diffValue = { x: newX, y: newY };
        break;
      }
      case 'size': {
        origValue = shape.size;
        const factor = Math.random() < 0.5
          ? SIZE_SHRINK_MIN + Math.random() * SIZE_SHRINK_RANGE
          : SIZE_GROW_MIN + Math.random() * SIZE_GROW_RANGE;
        diffValue = shape.size * factor;
        break;
      }
    }

    return {
      id: diffId,
      shapeId: shape.id,
      type: diffType,
      origValue,
      diffValue,
      found: false,
      x: shape.x,
      y: shape.y,
    };
  });

  return {
    shapes,
    differences,
    foundCount: 0,
    lives: MAX_LIVES,
    maxLives: MAX_LIVES,
  };
}

export function checkTap(board: BoardState, x: number, y: number, hitRadius: number): number | null {
  for (const diff of board.differences) {
    if (diff.found) continue;
    const dx = diff.x - x;
    const dy = diff.y - y;
    if (dx * dx + dy * dy <= hitRadius * hitRadius) {
      return diff.id;
    }
  }
  return null;
}

export function markFound(board: BoardState, diffId: number): BoardState {
  return {
    ...board,
    differences: board.differences.map((d) =>
      d.id === diffId ? { ...d, found: true } : d,
    ),
    foundCount: board.foundCount + 1,
  };
}

export function isAllFound(board: BoardState): boolean {
  return board.foundCount >= board.differences.length;
}

export function loseLife(board: BoardState): BoardState {
  return {
    ...board,
    lives: board.lives - 1,
  };
}

export function isGameOver(board: BoardState): boolean {
  return board.lives <= 0;
}
