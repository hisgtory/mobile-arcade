import { styled } from '../../styles/stitches.config';
import type { GameResult } from './useGame';

const Container = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#1a1a2e',
  gap: 24,
  padding: 20,
});

const Title = styled('h1', {
  fontSize: 36,
  fontWeight: 800,
  variants: {
    cleared: {
      true: { color: '#10B981' },
      false: { color: '#F43F5E' },
    },
  },
});

const StatsCard = styled('div', {
  backgroundColor: '#16213e',
  borderRadius: 16,
  padding: 20,
  width: '85%',
  maxWidth: 320,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
});

const StatRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const StatLabel = styled('span', { fontSize: 16, color: '#8b8fa3' });
const StatValue = styled('span', { fontSize: 20, fontWeight: 700, color: '#e2e8f0' });

const ButtonGroup = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '85%',
  maxWidth: 320,
});

const Button = styled('button', {
  width: '100%',
  padding: '16px',
  borderRadius: 16,
  border: 'none',
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  variants: {
    variant: {
      primary: {
        backgroundColor: '#FA6C41',
        color: '#fff',
      },
      secondary: {
        backgroundColor: '#16213e',
        color: '#e2e8f0',
        border: '1px solid #0f3460',
      },
    },
  },
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
    <Container>
      <Title cleared={result.cleared}>
        {result.cleared ? 'Stage Clear!' : 'Game Over'}
      </Title>
      <StatsCard>
        <StatRow>
          <StatLabel>Stage</StatLabel>
          <StatValue>{stage}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Score</StatLabel>
          <StatValue>{(result.score ?? 0).toLocaleString()}</StatValue>
        </StatRow>
      </StatsCard>
      <ButtonGroup>
        {result.cleared ? (
          <Button variant="primary" onClick={onNext}>Next Stage</Button>
        ) : (
          <Button variant="primary" onClick={onRetry}>Retry</Button>
        )}
        <Button variant="secondary" onClick={onHome}>Home</Button>
      </ButtonGroup>
    </Container>
  );
}
