import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#1a1a2e',
  borderBottom: '1px solid #2a2a4a',
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
  color: '#8888aa',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  color: '#eeeeff',
});

interface HUDProps {
  stage: number;
  movesLeft: number;
  remaining: number;
  total: number;
}

export function HUD({ stage, movesLeft, remaining, total }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Balls</StatLabel>
        <StatValue css={{ color: remaining === 0 ? '#22C55E' : '#eeeeff' }}>
          {remaining}/{total}
        </StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Moves</StatLabel>
        <StatValue css={{ color: movesLeft <= 3 ? '#EF4444' : '#eeeeff' }}>
          {movesLeft}
        </StatValue>
      </StatBlock>
    </Container>
  );
}
