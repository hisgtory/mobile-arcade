import { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { styled } from './styles/stitches.config';
import { globalStyles } from './styles/global';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { ClearScreen } from './components/ClearScreen';
import { useGame, type GameResult } from './hooks/useGame';

const PlayLayout = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '$bg',
  overflow: 'hidden',
});

const isRN = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

function StageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((result: GameResult) => {
    if (!isRN) {
      setGameResult(result);
      setScreen('clear');
    }
  }, []);

  const handleGameOver = useCallback((result: GameResult) => {
    if (!isRN) {
      setGameResult(result);
      setScreen('clear');
    }
  }, []);

  const handleNext = useCallback(() => {
    navigate(`/games/crunch3/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1);
    setScreen('playing');
  }, [navigate, stage]);

  const handleRetry = useCallback(() => {
    setPlayKey((k) => k + 1);
    setScreen('playing');
  }, []);

  const handleHome = useCallback(() => {
    navigate('/games/crunch3/v1', { replace: true });
  }, [navigate]);

  if (screen === 'clear' && gameResult) {
    return (
      <ClearScreen
        result={gameResult}
        stage={stage}
        onNext={handleNext}
        onRetry={handleRetry}
        onHome={handleHome}
      />
    );
  }

  return (
    <PlayingScreen
      key={`${stage}-${playKey}`}
      stage={stage}
      onClear={handleClear}
      onGameOver={handleGameOver}
    />
  );
}

function PlayingScreen({
  stage,
  onClear,
  onGameOver,
}: {
  stage: number;
  onClear: (r: GameResult) => void;
  onGameOver: (r: GameResult) => void;
}) {
  const { containerRef, score, combo, movesLeft, targetScore } = useGame({
    stage,
    onClear,
    onGameOver,
  });

  return (
    <PlayLayout>
      <HUD
        stage={stage}
        score={score}
        targetScore={targetScore}
        movesLeft={movesLeft}
        combo={combo}
      />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

function TitleRoute() {
  const navigate = useNavigate();
  globalStyles();

  return (
    <PlayLayout
      css={{
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>
        Crunch 3
      </h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Swipe & match 3 to crush!</p>
      <button
        onClick={() => navigate('/games/crunch3/v1/stage/1')}
        style={{
          marginTop: 32,
          backgroundColor: '#2563EB',
          color: '#fff',
          border: 'none',
          padding: '16px 48px',
          borderRadius: 16,
          fontSize: 20,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Play
      </button>
      <p style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#9CA3AF' }}>
        CC BY 4.0 — hisgtory
      </p>
    </PlayLayout>
  );
}

export function App() {
  globalStyles();

  return (
    <Routes>
      <Route path="/games/crunch3/v1" element={<TitleRoute />} />
      <Route path="/games/crunch3/v1/stage/:stageId" element={<StageRoute />} />
      <Route path="/" element={<Navigate to="/games/crunch3/v1" replace />} />
    </Routes>
  );
}
