import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { PlayLayout } from '../../components/PlayLayout';
import { HUD as WoodokuHUD } from './HUD';
import { useGame as useWoodokuGame, type GameResult as WoodokuResult } from './useGame';

export function WoodokuHomeRoute() {
  const navigate = useNavigate();
  return (
    <GameHomeLayout title="Woodoku Blast" icon="🪵">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#6B7280' }}>Fill rows, columns & regions!</p>
        <button
          onClick={() => navigate('/games/woodoku/v1/play')}
          style={{ marginTop: 16, backgroundColor: '#8b5e3c', color: '#fff', border: 'none', padding: '18px 56px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
        >
          Play
        </button>
      </div>
    </GameHomeLayout>
  );
}

export function WoodokuPlayRoute() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState<WoodokuResult | null>(null);

  const handleGameOver = useCallback((r: WoodokuResult) => {
    setGameResult(r);
  }, []);

  if (gameResult) {
    return (
      <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 24, padding: 20 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#a0522d' }}>Game Over</h1>
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxWidth: 320, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 14, color: '#8b7355' }}>Score</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#5c4a32' }}>{gameResult.score.toLocaleString()}</p>
        </div>
        <button
          onClick={() => { setGameResult(null); }}
          style={{ backgroundColor: '#8b5e3c', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/games/woodoku/v1')}
          style={{ backgroundColor: '#fff', color: '#5c4a32', border: '1px solid #d4c5a9', padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Home
        </button>
      </PlayLayout>
    );
  }

  return <WoodokuPlaying onGameOver={handleGameOver} />;
}

function WoodokuPlaying({ onGameOver }: { onGameOver: (r: WoodokuResult) => void }) {
  const { containerRef, score } = useWoodokuGame({ onGameOver });
  return (
    <PlayLayout>
      <WoodokuHUD score={score} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}
