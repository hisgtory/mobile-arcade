import { styled } from '../../styles/stitches.config';
import type { GameResult } from './useGame';
import { TOTAL_STAGES } from '@arcade/lib-pixelart';

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
  color: '$text',
});

const Emoji = styled('div', {
  fontSize: 64,
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

interface ClearScreenProps {
  result: GameResult;
  stage: number;
  onNext: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export function ClearScreen({ result, stage, onNext, onRetry, onHome }: ClearScreenProps) {
  const isAllClear = stage >= TOTAL_STAGES;
  return (
    <Overlay>
      <Emoji>{isAllClear ? '🏆' : '🎨'}</Emoji>
      <Title>{isAllClear ? 'All Clear!' : 'Masterpiece!'}</Title>
      <Card>
        <StatRow>
          <Label>Stage</Label>
          <Value>{stage}</Value>
        </StatRow>
        <StatRow>
          <Label>Score</Label>
          <Value>{result.score.toLocaleString()}</Value>
        </StatRow>
      </Card>
      {!isAllClear && (
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
