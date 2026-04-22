import type { TileData, BoardState, StageConfig } from '../types';

// ─── Layout Definitions ──────────────────────────────────

interface LayerDef {
  cols: number;
  rows: number;
}

/**
 * Return rectangular grid dimensions for each layer.
 * Bottom layer is the largest; each subsequent layer is smaller and centred.
 * Total tile count across all layers equals the stage's totalTiles target.
 */
function getLayerDefs(config: StageConfig): LayerDef[] {
  const t = config.totalTiles;
  const l = config.layers;

  if (l === 3 && t <= 36) {
    return [
      { cols: 6, rows: 3 }, // 18
      { cols: 4, rows: 3 }, // 12
      { cols: 3, rows: 2 }, //  6  → 36
    ];
  }
  if (l === 3 && t <= 48) {
    return [
      { cols: 8, rows: 4 }, // 32
      { cols: 4, rows: 3 }, // 12
      { cols: 2, rows: 2 }, //  4  → 48
    ];
  }
  if (l === 4 && t <= 60) {
    return [
      { cols: 8, rows: 4 }, // 32
      { cols: 6, rows: 3 }, // 18
      { cols: 4, rows: 2 }, //  8
      { cols: 1, rows: 2 }, //  2  → 60
    ];
  }
  if (l === 4 && t <= 72) {
    return [
      { cols: 8, rows: 5 }, // 40
      { cols: 6, rows: 3 }, // 18
      { cols: 4, rows: 3 }, // 12
      { cols: 1, rows: 2 }, //  2  → 72
    ];
  }
  if (l === 5 && t <= 84) {
    return [
      { cols: 8, rows: 5 }, // 40
      { cols: 6, rows: 4 }, // 24
      { cols: 4, rows: 3 }, // 12
      { cols: 3, rows: 2 }, //  6
      { cols: 1, rows: 2 }, //  2  → 84
    ];
  }

  // Generic fallback for stages beyond 5
  const defs: LayerDef[] = [];
  let remaining = t;
  for (let z = 0; z < l; z++) {
    if (remaining <= 0) break;
    const scale = (l - z) / l;
    const baseCols = Math.max(2, Math.round(8 * scale));
    const baseRows = Math.max(1, Math.round(5 * scale));
    let count = baseCols * baseRows;
    if (count > remaining) count = remaining;
    if (count % 2 !== 0 && count > 1) count--;
    if (count <= 0) break;
    const cols = Math.max(1, Math.round(Math.sqrt(count * 1.6)));
    const rows = Math.max(1, Math.round(count / cols));
    defs.push({ cols, rows });
    remaining -= cols * rows;
  }
  // Ensure at least one layer
  if (defs.length === 0) {
    defs.push({ cols: 2, rows: 1 });
  }
  // Fix parity – total must be even
  const total = defs.reduce((s, d) => s + d.cols * d.rows, 0);
  if (total % 2 !== 0 && defs.length > 0) {
    const last = defs[defs.length - 1];
    if (last.cols * last.rows > 2) {
      last.cols = Math.max(1, last.cols - 1);
    } else {
      last.rows = last.rows + 1;
    }
  }
  return defs;
}

/**
 * Build an array of grid positions for every tile slot in the layout.
 * Upper layers are centred within the bottom layer's footprint.
 */
function generatePositions(
  layerDefs: LayerDef[],
): { x: number; y: number; z: number }[] {
  const positions: { x: number; y: number; z: number }[] = [];
  const baseCols = layerDefs[0].cols;
  const baseRows = layerDefs[0].rows;

  for (let z = 0; z < layerDefs.length; z++) {
    const { cols, rows } = layerDefs[z];
    const offX = Math.floor((baseCols - cols) / 2);
    const offY = Math.floor((baseRows - rows) / 2);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        positions.push({ x: x + offX, y: y + offY, z });
      }
    }
  }
  return positions;
}

// ─── Helpers ─────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ─── Free / Match Logic ─────────────────────────────────

/** A tile is free if nothing sits above it and at least one side is open. */
export function isFree(tile: TileData, tiles: TileData[]): boolean {
  if (tile.removed) return false;

  const active = tiles.filter((t) => !t.removed && t.id !== tile.id);

  // Blocked from above? Any active tile at z+1 that overlaps this position.
  // Two tiles overlap when their grid distance is less than 1 in both axes.
  const hasAbove = active.some(
    (t) =>
      t.gridZ === tile.gridZ + 1 &&
      Math.abs(t.gridX - tile.gridX) < 1 &&
      Math.abs(t.gridY - tile.gridY) < 1,
  );
  if (hasAbove) return false;

  // Left / right blocking (same z, same y)
  const blockedLeft = active.some(
    (t) =>
      t.gridZ === tile.gridZ &&
      t.gridX === tile.gridX - 1 &&
      t.gridY === tile.gridY,
  );
  const blockedRight = active.some(
    (t) =>
      t.gridZ === tile.gridZ &&
      t.gridX === tile.gridX + 1 &&
      t.gridY === tile.gridY,
  );

  return !blockedLeft || !blockedRight;
}

/** Same type, different id, both not removed, both free. */
export function canMatch(
  a: TileData,
  b: TileData,
  tiles: TileData[],
): boolean {
  return (
    a.id !== b.id &&
    !a.removed &&
    !b.removed &&
    a.typeIndex === b.typeIndex &&
    isFree(a, tiles) &&
    isFree(b, tiles)
  );
}

