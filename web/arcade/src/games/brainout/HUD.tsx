import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#FFF8F0',
  borderBottom: '1px solid #FDE68A',
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
  color: '#92400E',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  color: '#78350F',
});

const HintButton = styled('button', {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 12px',
  borderRadius: 12,
  border: '2px solid #F59E0B',
  backgroundColor: '#FEF3C7',
  color: '#92400E',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
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
      <HintButton onClick={onHint} disabled={hintsLeft <= 0}>
        💡 {hintsLeft}
      </HintButton>
    </Container>
  );
}
