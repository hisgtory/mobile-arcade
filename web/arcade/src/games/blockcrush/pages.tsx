import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { PlayLayout } from '../../components/PlayLayout';
import { HUD as BlockCrushHUD } from './HUD';
import { useGame as useBlockCrushGame, type GameResult as BlockCrushResult } from './useGame';

export function BlockCrushHomeRoute() {
  const navigate = useNavigate();
  return (
    <GameHomeLayout title="Block Crush" icon="💥">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#6B7280' }}>Tap groups to crush them!</p>
        <button
          onClick={() => navigate('/games/blockcrush/v1/play')}
          style={{ marginTop: 16, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '18px 56px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
        >
          Play
        </button>
      </div>
    </GameHomeLayout>
  );
}

export function BlockCrushPlayRoute() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState<BlockCrushResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleGameOver = useCallback((r: BlockCrushResult) => {
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
          onClick={() => { setGameResult(null); setRetryCount((k) => k + 1); }}
          style={{ backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/games/blockcrush/v1')}
          style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #D1D5DB', padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Home
        </button>
      </PlayLayout>
    );
  }

  return <BlockCrushPlaying key={retryCount} onGameOver={handleGameOver} />;
}

function BlockCrushPlaying({ onGameOver }: { onGameOver: (r: BlockCrushResult) => void }) {
  const { containerRef, score } = useBlockCrushGame({ onGameOver });
  return (
    <PlayLayout>
      <BlockCrushHUD score={score} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}
