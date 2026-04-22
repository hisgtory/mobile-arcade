import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 20,
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
  fontSize: 22,
  fontWeight: 700,
  color: '$text',
});

interface HUDProps {
  stage: number;
  score: number;
  streak: number;
  current: number;
  total: number;
  timeRemaining: number;
}

export function HUD({ stage, score, streak, current, total, timeRemaining }: HUDProps) {
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
        <StatLabel>Puzzle</StatLabel>
        <StatValue>{current}/{total}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Time</StatLabel>
        <StatValue css={{ color: timeRemaining <= 10 ? '$rose500' : '$text' }}>
          {timeRemaining}s
        </StatValue>
      </StatBlock>
      {streak > 1 && (
        <StatBlock>
          <StatLabel>Streak</StatLabel>
          <StatValue css={{ color: '$emerald500' }}>🔥{streak}</StatValue>
        </StatBlock>
      )}
    </Container>
  );
}
