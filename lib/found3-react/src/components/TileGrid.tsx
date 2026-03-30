/**
 * Tile grid — renders tiles using absolute positioning
 * Supports multi-layer overlapping (upper layers offset by 0.5 cells)
 *
 * Visual parity: dark board background (#e8eaed) matching Phaser PlayScene
 */

import React from 'react';
import { styled } from '@stitches/react';
import { type TileData } from '../types';
import { isTileBlocked } from '../logic/board';
import { Tile } from './Tile';

const GridContainer = styled('div', {
  position: 'relative',
  margin: '0 auto',
  backgroundColor: '#c9cdd4',
  borderRadius: '12px',
  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.12)',
});

interface TileGridProps {
  tiles: TileData[];
  cols: number;
  rows: number;
  layers: number;
  tileSize: number;
  gap: number;
  hintTileIds?: Set<string>;
  onTileTap: (tile: TileData) => void;
}

export const TileGrid: React.FC<TileGridProps> = ({
  tiles,
  cols,
  rows,
  layers,
  tileSize,
  gap,
  hintTileIds,
  onTileTap,
}) => {
  const extraOffset = (layers - 1) * 0.5;
  const effectiveCols = cols + extraOffset;
  const effectiveRows = rows + extraOffset;
  const gridWidth = effectiveCols * (tileSize + gap) - gap;
  const gridHeight = effectiveRows * (tileSize + gap) - gap;

  // Padding inside the board background
  const boardPad = 8;

  // Sort tiles: lower layers first so upper layers render on top
  const sorted = [...tiles].sort((a, b) => a.layer - b.layer);

  return (
    <GridContainer
      css={{
        width: gridWidth + boardPad * 2,
        height: gridHeight + boardPad * 2,
        padding: boardPad,
      }}
    >
      {sorted.map((tile) => {
        const blocked = isTileBlocked(tile, tiles);
        const isHint = hintTileIds?.has(tile.id) ?? false;
        const left = tile.col * (tileSize + gap);
        const top = tile.row * (tileSize + gap);

        return (
          <div
            key={tile.id}
            style={{
              position: 'absolute',
              left: left + boardPad,
              top: top + boardPad,
              zIndex: tile.layer * 10,
            }}
          >
            <Tile
              tileType={tile.type}
              state={blocked ? 'blocked' : isHint ? 'hint' : 'active'}
              size={tileSize}
              layer={tile.layer}
              onClick={() => onTileTap(tile)}
            />
          </div>
        );
      })}
    </GridContainer>
  );
};
