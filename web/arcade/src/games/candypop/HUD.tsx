import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#e8f5e9',
  borderBottom: '1px solid #c8e6c9',
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
  color: '#558b2f',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  color: '#2e7d32',
});

const TargetValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  variants: {
    reached: {
      true: { color: '#1b5e20' },
      false: { color: '#2e7d32' },
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
        <StatValue css={{ color: movesLeft <= 3 ? '$rose500' : '#2e7d32' }}>
          {movesLeft}
        </StatValue>
      </StatBlock>
      {combo > 1 && (
        <StatBlock>
          <StatLabel>Combo</StatLabel>
          <StatValue css={{ color: '#ff6f00' }}>x{combo}</StatValue>
        </StatBlock>
      )}
    </Container>
  );
}
