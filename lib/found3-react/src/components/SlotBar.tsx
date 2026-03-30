/**
 * Slot bar — holds tiles waiting for 3-match
 */

import React from 'react';
import { styled, keyframes } from '@stitches/react';
import { MAX_SLOT, TILE_EMOJIS, TILE_COLORS, type SlotItem } from '../types';

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
  fontSize: '20px',
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

    const emoji = TILE_EMOJIS[item.type % TILE_EMOJIS.length];
    const bgColor = TILE_COLORS[item.type % TILE_COLORS.length];
    const isRemoving = removingType != null && item.type === removingType;

    return (
      <Slot
        key={item.id}
        filled
        removing={isRemoving}
        css={{ backgroundColor: bgColor }}
      >
        {emoji}
      </Slot>
    );
  });

  return <Container>{slots}</Container>;
};
