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

const InkBar = styled('div', {
  flex: 1,
  maxWidth: 100,
  height: 8,
  backgroundColor: '$gray100',
  borderRadius: 4,
  overflow: 'hidden',
});

const InkFill = styled('div', {
  height: '100%',
  borderRadius: 4,
  transition: 'width 0.2s ease',
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
  ink: number;
  maxInk: number;
  onUndo?: () => void;
  onRestart?: () => void;
}

export function HUD({ stage, score, ink, maxInk, onUndo, onRestart }: HUDProps) {
  const inkPct = maxInk > 0 ? (ink / maxInk) * 100 : 0;
  const inkColor = inkPct > 40 ? '#22C55E' : inkPct > 15 ? '#EAB308' : '#EF4444';

  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Ink</StatLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <InkBar>
            <InkFill style={{ width: `${inkPct}%`, backgroundColor: inkColor }} />
          </InkBar>
          <span style={{ fontSize: 12, fontWeight: 600, color: inkColor }}>{Math.round(inkPct)}%</span>
        </div>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionBtn onClick={onUndo}>Undo</ActionBtn>
        <ActionBtn onClick={onRestart}>↻</ActionBtn>
      </div>
    </Container>
  );
}
