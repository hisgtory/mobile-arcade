import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#16213e',
  borderBottom: '1px solid #0f3460',
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
  color: '#8b8fa3',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  color: '#e2e8f0',
});

const TargetValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  variants: {
    reached: {
      true: { color: '#10B981' },
      false: { color: '#e2e8f0' },
    },
  },
});

interface HUDProps {
  stage: number;
  score: number;
  targetScore: number;
  movesLeft: number;
  combo: number;
}

export function HUD({ stage, score, targetScore, movesLeft, combo }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <TargetValue reached={score >= targetScore}>
          {score.toLocaleString()}
        </TargetValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Target</StatLabel>
        <StatValue>{targetScore.toLocaleString()}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Moves</StatLabel>
        <StatValue css={{ color: movesLeft <= 3 ? '#F43F5E' : '#e2e8f0' }}>
          {movesLeft}
        </StatValue>
      </StatBlock>
      {combo > 1 && (
        <StatBlock>
          <StatLabel>Combo</StatLabel>
          <StatValue css={{ color: '#fbbf24' }}>x{combo}</StatValue>
        </StatBlock>
      )}
    </Container>
  );
}
