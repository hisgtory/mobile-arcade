import { styled } from '../../styles/stitches.config';
import { IconShuffle } from './icons/IconShuffle';
import { IconUndo } from './icons/IconUndo';
import { IconHint } from './icons/IconHint';
import type { ItemType } from '../../hooks/useGame';

const Root = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 20,
  padding: '8px 16px',
  paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
  backgroundColor: '$surface',
  borderTop: '1px solid $gray200',
});

const ButtonWrap = styled('div', {
  position: 'relative',
});

const ItemButton = styled('button', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  width: 64,
  height: 64,
  padding: 0,
  backgroundColor: '$white',
  border: 'none',
  borderRadius: 14,
  cursor: 'pointer',
  fontFamily: '$body',
  color: '$gray600',
  boxShadow: '0 2px 0 0 #D1D5DB, 0 3px 6px rgba(0,0,0,0.08)',
  transition: 'transform 0.08s, box-shadow 0.08s',
  '&:active': {
    transform: 'translateY(2px)',
    boxShadow: '0 0px 0 0 #D1D5DB, 0 1px 2px rgba(0,0,0,0.06)',
  },
});

const ItemLabel = styled('span', {
  fontSize: 10,
  fontWeight: 600,
  color: '$gray500',
  lineHeight: 1,
});

const Badge = styled('span', {
  position: 'absolute',
  top: -4,
  right: -4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  fontFamily: '$body',
  fontWeight: 700,
  lineHeight: 1,
  variants: {
    variant: {
      count: {
        backgroundColor: '#F43F5E',
        color: '#FFFFFF',
        fontSize: 10,
        padding: '0 4px',
      },
      ad: {
        backgroundColor: '#E5E7EB',
        color: '#4B5563',
        fontSize: 9,
        padding: '0 5px',
      },
    },
  },
});

interface ItemBarProps {
  onShuffle: () => void;
  onUndo: () => void;
  onHint: () => void;
  shuffleCount: number;
  undoCount: number;
  hintCount: number;
  onAdRequest: (itemType: ItemType) => void;
}

function ItemWithBadge({
  count,
  itemType,
  onUse,
  onAdRequest,
  icon,
  label,
}: {
  count: number;
  itemType: ItemType;
  onUse: () => void;
  onAdRequest: (itemType: ItemType) => void;
  icon: React.ReactNode;
  label: string;
}) {
  const handleClick = () => {
    if (count > 0) {
      onUse();
    } else {
      onAdRequest(itemType);
    }
  };

  return (
    <ButtonWrap>
      <ItemButton onClick={handleClick}>
        {icon}
        <ItemLabel>{label}</ItemLabel>
      </ItemButton>
      <Badge variant={count > 0 ? 'count' : 'ad'}>
        {count > 0 ? count : 'AD'}
      </Badge>
    </ButtonWrap>
  );
}

export function ItemBar({
  onShuffle,
  onUndo,
  onHint,
  shuffleCount,
  undoCount,
  hintCount,
  onAdRequest,
}: ItemBarProps) {
  return (
    <Root>
      <ItemWithBadge
        count={shuffleCount}
        itemType="shuffle"
        onUse={onShuffle}
        onAdRequest={onAdRequest}
        icon={<IconShuffle width={24} height={24} color="#4B5563" />}
        label="Shuffle"
      />
      <ItemWithBadge
        count={undoCount}
        itemType="undo"
        onUse={onUndo}
        onAdRequest={onAdRequest}
        icon={<IconUndo width={24} height={24} color="#4B5563" />}
        label="Undo"
      />
      <ItemWithBadge
        count={hintCount}
        itemType="hint"
        onUse={onHint}
        onAdRequest={onAdRequest}
        icon={<IconHint width={22} height={22} />}
        label="Hint"
      />
    </Root>
  );
}
