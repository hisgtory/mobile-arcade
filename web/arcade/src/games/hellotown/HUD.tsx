import { styled } from '../../styles/stitches.config';
import { ITEM_LABELS } from '@arcade/lib-hellotown';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
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

const LevelValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  variants: {
    reached: {
      true: { color: '$emerald500' },
      false: { color: '$text' },
    },
  },
});

interface HUDProps {
  stage: number;
  score: number;
  targetLevel: number;
  maxLevel: number;
  movesLeft: number;
}

export function HUD({ stage, score, targetLevel, maxLevel, movesLeft }: HUDProps) {
  const targetEmoji = ITEM_LABELS[targetLevel] || '🌟';

  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Target</StatLabel>
        <LevelValue reached={maxLevel >= targetLevel}>
          {targetEmoji} Lv.{targetLevel + 1}
        </LevelValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Moves</StatLabel>
        <StatValue css={{ color: movesLeft <= 3 ? '$rose500' : '$text' }}>
          {movesLeft}
        </StatValue>
      </StatBlock>
    </Container>
  );
}
