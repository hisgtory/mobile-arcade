import { styled } from '../../styles/stitches.config';
import { ITEM_IMAGES } from '@arcade/lib-spotit';
import type { ItemType } from '@arcade/lib-spotit';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
});

const StatBlock = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
});

const StatLabel = styled('span', {
  fontSize: 11,
  fontWeight: 500,
  color: '$textMuted',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  color: '$text',
});

const TargetBar = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  backgroundColor: '#FFFBEB',
  borderBottom: '1px solid #FDE68A',
});

const TargetLabel = styled('span', {
  fontSize: 12,
  fontWeight: 600,
  color: '#92400E',
  marginRight: 4,
});

const TargetIcon = styled('div', {
  width: 32,
  height: 32,
  borderRadius: 6,
  backgroundColor: '#fff',
  border: '2px solid #FDE68A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  variants: {
    found: {
      true: {
        backgroundColor: '#D1FAE5',
        border: '2px solid #10B981',
        opacity: 0.6,
      },
    },
  },
});

const TargetImg = styled('img', {
  width: 24,
  height: 24,
  imageRendering: 'pixelated',
});

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface HUDProps {
  stage: number;
  score: number;
  foundCount: number;
  foundTypes: Set<number>;
  targetCount: number;
  remainingMs: number;
  targetTypes: ItemType[];
}

export function HUD({
  stage,
  score,
  foundCount,
  foundTypes,
  targetCount,
  remainingMs,
  targetTypes,
}: HUDProps) {
  return (
    <>
      <Container>
        <StatBlock>
          <StatLabel>Stage</StatLabel>
          <StatValue>{stage}</StatValue>
        </StatBlock>
        <StatBlock>
          <StatLabel>Found</StatLabel>
          <StatValue css={{ color: foundCount >= targetCount ? '$emerald500' : '$text' }}>
            {foundCount}/{targetCount}
          </StatValue>
        </StatBlock>
        <StatBlock>
          <StatLabel>Score</StatLabel>
          <StatValue>{score.toLocaleString()}</StatValue>
        </StatBlock>
        <StatBlock>
          <StatLabel>Time</StatLabel>
          <StatValue css={{ color: remainingMs <= 10000 ? '$rose500' : '$text' }}>
            {formatTime(remainingMs)}
          </StatValue>
        </StatBlock>
      </Container>
      <TargetBar>
        <TargetLabel>FIND:</TargetLabel>
        {targetTypes.map((type, i) => {
          const imgKey = ITEM_IMAGES[type % ITEM_IMAGES.length];
          return (
            <TargetIcon key={i} found={foundTypes.has(type)}>
              <TargetImg src={`/assets/tiles/${imgKey}.png`} alt={imgKey} />
            </TargetIcon>
          );
        })}
      </TargetBar>
    </>
  );
}
