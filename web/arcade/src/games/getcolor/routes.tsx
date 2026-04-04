import { useState, useCallback } from 'react';
import { Route, useParams, useNavigate } from 'react-router-dom';
import { styled } from '../../styles/stitches.config';
import { globalStyles } from '../../styles/global';
import { GameCanvas } from '../../components/GameCanvas';
import { ClearScreen } from './ClearScreen';
import { HUD } from './HUD';
import { useGame, type GameResult } from './useGame';

const isRN = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

// ─── Styled Components ──────────────────────────────────

const PlayLayout = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '$bg',
  overflow: 'hidden',
});

const HomeLayout = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 12,
  backgroundColor: '#1a1a2e',
});

const HomeTitle = styled('h1', {
  fontSize: 48,
  fontWeight: 800,
  color: '#FFFFFF',
  letterSpacing: -1,
  margin: 0,
});

const HomeSubtitle = styled('p', {
  fontSize: 16,
  color: '#9CA3AF',
  margin: 0,
});

const PlayButton = styled('button', {
  marginTop: 32,
  backgroundColor: '#4ECDC4',
  color: '#1a1a2e',
  border: 'none',
  padding: '16px 48px',
  borderRadius: 16,
  fontSize: 20,
  fontWeight: 700,
  cursor: 'pointer',
});

// ─── Route Components ───────────────────────────────────

function TitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <HomeLayout>
      <HomeTitle>Get Color</HomeTitle>
      <HomeSubtitle>Sort colors before time runs out!</HomeSubtitle>
      <PlayButton onClick={() => navigate('/games/getcolor/v1/stage/1')}>
        Play
      </PlayButton>
    </HomeLayout>
  );
}

function StageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: GameResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleTimeout = useCallback((r: GameResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/getcolor/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/getcolor/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ClearScreen result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <Playing key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onTimeout={handleTimeout} />;
}

function Playing({ stage, onClear, onTimeout }: { stage: number; onClear: (r: GameResult) => void; onTimeout: (r: GameResult) => void }) {
  const { containerRef, score, moves, timerSec, doUndo, doRestart } = useGame({ stage, onClear, onTimeout });
  return (
    <PlayLayout css={{ backgroundColor: '#1a1a2e' }}>
      <HUD stage={stage} score={score} moves={moves} timerSec={timerSec} onUndo={doUndo} onRestart={doRestart} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// ─── Route Registration ─────────────────────────────────

export function getColorRoutes() {
  return [
    <Route key="getcolor-title" path="/games/getcolor/v1" element={<TitleRoute />} />,
    <Route key="getcolor-stage" path="/games/getcolor/v1/stage/:stageId" element={<StageRoute />} />,
  ];
}