/** Return every currently matchable pair. */
export function findAllMatches(tiles: TileData[]): [TileData, TileData][] {
  const free = tiles.filter((t) => !t.removed && isFree(t, tiles));
  const pairs: [TileData, TileData][] = [];

  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (free[i].typeIndex === free[j].typeIndex) {
        pairs.push([free[i], free[j]]);
      }
    }
  }
  return pairs;
}

export function isWon(tiles: TileData[]): boolean {
  return tiles.every((t) => t.removed);
}

export function isStuck(tiles: TileData[]): boolean {
  if (isWon(tiles)) return false;
  return findAllMatches(tiles).length === 0;
}

export function removePair(
  tiles: TileData[],
  a: TileData,
  b: TileData,
): TileData[] {
  return tiles.map((t) => {
    if (t.id === a.id || t.id === b.id) return { ...t, removed: true };
    return t;
  });
}

/**
 * Shuffle typeIndex values of remaining tiles while preserving positions.
 * Retries until at least one valid match exists.
 * Returns null if shuffle is impossible (e.g. fewer than 2 free tiles).
 */
export function shuffleBoard(tiles: TileData[]): TileData[] | null {
  const remaining = tiles.filter((t) => !t.removed);
  if (remaining.length < 2) return null;

  const free = remaining.filter((t) => isFree(t, tiles));
  if (free.length < 2) return null;

  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const types = remaining.map((t) => t.typeIndex);
    shuffleArray(types);

    const newTiles = tiles.map((t) => ({ ...t }));
    let idx = 0;
    for (const nt of newTiles) {
      if (!nt.removed) {
        nt.typeIndex = types[idx++];
      }
    }

    if (findAllMatches(newTiles).length > 0) return newTiles;
  }

  // Fallback: force one matching pair among free tiles
  const result = tiles.map((t) => ({ ...t }));
  const remTypes = remaining.map((t) => t.typeIndex);
  shuffleArray(remTypes);
  let idx = 0;
  for (const nt of result) {
    if (!nt.removed) nt.typeIndex = remTypes[idx++];
  }
  const freeResult = result.filter((t) => !t.removed && isFree(t, result));
  if (freeResult.length >= 2) {
    freeResult[1].typeIndex = freeResult[0].typeIndex;
    return result;
  }

  // Cannot produce a valid shuffle
  return null;
}

// ─── Board Creation (Reverse Generation) ─────────────────

/**
 * Check if a tile is "free" during reverse generation.
 * In this context, tiles NOT yet in the `assigned` set are still present on the
 * board; assigned tiles have been virtually removed.
 */
function isFreeForGen(
  tile: TileData,
  allTiles: TileData[],
  assigned: Set<number>,
): boolean {
  const present = allTiles.filter(
    (t) => !assigned.has(t.id) && t.id !== tile.id,
  );

  const hasAbove = present.some(
    (t) =>
      t.gridZ === tile.gridZ + 1 &&
      Math.abs(t.gridX - tile.gridX) < 1 &&
      Math.abs(t.gridY - tile.gridY) < 1,
  );
  if (hasAbove) return false;

  const blockedLeft = present.some(
    (t) =>
      t.gridZ === tile.gridZ &&
      t.gridX === tile.gridX - 1 &&
      t.gridY === tile.gridY,
  );
  const blockedRight = present.some(
    (t) =>
      t.gridZ === tile.gridZ &&
      t.gridX === tile.gridX + 1 &&
      t.gridY === tile.gridY,
  );

  return !blockedLeft || !blockedRight;
}

/**
 * Generate a guaranteed-solvable Mahjong board using reverse generation.
 *
 * 1. Lay out all tile positions (pyramid / turtle formation).
 * 2. Starting from the top of the stack, repeatedly pick two free tiles,
 *    assign them the same type, and virtually remove them.
 * 3. Because every pair was removable at the moment it was assigned, playing
 *    pairs back in reverse order is always a valid solution.
 */
export function createBoard(config: StageConfig): BoardState {
  const maxBoardAttempts = 50;

  for (let attempt = 0; attempt < maxBoardAttempts; attempt++) {
    const layerDefs = getLayerDefs(config);
    const positions = generatePositions(layerDefs);

    // Ensure even tile count
    if (positions.length % 2 !== 0) positions.pop();

    const tiles: TileData[] = positions.map((pos, i) => ({
      id: i,
      typeIndex: -1,
      gridX: pos.x,
      gridY: pos.y,
      gridZ: pos.z,
      removed: false,
    }));

    // Build a type pool – cycle through numTypes
    const numPairs = tiles.length / 2;
    const typePool: number[] = [];
    for (let i = 0; i < numPairs; i++) {
      typePool.push(i % config.numTypes);
    }
    shuffleArray(typePool);

    // Reverse generation
    const assigned = new Set<number>();
    let pairIdx = 0;
    let ok = true;

    while (pairIdx < numPairs) {
      const freeTiles = tiles.filter(
        (t) => !assigned.has(t.id) && isFreeForGen(t, tiles, assigned),
      );

      if (freeTiles.length < 2) {
        ok = false;
        break;
      }

      shuffleArray(freeTiles);
      const a = freeTiles[0];
      const b = freeTiles[1];

      a.typeIndex = typePool[pairIdx];
      b.typeIndex = typePool[pairIdx];
      assigned.add(a.id);
      assigned.add(b.id);
      pairIdx++;
    }

    if (ok) {
      tiles.forEach((t) => {
        t.removed = false;
      });
      return { tiles, numTypes: config.numTypes };
    }
  }

  throw new Error(
    'Failed to generate a solvable mahjong board after max attempts',
  );
}
