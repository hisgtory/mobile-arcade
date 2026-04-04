import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '../../styles/stitches.config';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { HUD } from './HUD';
import { useGame, type GameResult } from './useGame';

const PlayLayout = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '$bg',
  overflow: 'hidden',
});

const OverContainer = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 24,
  padding: 20,
  backgroundColor: '$bg',
  overflow: 'hidden',
});

const OverTitle = styled('h1', {
  fontSize: 36,
  fontWeight: 800,
  color: '#DC2626',
  margin: 0,
});

const ScoreCard = styled('div', {
  backgroundColor: '$surface',
  borderRadius: 16,
  padding: 20,
  width: '85%',
  maxWidth: 320,
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
});

const ScoreLabel = styled('p', {
  fontSize: 14,
  color: '$textMuted',
  margin: 0,
});

const ScoreValue = styled('p', {
  fontSize: 28,
  fontWeight: 700,
  color: '$text',
  margin: '4px 0 0',
});

const ActionButton = styled('button', {
  border: 'none',
  padding: '16px 48px',
  borderRadius: 16,
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  width: '85%',
  maxWidth: 320,
});

export function HexaAwayTitleRoute() {
  return (
    <GameHomeLayout
      title="Hexa Away"
      subtitle="Fill hex lines to clear!"
      playPath="/games/hexaaway/v1/play"
      color="#8b5cf6"
    />
  );
}

export function HexaAwayPlayRoute() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const handleGameOver = useCallback((r: GameResult) => {
    setGameResult(r);
  }, []);

  if (gameResult) {
    return (
      <OverContainer>
        <OverTitle>Game Over</OverTitle>
        <ScoreCard>
          <ScoreLabel>Score</ScoreLabel>
          <ScoreValue>{gameResult.score.toLocaleString()}</ScoreValue>
        </ScoreCard>
        <ActionButton
          css={{ backgroundColor: '#8b5cf6', color: '#fff' }}
          onClick={() => { setGameResult(null); }}
        >
          Retry
        </ActionButton>
        <ActionButton
          css={{ backgroundColor: '$surface', color: '$text', border: '1px solid $gray200' }}
          onClick={() => navigate('/games/hexaaway/v1')}
        >
          Home
        </ActionButton>
      </OverContainer>
    );
  }

  return <HexaAwayPlaying onGameOver={handleGameOver} />;
}

function HexaAwayPlaying({ onGameOver }: { onGameOver: (r: GameResult) => void }) {
  const { containerRef, score } = useGame({ onGameOver });
  return (
    <PlayLayout>
      <HUD score={score} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}
