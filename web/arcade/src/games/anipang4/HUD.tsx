import { styled } from '../../styles/stitches.config';

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

const TargetValue = styled('span', {
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
  targetScore: number;
  timeLeft: number;
  combo: number;
}

export function HUD({ stage, score, targetScore, timeLeft, combo }: HUDProps) {
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
        <StatLabel>Time</StatLabel>
        <StatValue css={{ color: timeLeft <= 10 ? '$rose500' : '$text' }}>
          {timeLeft}s
        </StatValue>
      </StatBlock>
      {combo > 1 && (
        <StatBlock>
          <StatLabel>Combo</StatLabel>
          <StatValue css={{ color: '$main500' }}>x{combo}</StatValue>
        </StatBlock>
      )}
    </Container>
  );
}
