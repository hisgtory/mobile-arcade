/**
 * Board generation logic for found3
 * Copied from lib/found3/src/logic/board.ts — Phaser-free
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

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function distributeTilesAcrossLayers(totalTiles: number, layerCount: number): number[] {
  if (layerCount <= 1) return [totalTiles];

  const weights: number[] = [];
  for (let i = 0; i < layerCount; i++) {
    weights.push(layerCount - i);
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / totalWeight) * totalTiles);
  const counts = raw.map((r) => Math.round(r / 3) * 3);

  for (let i = 0; i < counts.length; i++) {
    if (counts[i] < 3) counts[i] = 3;
  }

  let sum = counts.reduce((a, b) => a + b, 0);
  while (sum > totalTiles) { counts[0] -= 3; sum -= 3; }
  while (sum < totalTiles) { counts[0] += 3; sum += 3; }
  if (counts[0] < 3) counts[0] = 3;

  return counts;
}

export function generateBoard(config: StageConfig): TileData[] {
  const { typeCount, cols, rows, layers } = config;
  const tileCount = typeCount * 3;

  const types: number[] = [];
  for (let t = 0; t < typeCount; t++) {
    types.push(t, t, t);
  }
  shuffle(types);

  if (layers <= 1) {
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

  const layerCounts = distributeTilesAcrossLayers(tileCount, layers);
  let typeIdx = 0;
  const tiles: TileData[] = [];

  for (let layer = 0; layer < layers; layer++) {
    const count = layerCounts[layer];
    const layerCols = Math.max(2, cols - layer);
    const layerRows = Math.max(2, rows - layer);
    const maxCells = layerCols * layerRows;

    const positions: { col: number; row: number }[] = [];
    for (let r = 0; r < layerRows; r++) {
      for (let c = 0; c < layerCols; c++) {
        positions.push({ col: c, row: r });
      }
    }
    shuffle(positions);

    for (let i = 0; i < count; i++) {
      const pos = positions[i % maxCells];
      const offset = layer * 0.5;
      
      // Tile Explorer style: add slight random jitter (0, 0.25, or -0.25) 
      // to make it look more organic and ensure overlaps
      const jitter = (Math.floor(Math.random() * 3) - 1) * 0.25;
      
      tiles.push({
        id: nextTileId(),
        type: types[typeIdx],
        col: pos.col + offset + jitter,
        row: pos.row + offset + jitter,
        layer,
      });
      typeIdx++;
    }
  }

  return tiles;
}

/**
 * Check if a tile is blocked by any tile on a higher layer.
 * A tile is blocked if any upper-layer tile overlaps it.
 */
export function isTileBlocked(tile: TileData, allTiles: TileData[]): boolean {
  for (const other of allTiles) {
    if (other.layer <= tile.layer) continue;
    // Overlap check: tiles overlap if their cell regions intersect
    const dx = Math.abs(other.col - tile.col);
    const dy = Math.abs(other.row - tile.row);
    // Use 0.9 instead of 1 to be a bit more lenient with random jitter
    if (dx < 0.9 && dy < 0.9) return true;
  }
  return false;
}
