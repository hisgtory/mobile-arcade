/**
 * Tile grid — renders tiles using absolute positioning
 * Supports multi-layer overlapping (upper layers offset by 0.5 cells)
 */

import React from 'react';
import { styled } from '@stitches/react';
import { type TileData } from '../types';
import { isTileBlocked } from '../logic/board';
import { Tile } from './Tile';

const GridContainer = styled('div', {
  position: 'relative',
  margin: '0 auto',
});

interface TileGridProps {
  tiles: TileData[];
  cols: number;
  rows: number;
  layers: number;
  tileSize: number;
  gap: number;
  onTileTap: (tile: TileData) => void;
}

export const TileGrid: React.FC<TileGridProps> = ({
  tiles,
  cols,
  rows,
  layers,
  tileSize,
  gap,
  onTileTap,
}) => {
  const extraOffset = (layers - 1) * 0.5;
  const effectiveCols = cols + extraOffset;
  const effectiveRows = rows + extraOffset;
  const gridWidth = effectiveCols * (tileSize + gap) - gap;
  const gridHeight = effectiveRows * (tileSize + gap) - gap;

  // Sort tiles: lower layers first so upper layers render on top
  const sorted = [...tiles].sort((a, b) => a.layer - b.layer);

  return (
    <GridContainer css={{ width: gridWidth, height: gridHeight }}>
      {sorted.map((tile) => {
        const blocked = isTileBlocked(tile, tiles);
        const left = tile.col * (tileSize + gap);
        const top = tile.row * (tileSize + gap);

        return (
          <div
            key={tile.id}
            style={{
              position: 'absolute',
              left,
              top,
              zIndex: tile.layer * 10,
              transition: 'opacity 0.2s ease',
            }}
          >
            <Tile
              tileType={tile.type}
              state={blocked ? 'blocked' : 'active'}
              size={tileSize}
              onClick={() => onTileTap(tile)}
            />
          </div>
        );
      })}
    </GridContainer>
  );
};
