/**
 * Slot bar — holds tiles waiting for 3-match
 * Uses pixel-art PNG icons to match Phaser visual parity
 */

import React from 'react';
import { styled, keyframes } from '@stitches/react';
import { MAX_SLOT, TILE_IMAGES, TILE_COLORS, type SlotItem } from '../types';

const PixelIcon = styled('img', {
  imageRendering: 'pixelated',
  '-webkit-image-rendering': 'pixelated',
  '@supports (-webkit-touch-callout: none)': {
    imageRendering: '-webkit-optimize-contrast',
  },
  pointerEvents: 'none',
});

const slideIn = keyframes({
  '0%': { transform: 'translateY(-20px) scale(0.5)', opacity: 0 },
  '100%': { transform: 'translateY(0) scale(1)', opacity: 1 },
});

const scaleOut = keyframes({
  '0%': { transform: 'scale(1)', opacity: 1 },
  '100%': { transform: 'scale(0)', opacity: 0 },
});

const Container = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 12px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  minHeight: '52px',
  width: '100%',
  maxWidth: '360px',
  margin: '0 auto',
});

const Slot = styled('div', {
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',

  variants: {
    filled: {
      true: {
        animation: `${slideIn} 0.2s ease-out`,
      },
      false: {},
    },
    removing: {
      true: {
        animation: `${scaleOut} 0.25s ease-in forwards`,
      },
      false: {},
    },
  },
});

interface SlotBarProps {
  items: SlotItem[];
  removingType?: number | null;
}

export const SlotBar: React.FC<SlotBarProps> = ({ items, removingType }) => {
  const slots = Array.from({ length: MAX_SLOT }, (_, i) => {
    const item = items[i];
    if (!item) return <Slot key={`empty-${i}`} filled={false} removing={false} />;

    const imageKey = TILE_IMAGES[item.type % TILE_IMAGES.length];
    const bgColor = TILE_COLORS[item.type % TILE_COLORS.length];
    const isRemoving = removingType != null && item.type === removingType;

    return (
      <Slot
        key={item.id}
        filled
        removing={isRemoving}
        css={{ backgroundColor: bgColor }}
      >
        <PixelIcon
          src={`/assets/tiles/${imageKey}.png`}
          alt=""
          draggable={false}
          css={{ width: 28, height: 28 }}
        />
      </Slot>
    );
  });

  return <Container>{slots}</Container>;
};
