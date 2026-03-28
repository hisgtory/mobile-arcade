import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
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
  color: '$textMuted',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 22,
  fontWeight: 700,
  color: '$text',
});

const ActionBtn = styled('button', {
  fontSize: 13,
  fontWeight: 600,
  color: '$primary',
  backgroundColor: 'transparent',
  border: '1px solid $gray200',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  '&:active': { opacity: 0.7 },
});

interface HUDProps {
  stage: number;
  score: number;
  swallowed: number;
  totalObjects: number;
  timeRemainingSec: number;
  onRestart?: () => void;
}

export function HUD({ stage, score, swallowed, totalObjects, timeRemainingSec, onRestart }: HUDProps) {
  const timeColor = timeRemainingSec <= 5 ? '#EF4444' : undefined;

  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Objects</StatLabel>
        <StatValue>{swallowed}/{totalObjects}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Time</StatLabel>
        <StatValue css={timeColor ? { color: timeColor } : undefined}>{timeRemainingSec}s</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
      <ActionBtn onClick={onRestart}>Restart</ActionBtn>
    </Container>
  );
}
