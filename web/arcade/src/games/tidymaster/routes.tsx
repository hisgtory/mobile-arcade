import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled } from '../../styles/stitches.config';
import { PlayLayout } from '../../components/PlayLayout';
import { GameCanvas } from '../../components/GameCanvas';
import { registerRoutes } from '../../router';

// ─── TidyMaster ───
import { ClearScreen as TidyMasterClear } from './ClearScreen';
import { HUD as TidyMasterHUD } from './HUD';
import { useGame as useTidyMasterGame, type GameResult as TidyMasterResult } from './useGame';

const isRN = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

const GameTitle = styled('h1', {
  fontSize: 48,
  fontWeight: 800,
  color: '#111827',
  letterSpacing: -1,
});

const GameDescription = styled('p', {
  fontSize: 16,
  color: '#6B7280',
});

const PrimaryButton = styled('button', {
  marginTop: 32,
  backgroundColor: '#2563EB',
  color: '#fff',
  border: 'none',
  padding: '16px 48px',
  borderRadius: 16,
  fontSize: 20,
  fontWeight: 700,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#1D4ED8',
  },
});

function TidyMasterTitleRoute() {
  const navigate = useNavigate();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <GameTitle>Tidy Master</GameTitle>
      <GameDescription>Sort items into the right shelves!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/tidymaster/v1/stage/1')}>
        Play
      </PrimaryButton>
    </PlayLayout>
  );
}

function TidyMasterStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<TidyMasterResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: TidyMasterResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: TidyMasterResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/tidymaster/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/tidymaster/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <TidyMasterClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <TidyMasterPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function TidyMasterPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: TidyMasterResult) => void; onGameOver: (r: TidyMasterResult) => void }) {
  const { containerRef, score, moves, timeRemaining, doUndo, doRestart } = useTidyMasterGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <TidyMasterHUD stage={stage} score={score} moves={moves} timeRemaining={timeRemaining} onUndo={doUndo} onRestart={doRestart} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// Register routes
registerRoutes('/games/tidymaster/v1', [
  { path: '', element: <TidyMasterTitleRoute /> },
  { path: 'stage/:stageId', element: <TidyMasterStageRoute /> },
]);
