import { useState, useCallback } from 'react';
import { useNavigate, Route } from 'react-router-dom';
import { styled } from '../../styles/stitches.config';
import { globalStyles } from '../../styles/global';
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

const GameOverLayout = styled('div', {
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

const ScoreCard = styled('div', {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
  width: '85%',
  maxWidth: 320,
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
});

const ScoreLabel = styled('p', {
  fontSize: 14,
  color: '#8b7355',
});

const ScoreValue = styled('p', {
  fontSize: 28,
  fontWeight: 700,
  color: '#5c4a32',
});

const PrimaryButton = styled('button', {
  backgroundColor: '#8b5e3c',
  color: '#fff',
  border: 'none',
  padding: '16px 48px',
  borderRadius: 16,
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  width: '85%',
  maxWidth: 320,
});

const SecondaryButton = styled('button', {
  backgroundColor: '#fff',
  color: '#5c4a32',
  border: '1px solid #d4c5a9',
  padding: '16px 48px',
  borderRadius: 16,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  width: '85%',
  maxWidth: 320,
});

const GameOverTitle = styled('h1', {
  fontSize: 36,
  fontWeight: 800,
  color: '#a0522d',
});

// ─── Route Components ─────────────────────────────────

function WoodokuTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <GameHomeLayout
      title="Woodoku"
      subtitle="Fill rows, columns & regions!"
      titleColor="#5c4a32"
      subtitleColor="#8b7355"
      buttonColor="#8b5e3c"
      onPlay={() => navigate('/games/woodoku/v1/play')}
    />
  );
}

function WoodokuPlayRoute() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const handleGameOver = useCallback((r: GameResult) => {
    setGameResult(r);
  }, []);

  if (gameResult) {
    return (
      <GameOverLayout>
        <GameOverTitle>Game Over</GameOverTitle>
        <ScoreCard>
          <ScoreLabel>Score</ScoreLabel>
          <ScoreValue>{gameResult.score.toLocaleString()}</ScoreValue>
        </ScoreCard>
        <PrimaryButton onClick={() => { setGameResult(null); }}>
          Retry
        </PrimaryButton>
        <SecondaryButton onClick={() => navigate('/games/woodoku/v1')}>
          Home
        </SecondaryButton>
      </GameOverLayout>
    );
  }

  return <WoodokuPlaying onGameOver={handleGameOver} />;
}

function WoodokuPlaying({ onGameOver }: { onGameOver: (r: GameResult) => void }) {
  const { containerRef, score } = useGame({ onGameOver });
  return (
    <PlayLayout>
      <HUD score={score} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// ─── Route Registration ───────────────────────────────

export function woodokuRoutes() {
  return [
    <Route key="woodoku-title" path="/games/woodoku/v1" element={<WoodokuTitleRoute />} />,
    <Route key="woodoku-play" path="/games/woodoku/v1/play" element={<WoodokuPlayRoute />} />,
  ];
}
