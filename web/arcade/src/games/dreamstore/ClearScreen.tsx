import { styled } from '../../styles/stitches.config';
import type { GameResult } from './useGame';

const Container = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff5f7',
  gap: 24,
  padding: 20,
});

const Title = styled('h1', {
  fontSize: 36,
  fontWeight: 800,
  variants: {
    cleared: {
      true: { color: '$emerald500' },
      false: { color: '$rose500' },
    },
  },
});

const StatsCard = styled('div', {
  backgroundColor: '$surface',
  borderRadius: 16,
  padding: 20,
  width: '85%',
  maxWidth: 320,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
});

const StatRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const StatLabel = styled('span', { fontSize: 16, color: '$textMuted' });
const StatValue = styled('span', { fontSize: 20, fontWeight: 700, color: '$text' });

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
        backgroundColor: '#db2777',
        color: '#fff',
      },
      secondary: {
        backgroundColor: '$surface',
        color: '$text',
        border: '1px solid #fce7f3',
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
        {result.cleared ? '🎉 Stage Clear!' : '⏰ Time Up!'}
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
