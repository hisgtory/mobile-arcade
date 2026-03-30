/**
 * Individual tile component — styled with Stitches
 */

import React from 'react';
import { styled, keyframes } from '@stitches/react';
import { TILE_EMOJIS, TILE_COLORS } from '../types';

const popIn = keyframes({
  '0%': { transform: 'scale(0)', opacity: 0 },
  '70%': { transform: 'scale(1.1)' },
  '100%': { transform: 'scale(1)', opacity: 1 },
});

const StyledTile = styled('button', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '24px',
  transition: 'transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  animation: `${popIn} 0.25s ease-out`,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  padding: 0,

  '&:active': {
    transform: 'scale(0.92)',
  },

  '&:disabled': {
    opacity: 0.4,
    cursor: 'default',
    filter: 'grayscale(0.3)',
    pointerEvents: 'none',
  },

  variants: {
    state: {
      active: {
        opacity: 1,
        cursor: 'pointer',
      },
      blocked: {
        opacity: 0.4,
        cursor: 'default',
        filter: 'grayscale(0.3)',
        pointerEvents: 'none',
      },
      selected: {
        opacity: 1,
        transform: 'scale(0.9)',
        boxShadow: '0 0 0 3px #3b82f6',
      },
    },
  },

  defaultVariants: {
    state: 'active',
  },
});

interface TileProps {
  tileType: number;
  state: 'active' | 'blocked' | 'selected';
  size: number;
  onClick?: () => void;
}

export const Tile: React.FC<TileProps> = ({ tileType, state, size, onClick }) => {
  const emoji = TILE_EMOJIS[tileType % TILE_EMOJIS.length];
  const bgColor = TILE_COLORS[tileType % TILE_COLORS.length];
  const isBlocked = state === 'blocked';

  return (
    <StyledTile
      state={state}
      disabled={isBlocked}
      aria-disabled={isBlocked}
      onClick={!isBlocked ? onClick : undefined}
      css={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: Math.max(14, size * 0.5),
      }}
    >
      {emoji}
    </StyledTile>
  );
};
