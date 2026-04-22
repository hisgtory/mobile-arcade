import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#f5f0e8',
  borderBottom: '1px solid #e5ddd0',
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
  color: '#8B7355',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 22,
  fontWeight: 700,
  color: '#4A3520',
});

const ActionBtn = styled('button', {
  fontSize: 13,
  fontWeight: 600,
  color: '#A0522D',
  backgroundColor: 'transparent',
  border: '1px solid #D2B48C',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  '&:active': { opacity: 0.7 },
});

interface HUDProps {
  stage: number;
  score: number;
  moves: number;
  onUndo?: () => void;
  onRestart?: () => void;
}

export function HUD({ stage, score, moves, onUndo, onRestart }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Moves</StatLabel>
        <StatValue>{moves}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionBtn onClick={onUndo}>Undo</ActionBtn>
        <ActionBtn onClick={onRestart}>Restart</ActionBtn>
      </div>
    </Container>
  );
}
