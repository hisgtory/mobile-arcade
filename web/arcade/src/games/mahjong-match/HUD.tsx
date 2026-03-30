import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 16,
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
  matchesLeft: number;
  shuffleNotice?: boolean;
  onShuffle?: () => void;
  onHint?: () => void;
  onRestart?: () => void;
}

export function HUD({ stage, score, matchesLeft, shuffleNotice, onShuffle, onHint, onRestart }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Pairs</StatLabel>
        <StatValue>{matchesLeft}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {shuffleNotice && (
          <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
            No moves — shuffling…
          </span>
        )}
        <ActionBtn onClick={onHint}>Hint</ActionBtn>
        <ActionBtn onClick={onShuffle}>Shuffle</ActionBtn>
        <ActionBtn onClick={onRestart}>↻</ActionBtn>
      </div>
    </Container>
  );
}
