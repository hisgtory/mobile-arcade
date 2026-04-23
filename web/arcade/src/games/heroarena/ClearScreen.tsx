import { styled } from '../../styles/stitches.config';
import { GameResult } from './useGame';

const OverContainer = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 24,
  padding: 20,
  backgroundColor: '#05050a',
  overflow: 'hidden',
  color: '#fff',
});

const OverTitle = styled('h1', {
  fontSize: 48,
  fontWeight: 800,
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: 4,
});

const ScoreCard = styled('div', {
  backgroundColor: 'rgba(16, 16, 26, 0.85)',
  borderRadius: 16,
  padding: 30,
  width: '85%',
  maxWidth: 400,
  textAlign: 'center',
  border: '1px solid rgba(255, 255, 255, 0.1)',
});

const ScoreLabel = styled('p', {
  fontSize: 16,
  color: '#8892b0',
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: 1,
});

const ScoreValue = styled('p', {
  fontSize: 32,
  fontWeight: 700,
  color: '#fff',
  margin: '8px 0 0',
});

const ActionButton = styled('button', {
  border: 'none',
  padding: '16px 48px',
  borderRadius: 8,
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  width: '85%',
  maxWidth: 400,
  transition: 'all 0.2s',
  textTransform: 'uppercase',
  letterSpacing: 2,
});

interface ClearScreenProps {
  result: GameResult;
  onRetry: () => void;
  onHome: () => void;
}

export function ClearScreen({ result, onRetry, onHome }: ClearScreenProps) {
  const isBlueWin = result.winner === 'Blue';

  return (
    <OverContainer>
      <OverTitle style={{ color: isBlueWin ? '#00f0ff' : '#ff2a2a' }}>
        {result.winner} Team Victory
      </OverTitle>
      <ScoreCard>
        <ScoreLabel>Final Score</ScoreLabel>
        <ScoreValue>
          <span style={{ color: '#00f0ff' }}>{Math.floor(result.blueScore)}</span>
          {' - '}
          <span style={{ color: '#ff2a2a' }}>{Math.floor(result.redScore)}</span>
        </ScoreValue>
      </ScoreCard>
      <ActionButton
        style={{ backgroundColor: isBlueWin ? '#00f0ff' : '#ff2a2a', color: '#000' }}
        onClick={onRetry}
      >
        Play Again
      </ActionButton>
      <ActionButton
        style={{ backgroundColor: 'transparent', color: '#fff', border: '2px solid #2a2a40' }}
        onClick={onHome}
      >
        Back to Menu
      </ActionButton>
    </OverContainer>
  );
}
