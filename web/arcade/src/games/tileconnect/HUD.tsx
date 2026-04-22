import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 20,
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

const ToolBar = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 16,
  padding: '6px 16px',
  paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
  backgroundColor: '$surface',
  borderTop: '1px solid $gray100',
});

const ToolButton = styled('button', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 20px',
  backgroundColor: '$white',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  color: '$gray600',
  boxShadow: '0 2px 0 0 #D1D5DB, 0 3px 6px rgba(0,0,0,0.08)',
  transition: 'transform 0.08s, box-shadow 0.08s',
  '&:active': {
    transform: 'translateY(2px)',
    boxShadow: '0 0px 0 0 #D1D5DB, 0 1px 2px rgba(0,0,0,0.06)',
  },
});

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface HUDProps {
  stage: number;
  score: number;
  remaining: number;
  total: number;
  elapsedMs: number;
  combo: number;
}

export function HUD({ stage, score, remaining, total, elapsedMs, combo }: HUDProps) {
  const cleared = total > 0 ? total - remaining : 0;
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
        <StatLabel>Tiles</StatLabel>
        <StatValue>{cleared}/{total}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Time</StatLabel>
        <StatValue>{formatTime(elapsedMs)}</StatValue>
      </StatBlock>
      {combo > 1 && (
        <StatBlock>
          <StatLabel>Combo</StatLabel>
          <StatValue css={{ color: '$main500' }}>x{combo}</StatValue>
        </StatBlock>
      )}
    </Container>
  );
}

interface ItemBarProps {
  onShuffle: () => void;
  onHint: () => void;
}

export function ItemBar({ onShuffle, onHint }: ItemBarProps) {
  return (
    <ToolBar>
      <ToolButton onClick={onHint}>
        💡 Hint
      </ToolButton>
      <ToolButton onClick={onShuffle}>
        🔀 Shuffle
      </ToolButton>
    </ToolBar>
  );
}
