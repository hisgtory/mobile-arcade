import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled } from '../../styles/stitches.config';
import { PlayLayout, isRN } from '../../components/PlayLayout';
import { GameCanvas } from '../../components/GameCanvas';
import { registerRoutes } from '../../router';

// ─── TileConnect ───
import { HUD as TileConnectHUD } from './HUD';
import { useGame as useTileConnectGame, type GameResult as TileConnectResult } from './useGame';

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
  backgroundColor: '#FF7043',
  color: '#fff',
  border: 'none',
  padding: '16px 48px',
  borderRadius: 16,
  fontSize: 20,
  fontWeight: 700,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#F4511E',
  },
});

function TileConnectTitleRoute() {
  const navigate = useNavigate();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <GameTitle>Tile Connect</GameTitle>
      <GameDescription>Connect matching tile pairs with paths!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/tileconnect/v1/stage/1')}>
        Play
      </PrimaryButton>
    </PlayLayout>
  );
}

function TileConnectStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<TileConnectResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: TileConnectResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: TileConnectResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/tileconnect/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/tileconnect/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return (
      <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 24, padding: 20 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: gameResult.cleared ? '#059669' : '#DC2626' }}>
          {gameResult.cleared ? 'Stage Clear!' : 'Game Over'}
        </h1>
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxWidth: 320, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 14, color: '#6B7280' }}>Score</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{gameResult.score.toLocaleString()}</p>
        </div>
        {gameResult.cleared && (
          <button
            onClick={handleNext}
            style={{ backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', width: '85%', maxWidth: 320 }}
          >
            Next Stage
          </button>
        )}
        <button
          onClick={handleRetry}
          style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #D1D5DB', padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Retry
        </button>
      </PlayLayout>
    );
  }

  return <TileConnectPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function TileConnectPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: TileConnectResult) => void; onGameOver: (r: TileConnectResult) => void }) {
  const { containerRef, score, combo, elapsedMs, timeLimit, remaining, total, doShuffle, doHint } = useTileConnectGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <TileConnectHUD
        stage={stage}
        score={score}
        combo={combo}
        elapsedMs={elapsedMs}
        timeLimit={timeLimit}
        remaining={remaining}
        total={total}
        onShuffle={doShuffle}
        onHint={doHint}
      />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// Register routes
registerRoutes('/games/tileconnect/v1', [
  { path: '', element: <TileConnectTitleRoute /> },
  { path: 'stage/:stageId', element: <TileConnectStageRoute /> },
]);
