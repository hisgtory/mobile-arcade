import { styled } from '../../styles/stitches.config';
import type { GameResult } from './useGame';

const Overlay = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  height: '100vh',
  backgroundColor: '$bg',
  padding: 20,
});

const Title = styled('h1', {
  fontSize: 36,
  fontWeight: 800,
  letterSpacing: -1,
  variants: {
    cleared: {
      true: { color: '$emerald500' },
      false: { color: '$rose500' },
    },
  },
});

const Card = styled('div', {
  backgroundColor: '$surface',
  borderRadius: 16,
  padding: 20,
  width: '85%',
  maxWidth: 320,
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

const StatRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const Label = styled('span', {
  fontSize: 14,
  color: '$textMuted',
});

const Value = styled('span', {
  fontSize: 20,
  fontWeight: 700,
  color: '$text',
});

const Button = styled('button', {
  border: 'none',
  padding: '16px 48px',
  borderRadius: 16,
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  width: '85%',
  maxWidth: 320,
});

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
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
    <Overlay>
      <Title cleared={result.cleared}>
        {result.cleared ? 'Stage Clear!' : 'Time Up!'}
      </Title>
      <Card>
        <StatRow>
          <Label>Stage</Label>
          <Value>{stage}</Value>
        </StatRow>
        <StatRow>
          <Label>Score</Label>
          <Value>{(result.score ?? 0).toLocaleString()}</Value>
        </StatRow>
        {result.elapsedMs != null && (
          <StatRow>
            <Label>Time</Label>
            <Value>{formatTime(result.elapsedMs)}</Value>
          </StatRow>
        )}
      </Card>
      {result.cleared && (
        <Button
          css={{ backgroundColor: '$primary', color: '#fff' }}
          onClick={onNext}
        >
          Next Stage
        </Button>
      )}
      <Button
        css={{ backgroundColor: '#fff', color: '$text', border: '1px solid $gray200' }}
        onClick={onRetry}
      >
        Retry
      </Button>
      <Button
        css={{ backgroundColor: 'transparent', color: '$textMuted', fontSize: 16 }}
        onClick={onHome}
      >
        Home
      </Button>
    </Overlay>
  );
}
