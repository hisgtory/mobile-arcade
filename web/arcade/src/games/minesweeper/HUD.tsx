import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 32,
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
  minesRemaining: number;
  elapsed: number;
  difficulty: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function HUD({ minesRemaining, elapsed, difficulty }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>💣 Mines</StatLabel>
        <StatValue>{minesRemaining}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>⏱ Time</StatLabel>
        <StatValue>{formatTime(elapsed)}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Difficulty</StatLabel>
        <StatValue css={{ fontSize: 16 }}>{difficulty}</StatValue>
      </StatBlock>
    </Container>
  );
}
