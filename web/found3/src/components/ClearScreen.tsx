import { styled } from '../styles/stitches.config';
import type { GameResult } from '../hooks/useGame';

const Root = styled('div', {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 24,
  backgroundColor: '$bg',
  padding: 24,
});

const Title = styled('h2', {
  fontSize: 36,
  fontWeight: 800,
  fontFamily: '$body',
  variants: {
    cleared: {
      true: { color: '$emerald500' },
      false: { color: '$rose500' },
    },
  },
});

const Stat = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
});

const StatLabel = styled('span', {
  fontSize: 13,
  color: '$textMuted',
  fontFamily: '$body',
});

const StatValue = styled('span', {
  fontSize: 28,
  fontWeight: 700,
  color: '$text',
  fontFamily: '$body',
});

const StatsRow = styled('div', {
  display: 'flex',
  gap: 40,
});

const Button = styled('button', {
  padding: '14px 40px',
  fontSize: 16,
  fontWeight: 700,
  border: 'none',
  borderRadius: 14,
  cursor: 'pointer',
  fontFamily: '$body',
  transition: 'transform 0.1s, opacity 0.1s',
  '&:active': {
    transform: 'scale(0.95)',
    opacity: 0.9,
  },
  variants: {
    variant: {
      primary: {
        color: '$white',
        backgroundColor: '$primary',
      },
      secondary: {
        color: '$text',
        backgroundColor: '$gray200',
      },
    },
  },
});

const ButtonRow = styled('div', {
  display: 'flex',
  gap: 12,
});

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface ClearScreenProps {
  result: GameResult;
  stage: number;
  onNext: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export function ClearScreen({ result, stage, onNext, onRetry, onHome }: ClearScreenProps) {
  return (
    <Root>
      <Title cleared={result.cleared}>
        {result.cleared ? 'Stage Clear!' : 'Game Over'}
      </Title>

      <StatsRow>
        <Stat>
          <StatLabel>Stage</StatLabel>
          <StatValue>{stage}</StatValue>
        </Stat>
        <Stat>
          <StatLabel>Score</StatLabel>
          <StatValue>{result.score}</StatValue>
        </Stat>
        <Stat>
          <StatLabel>Time</StatLabel>
          <StatValue>{formatTime(result.elapsedMs)}</StatValue>
        </Stat>
      </StatsRow>

      <ButtonRow>
        <Button variant="secondary" onClick={onHome}>Home</Button>
        <Button variant="secondary" onClick={onRetry}>Retry</Button>
        {result.cleared && (
          <Button variant="primary" onClick={onNext}>Next</Button>
        )}
      </ButtonRow>
    </Root>
  );
}
