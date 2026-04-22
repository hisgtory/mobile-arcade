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
  '&:disabled': {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
});

interface HUDProps {
  stage: number;
  score: number;
  puzzleIndex: number;
  totalPuzzles: number;
  hintsLeft: number;
  onHint: () => void;
}

export function HUD({ stage, score, puzzleIndex, totalPuzzles, hintsLeft, onHint }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Puzzle</StatLabel>
        <StatValue>{puzzleIndex + 1}/{totalPuzzles}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
      <ActionBtn onClick={onHint} disabled={hintsLeft <= 0}>
        💡 {hintsLeft}
      </ActionBtn>
    </Container>
  );
}
