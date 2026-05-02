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
  for (let i = 0; i < layerCount; i++) weights.push(layerCount - i);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / totalWeight) * totalTiles);
  const counts = raw.map((r) => Math.round(r / 3) * 3);
  for (let i = 0; i < counts.length; i++) if (counts[i] < 3) counts[i] = 3;
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
  for (let t = 0; t < typeCount; t++) types.push(t, t, t);
  shuffle(types);

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
      for (let c = 0; c < layerCols; c++) positions.push({ col: c, row: r });
    }
    shuffle(positions);

    for (let i = 0; i < count; i++) {
      const pos = positions[i % maxCells];
      const offset = layer * 0.5;
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
 * 타일의 '점수'를 계산하여 누가 위에 있는지 판단합니다.
 * 레이어가 높을수록, 같은 레이어라면 ID 숫자가 클수록 위에 있습니다.
 */
function getTileStackOrder(tile: TileData): number {
  const idNum = parseInt(tile.id.replace('tile_', ''), 10) || 0;
  return tile.layer * 10000 + idNum;
}

/**
 * Check if a tile is blocked by any tile on top of it.
 */
export function isTileBlocked(tile: TileData, allTiles: TileData[]): boolean {
  const myOrder = getTileStackOrder(tile);
  
  for (const other of allTiles) {
    if (other.id === tile.id) continue;
    
    // 나보다 아래에 있는 타일은 나를 막을 수 없음
    if (getTileStackOrder(other) <= myOrder) continue;

    // 물리적 겹침 체크 (좌표 차이가 1.0 미만이면 겹침)
    const dx = Math.abs(other.col - tile.col);
    const dy = Math.abs(other.row - tile.row);
    
    if (dx < 1.0 && dy < 1.0) return true;
  }
  return false;
}

export function shuffleBoard(tiles: TileData[]): TileData[] {
  const types = tiles.map(t => t.type);
  shuffle(types);
  return tiles.map((tile, index) => ({ ...tile, type: types[index] }));
}
