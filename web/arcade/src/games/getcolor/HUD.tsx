import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#1a1a2e',
  borderBottom: '1px solid #2a2a4a',
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
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 22,
  fontWeight: 700,
  color: '#FFFFFF',
});

const TimerValue = styled('span', {
  fontSize: 22,
  fontWeight: 700,
  fontFamily: 'monospace',
  variants: {
    urgent: {
      true: { color: '#FF6B6B' },
      false: { color: '#4ECDC4' },
    },
  },
  defaultVariants: { urgent: false },
});

interface HUDProps {
  stage: number;
  score: number;
  moves: number;
  timerSec: number;
  onUndo?: () => void;
  onRestart?: () => void;
}

const ActionBtn = styled('button', {
  fontSize: 13,
  fontWeight: 600,
  color: '#4ECDC4',
  backgroundColor: 'transparent',
  border: '1px solid #4a4a6a',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  '&:active': { opacity: 0.7 },
});

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function HUD({ stage, score, moves, timerSec, onUndo, onRestart }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Time</StatLabel>
        <TimerValue urgent={timerSec <= 10}>{formatTime(timerSec)}</TimerValue>
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
