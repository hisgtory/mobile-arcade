import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid #fce7f3',
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
  color: '#9d174d',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  color: '$text',
});

interface HUDProps {
  stage: number;
  score: number;
  timeLeft: number;
  customersServed: number;
  totalCustomers: number;
  combo: number;
}

export function HUD({ stage, score, timeLeft, customersServed, totalCustomers, combo }: HUDProps) {
  const minutes = Math.floor(Math.max(0, timeLeft) / 60);
  const seconds = Math.max(0, timeLeft) % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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
        <StatLabel>Time</StatLabel>
        <StatValue css={{ color: timeLeft <= 10 ? '$rose500' : '$text' }}>
          {timeStr}
        </StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Served</StatLabel>
        <StatValue>
          {customersServed}/{totalCustomers}
        </StatValue>
      </StatBlock>
      {combo > 1 && (
        <StatBlock>
          <StatLabel>Combo</StatLabel>
          <StatValue css={{ color: '#db2777' }}>x{combo}</StatValue>
        </StatBlock>
      )}
    </Container>
  );
}
