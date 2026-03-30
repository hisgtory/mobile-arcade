import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { PlayLayout, isRN } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { ClearScreen as ForestPopClear } from './ClearScreen';
import { HUD as ForestPopHUD } from './HUD';
import { useGame as useForestPopGame, type GameResult as ForestPopResult } from './useGame';

function ForestPopTitleRoute() {
  const navigate = useNavigate();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>🌲 Forest Pop</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Tap groups of animals to pop!</p>
      <button
        onClick={() => navigate('/games/forestpop/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function ForestPopStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const parsed = parseInt(stageId || '1', 10);
  const stage = Number.isNaN(parsed) ? 1 : parsed;
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<ForestPopResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: ForestPopResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: ForestPopResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/forestpop/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/forestpop/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ForestPopClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <ForestPopPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function ForestPopPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: ForestPopResult) => void; onGameOver: (r: ForestPopResult) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useForestPopGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <ForestPopHUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/forestpop/v1', [
  { path: '', element: <ForestPopTitleRoute /> },
  { path: 'stage/:stageId', element: <ForestPopStageRoute /> },
]);
