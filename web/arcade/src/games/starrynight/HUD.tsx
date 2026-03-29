import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#0f172a',
  borderBottom: '1px solid #1e293b',
  gap: 24,
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
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 22,
  fontWeight: 700,
  color: '#fbbf24',
});

interface HUDProps {
  score: number;
}

export function HUD({ score }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>⭐ Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
    </Container>
  );
}
