import { styled } from '../styles/stitches.config';
import { TILE_IMAGES, TILE_COLORS, MAX_SLOT, type SlotItem } from '@arcade/lib-found3';

const Root = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  backgroundColor: '$surface',
  borderTop: '1px solid $gray200',
});

const Slot = styled('div', {
  width: 44,
  height: 44,
  borderRadius: 10,
  border: '2px solid $gray200',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'background-color 0.15s',
});

const TileImg = styled('img', {
  width: 32,
  height: 32,
  imageRendering: 'pixelated',
});

function tileColorToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

interface SlotBarProps {
  items: SlotItem[];
}

export function SlotBar({ items }: SlotBarProps) {
  const slots = Array.from({ length: MAX_SLOT }, (_, i) => items[i] ?? null);

  return (
    <Root>
      {slots.map((item, i) => (
        <Slot
          key={i}
          style={item ? { backgroundColor: tileColorToCSS(TILE_COLORS[item.type]) } : undefined}
        >
          {item && (
            <TileImg
              src={`${import.meta.env.BASE_URL}assets/tiles/${TILE_IMAGES[item.type]}.png`}
              alt={TILE_IMAGES[item.type]}
            />
          )}
        </Slot>
      ))}
    </Root>
  );
}
