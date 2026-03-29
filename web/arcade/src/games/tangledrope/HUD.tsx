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

interface HUDProps {
  stage: number;
  moves: number;
  intersections: number;
  onUndo?: () => void;
  onRestart?: () => void;
}

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

const CrossBadge = styled('span', {
  fontSize: 22,
  fontWeight: 700,
  variants: {
    solved: {
      true: { color: '#22C55E' },
      false: { color: '#EF4444' },
    },
  },
});

export function HUD({ stage, moves, intersections, onUndo, onRestart }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Tangles</StatLabel>
        <CrossBadge solved={intersections === 0}>{intersections}</CrossBadge>
      </StatBlock>
      <StatBlock>
        <StatLabel>Moves</StatLabel>
        <StatValue>{moves}</StatValue>
      </StatBlock>
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionBtn onClick={onUndo}>Undo</ActionBtn>
        <ActionBtn onClick={onRestart}>Restart</ActionBtn>
      </div>
    </Container>
  );
}
