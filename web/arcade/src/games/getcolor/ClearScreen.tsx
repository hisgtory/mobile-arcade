import { styled } from '../../styles/stitches.config';
import type { GameResult } from './useGame';

const Overlay = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  height: '100vh',
  backgroundColor: '#1a1a2e',
  padding: 20,
});

const Title = styled('h1', {
  fontSize: 36,
  fontWeight: 800,
  letterSpacing: -1,
  color: '#FFFFFF',
});

const Subtitle = styled('p', {
  fontSize: 14,
  color: '#9CA3AF',
  marginTop: -16,
});

const Card = styled('div', {
  backgroundColor: '#2a2a4a',
  borderRadius: 16,
  padding: 20,
  width: '85%',
  maxWidth: 320,
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
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
  color: '#9CA3AF',
});

const Value = styled('span', {
  fontSize: 20,
  fontWeight: 700,
  color: '#FFFFFF',
});

const BonusValue = styled('span', {
  fontSize: 16,
  fontWeight: 600,
  color: '#4ECDC4',
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
      <Title>{result.cleared ? 'Stage Clear!' : 'Time\'s Up!'}</Title>
      {!result.cleared && <Subtitle>You ran out of time</Subtitle>}
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
        {result.cleared && result.timeBonus != null && result.timeBonus > 0 && (
          <>
            <StatRow>
              <Label>Time Left</Label>
              <BonusValue>{result.secondsLeft}s</BonusValue>
            </StatRow>
            <StatRow>
              <Label>Time Bonus</Label>
              <BonusValue>+{result.timeBonus.toLocaleString()}</BonusValue>
            </StatRow>
          </>
        )}
      </Card>
      {result.cleared && (
        <Button
          css={{ backgroundColor: '#4ECDC4', color: '#1a1a2e' }}
          onClick={onNext}
        >
          Next Stage
        </Button>
      )}
      <Button
        css={{ backgroundColor: '#2a2a4a', color: '#FFFFFF', border: '1px solid #4a4a6a' }}
        onClick={onRetry}
      >
        {result.cleared ? 'Retry' : 'Try Again'}
      </Button>
      <Button
        css={{ backgroundColor: 'transparent', color: '#9CA3AF', fontSize: 16 }}
        onClick={onHome}
      >
        Home
      </Button>
    </Overlay>
  );
}
