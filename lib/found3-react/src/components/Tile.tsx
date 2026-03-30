/**
 * Individual tile component — styled with Stitches
 * Visual parity with lib/found3/src/objects/Tile.ts:
 *   - Pastel bg rectangle with 2px #cccccc border (0.6 opacity)
 *   - Pixel-art PNG icon (16×16 with pixelated rendering)
 *   - Shadow for upper layers (layer >= 1)
 *   - Blocked tiles stay fully visible (only interaction blocked)
 *   - Hint state: scale bounce animation (magnet power-up)
 */

import React from 'react';
import { styled, keyframes } from '@stitches/react';
import { TILE_IMAGES, TILE_COLORS } from '../types';

const popIn = keyframes({
  '0%': { transform: 'scale(0)', opacity: 0 },
  '70%': { transform: 'scale(1.1)' },
  '100%': { transform: 'scale(1)', opacity: 1 },
});

const hintBounce = keyframes({
  '0%, 100%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.2)' },
});

const StyledTile = styled('button', {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid rgba(204, 204, 204, 0.6)',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'transform 0.15s ease',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  animation: `${popIn} 0.25s ease-out`,
  padding: 0,
  outline: 'none',

  '&:active': {
    transform: 'scale(0.92)',
  },

  variants: {
    state: {
      active: {
        cursor: 'pointer',
      },
      blocked: {
        // Phaser: no dimming — tiles stay fully visible, only interaction blocked
        cursor: 'default',
        pointerEvents: 'none',
      },
      selected: {
        transform: 'scale(0.9)',
        boxShadow: '0 0 0 3px #3b82f6',
      },
      hint: {
        // Magnet highlight: scale bounce (matches Phaser doMagnet tween)
        animation: `${hintBounce} 0.4s ease-in-out 3`,
        cursor: 'pointer',
      },
    },
  },

  defaultVariants: {
    state: 'active',
  },
});

const PixelIcon = styled('img', {
  imageRendering: 'pixelated',
  '-webkit-image-rendering': 'pixelated',
  pointerEvents: 'none',
});

const Shadow = styled('div', {
  position: 'absolute',
  borderRadius: '6px',
  backgroundColor: 'rgba(170, 170, 170, 0.25)',
});

interface TileProps {
  tileType: number;
  state: 'active' | 'blocked' | 'selected' | 'hint';
  size: number;
  layer?: number;
  onClick?: () => void;
}

export const Tile: React.FC<TileProps> = ({ tileType, state, size, layer = 0, onClick }) => {
  const imageKey = TILE_IMAGES[tileType % TILE_IMAGES.length];
  const bgColor = TILE_COLORS[tileType % TILE_COLORS.length];
  const isBlocked = state === 'blocked';

  // Match Phaser: icon size = min(40, size * 0.75)
  const iconSize = Math.min(40, size * 0.75);

  // Match Phaser: inner size = size - 4 (due to 2px border on each side)
  const innerSize = size - 4;

  // Shadow offset for upper layers (Phaser: 3 * layer)
  const shadowOffset = layer > 0 ? 3 * layer : 0;

  return (
    <StyledTile
      state={state}
      disabled={isBlocked}
      aria-disabled={isBlocked}
      onClick={!isBlocked ? onClick : undefined}
      css={{
        width: innerSize,
        height: innerSize,
        backgroundColor: bgColor,
      }}
    >
      {shadowOffset > 0 && (
        <Shadow
          css={{
            width: innerSize,
            height: innerSize,
            top: shadowOffset,
            left: shadowOffset,
            zIndex: -1,
          }}
        />
      )}
      <PixelIcon
        src={`/assets/tiles/${imageKey}.png`}
        alt=""
        draggable={false}
        css={{ width: iconSize, height: iconSize }}
      />
    </StyledTile>
  );
};
