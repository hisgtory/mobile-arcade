import { styled } from '../../styles/stitches.config';
import type { GameResult } from './useGame';

const Overlay = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  height: '100vh',
  backgroundColor: '#f5f0e8',
  padding: 20,
});

const Title = styled('h1', {
  fontSize: 36,
  fontWeight: 800,
  letterSpacing: -1,
  color: '#4A3520',
});

const Card = styled('div', {
  backgroundColor: '#fff',
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
  color: '#8B7355',
});

const Value = styled('span', {
  fontSize: 20,
  fontWeight: 700,
  color: '#4A3520',
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
  return (
    <Overlay>
      <Title>{result.cleared ? 'Stage Clear!' : 'Game Over'}</Title>
      <Card>
        <StatRow>
          <Label>Stage</Label>
          <Value>{stage}</Value>
        </StatRow>
        <StatRow>
          <Label>Score</Label>
          <Value>{result.score.toLocaleString()}</Value>
        </StatRow>
        <StatRow>
          <Label>Moves</Label>
          <Value>{result.moves}</Value>
        </StatRow>
      </Card>
      {result.cleared && (
        <Button
          css={{ backgroundColor: '#A0522D', color: '#fff' }}
          onClick={onNext}
        >
          Next Stage
        </Button>
      )}
      <Button
        css={{ backgroundColor: '#fff', color: '#4A3520', border: '1px solid #D2B48C' }}
        onClick={onRetry}
      >
        Retry
      </Button>
      <Button
        css={{ backgroundColor: 'transparent', color: '#8B7355', fontSize: 16 }}
        onClick={onHome}
      >
        Home
      </Button>
    </Overlay>
  );
}
