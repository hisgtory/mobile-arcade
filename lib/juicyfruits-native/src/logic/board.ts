/**
 * Board generation logic for found3
 */

import { TileData, StageConfig } from '../types';
import { isInsideShape } from './shapes';

const OVERLAP_THRESHOLD = 0.25;
const OVERLAP_SHIFTS: Array<[number, number]> = [
  [0, 0],
  [0.25, 0], [0, 0.25], [0.25, 0.25],
  [0.5, 0], [0, 0.5], [0.5, 0.25], [0.25, 0.5],
  [0.5, 0.5],
];

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
  const { typeCount, cols, rows, layers, shape = 'rect', tileCount: configTileCount } = config;
  // setMultiplier 반영: stage.ts가 계산한 tileCount(=typeCount*3*setMultiplier)를 사용
  const setMultiplier = Math.max(1, Math.round(configTileCount / (typeCount * 3)));
  const tileCount = typeCount * 3 * setMultiplier;

  const layerCounts = distributeTilesAcrossLayers(tileCount, layers);

  // Solvability 휴리스틱: 매칭 그룹(같은 타입 3개)을 한 레이어 안에 통째로 배치.
  // → 어떤 타입이든 같은 레이어 안에서 자체 매칭 가능 → 데드락 위험 최소화
  // 전제: layerCounts[i]는 모두 3의 배수 (distributeTilesAcrossLayers 보장)
  const matchGroups: number[] = [];
  for (let t = 0; t < typeCount; t++) {
    for (let s = 0; s < setMultiplier; s++) matchGroups.push(t);
  }
  shuffle(matchGroups);

  const types: number[] = [];
  let groupIdx = 0;
  for (let layer = 0; layer < layers; layer++) {
    const groupsInLayer = Math.floor(layerCounts[layer] / 3);
    for (let g = 0; g < groupsInLayer; g++) {
      const t = matchGroups[groupIdx++];
      types.push(t, t, t);
    }
  }

  let typeIdx = 0;
  const tiles: TileData[] = [];

  for (let layer = 0; layer < layers; layer++) {
    const count = layerCounts[layer];
    const layerCols = Math.max(2, cols - layer);
    const layerRows = Math.max(2, rows - layer);
    
    // 모양 안에 포함되는 유효한 포지션만 먼저 필터링
    const validPositions: { col: number; row: number }[] = [];
    for (let r = 0; r < layerRows; r++) {
      for (let c = 0; c < layerCols; c++) {
        if (isInsideShape(shape, c, r, layerCols, layerRows)) {
          validPositions.push({ col: c, row: r });
        }
      }
    }
    
    // 만약 모양 필터링으로 인해 자리가 부족하면 강제로 사각형 영역 사용 (안전장치)
    const positionsToUse = validPositions.length >= count 
      ? validPositions 
      : Array.from({ length: layerCols * layerRows }, (_, i) => ({ col: i % layerCols, row: Math.floor(i / layerCols) }));
    
    shuffle(positionsToUse);

    for (let i = 0; i < count; i++) {
      const pos = positionsToUse[i % positionsToUse.length];
      const offset = layer * 0.5;
      const jitter = Math.floor(Math.random() * 2) * 0.25;
      const baseCol = pos.col + offset + jitter;
      const baseRow = pos.row + offset + jitter;

      // 같은 레이어 내 75% 이상 겹침 방지: dx<0.25 && dy<0.25 인 경우 양수 방향으로 shift
      let finalCol = baseCol;
      let finalRow = baseRow;
      for (const [dc, dr] of OVERLAP_SHIFTS) {
        const c = baseCol + dc;
        const r = baseRow + dr;
        const conflict = tiles.some(t =>
          t.layer === layer &&
          Math.abs(t.col - c) < OVERLAP_THRESHOLD &&
          Math.abs(t.row - r) < OVERLAP_THRESHOLD
        );
        if (!conflict) {
          finalCol = c;
          finalRow = r;
          break;
        }
      }

      tiles.push({
        id: nextTileId(),
        type: types[typeIdx],
        col: finalCol,
        row: finalRow,
        layer,
      });
      typeIdx++;
    }
  }
  return tiles;
}

function getTileStackOrder(tile: TileData): number {
  const idNum = parseInt(tile.id.replace('tile_', ''), 10) || 0;
  return tile.layer * 10000 + idNum;
}

export function isTileBlocked(tile: TileData, allTiles: TileData[]): boolean {
  const myOrder = getTileStackOrder(tile);
  for (const other of allTiles) {
    if (other.id === tile.id) continue;
    if (getTileStackOrder(other) <= myOrder) continue;
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
