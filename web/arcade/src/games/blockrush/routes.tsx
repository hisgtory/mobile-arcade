import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalStyles } from '../../styles/global';
import { GameCanvas } from '../../components/GameCanvas';
import { PlayLayout } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { HUD as BlockRushHUD } from './HUD';
import { useGame as useBlockRushGame, type GameResult as BlockRushResult } from './useGame';

function BlockRushTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Block Rush</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Fill lines to clear the board!</p>
      <button
        onClick={() => navigate('/games/blockrush/v1/play')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function BlockRushPlayRoute() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState<BlockRushResult | null>(null);

  const handleGameOver = useCallback((r: BlockRushResult) => {
    setGameResult(r);
  }, []);

  if (gameResult) {
    return (
      <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 24, padding: 20 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#DC2626' }}>Game Over</h1>
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxWidth: 320, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 14, color: '#6B7280' }}>Score</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{gameResult.score.toLocaleString()}</p>
        </div>
        <button
          onClick={() => { setGameResult(null); }}
          style={{ backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/games/blockrush/v1')}
          style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #D1D5DB', padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Home
        </button>
      </PlayLayout>
    );
  }

  return <BlockRushPlaying onGameOver={handleGameOver} />;
}

function BlockRushPlaying({ onGameOver }: { onGameOver: (r: BlockRushResult) => void }) {
  const { containerRef, score } = useBlockRushGame({ onGameOver });
  return (
    <PlayLayout>
      <BlockRushHUD score={score} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/blockrush/v1', [
  { path: '', element: <BlockRushTitleRoute /> },
  { path: 'play', element: <BlockRushPlayRoute /> },
]);
