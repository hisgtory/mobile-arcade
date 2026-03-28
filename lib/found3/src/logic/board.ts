/**
 * Board generation logic for found3
 *
 * Creates a multi-layer grid of tiles. Every tile type appears exactly 3 times.
 * Upper layer tiles are offset by half a cell to create an overlapping effect.
 * Lower layer tiles covered by upper layer tiles cannot be selected.
 */

import { TileData, StageConfig } from '../types';

let _nextId = 0;
function nextTileId(): string {
  return `tile_${_nextId++}`;
}

/** Reset id counter (useful for tests) */
export function resetIdCounter(): void {
  _nextId = 0;
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Distribute tile count across layers.
 * Lower layers get more tiles. Each layer's count must be a multiple of 3.
 * Returns array of tile counts per layer, e.g. [18, 12, 6].
 */
function distributeTilesAcrossLayers(totalTiles: number, layerCount: number): number[] {
  if (layerCount <= 1) return [totalTiles];

  // We need each layer to be a multiple of 3.
  // Strategy: give ~50% to layer 0, ~33% to layer 1, rest to layer 2, etc.
  // Then round each to nearest multiple of 3 and adjust.
  const weights: number[] = [];
  for (let i = 0; i < layerCount; i++) {
    // Decreasing weight: bottom layer gets most tiles
    weights.push(layerCount - i);
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const raw = weights.map((w) => (w / totalWeight) * totalTiles);

  // Round each to nearest multiple of 3
  const counts = raw.map((r) => Math.round(r / 3) * 3);

  // Ensure minimum 3 per layer
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] < 3) counts[i] = 3;
  }

  // Adjust to match total: add/remove 3 from the bottom layer
  let sum = counts.reduce((a, b) => a + b, 0);
  while (sum > totalTiles) {
    counts[0] -= 3;
    sum -= 3;
  }
  while (sum < totalTiles) {
    counts[0] += 3;
    sum += 3;
  }

  // Safety: ensure no layer has 0 or negative
  if (counts[0] < 3) counts[0] = 3;

  return counts;
}

/**
 * Generate a shuffled multi-layer board of tiles.
 * Each tile type from 0..(typeCount-1) appears exactly 3 times.
 * Tiles are distributed across layers with upper layers offset by 0.5 cells.
 */
export function generateBoard(config: StageConfig): TileData[] {
  const { typeCount, cols, rows, layers } = config;
  const tileCount = typeCount * 3;

  // Build type array: each type 3 times
  const types: number[] = [];
  for (let t = 0; t < typeCount; t++) {
    types.push(t, t, t);
  }
  shuffle(types);

  if (layers <= 1) {
    // Single layer: flat grid, same as before
    const tiles: TileData[] = [];
    for (let i = 0; i < tileCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      tiles.push({
        id: nextTileId(),
        type: types[i],
        col,
        row: row < rows ? row : row % rows,
        layer: 0,
      });
    }
    return tiles;
  }

  // Multi-layer distribution
  const layerCounts = distributeTilesAcrossLayers(tileCount, layers);
  let typeIdx = 0;
  const tiles: TileData[] = [];

  for (let layer = 0; layer < layers; layer++) {
    const count = layerCounts[layer];
    // Each upper layer uses a smaller grid area, shrunk by 1 col and 1 row per layer
    const layerCols = Math.max(2, cols - layer);
    const layerRows = Math.max(2, rows - layer);
    const maxCells = layerCols * layerRows;

    // Determine positions for this layer
    const positions: { col: number; row: number }[] = [];
    for (let r = 0; r < layerRows; r++) {
      for (let c = 0; c < layerCols; c++) {
        positions.push({ col: c, row: r });
      }
    }
    shuffle(positions);

    // Take as many positions as we have tiles (may wrap if count > maxCells)
    for (let i = 0; i < count; i++) {
      const pos = positions[i % maxCells];
      // Upper layers offset by 0.5 per layer
      const offset = layer * 0.5;
      tiles.push({
        id: nextTileId(),
        type: types[typeIdx],
        col: pos.col + offset,
        row: pos.row + offset,
        layer,
      });
      typeIdx++;
    }
  }

  return tiles;
}

/**
 * Get board layout dimensions in pixels.
 */
export function getBoardLayout(
  config: StageConfig,
  tileSize: number,
  gap: number,
  offsetX: number,
  offsetY: number,
) {
  // Account for extra space needed by upper layer offsets
  const extraOffset = (config.layers - 1) * 0.5;
  const effectiveCols = config.cols + extraOffset;
  const effectiveRows = config.rows + extraOffset;
  const boardWidth = effectiveCols * (tileSize + gap) - gap;
  const boardHeight = effectiveRows * (tileSize + gap) - gap;
  return {
    boardWidth,
    boardHeight,
    startX: offsetX - boardWidth / 2,
    startY: offsetY - boardHeight / 2,
    tileSize,
    gap,
  };
}

/**
 * Convert grid position (col, row) to pixel position.
 * Supports fractional col/row for offset layers.
 */
export function gridToPixel(
  col: number,
  row: number,
  tileSize: number,
  gap: number,
  startX: number,
  startY: number,
): { x: number; y: number } {
  return {
    x: startX + col * (tileSize + gap) + tileSize / 2,
    y: startY + row * (tileSize + gap) + tileSize / 2,
  };
}
