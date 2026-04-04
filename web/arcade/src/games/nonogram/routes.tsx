import { useState, useCallback } from 'react';
import { Route, useParams, useNavigate } from 'react-router-dom';
import { styled } from '../../styles/stitches.config';
import { globalStyles } from '../../styles/global';
import { GameCanvas } from '../../components/GameCanvas';
import { ClearScreen } from './ClearScreen';
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

const isRN = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

// ─── Title / Stage Map ──────────────────────────────────

function NonogramTitleRoute() {
  const navigate = useNavigate();
  globalStyles();

  const stages = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12, overflowY: 'auto' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>🖼️ Nonogram</h1>
      <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 16 }}>Fill the grid to reveal pixel art!</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: '0 20px', maxWidth: 320, width: '100%' }}>
        {stages.map((s) => (
          <button
            key={s}
            onClick={() => navigate(`/games/nonogram/v1/stage/${s}`)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              border: '2px solid #D1D5DB',
              backgroundColor: '#fff',
              fontSize: 18,
              fontWeight: 700,
              color: '#111827',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </PlayLayout>
  );
}

// ─── Stage Route ─────────────────────────────────────────

function NonogramStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: GameResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: GameResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/nonogram/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/nonogram/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ClearScreen result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <NonogramPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function NonogramPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: GameResult) => void; onGameOver: (r: GameResult) => void }) {
  const { containerRef, moves, progress, errors, doRestart } = useGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <HUD stage={stage} moves={moves} progress={progress} errors={errors} onRestart={doRestart} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// ─── Route Registration ─────────────────────────────────

export function nonogramRoutes() {
  return [
    <Route key="nonogram-title" path="/games/nonogram/v1" element={<NonogramTitleRoute />} />,
    <Route key="nonogram-stage" path="/games/nonogram/v1/stage/:stageId" element={<NonogramStageRoute />} />,
  ];
}
