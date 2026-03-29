import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { PlayLayout } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { HUD as BlockPuzzleHUD } from './HUD';
import { useGame as useBlockPuzzleGame, type GameResult as BlockPuzzleResult } from './useGame';

function BlockPuzzleTitleRoute() {
  const navigate = useNavigate();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Block Puzzle</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Fill lines with block pieces!</p>
      <button
        onClick={() => navigate('/games/blockpuzzle/v1/play')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function BlockPuzzlePlayRoute() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState<BlockPuzzleResult | null>(null);

  const handleGameOver = useCallback((r: BlockPuzzleResult) => {
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
          onClick={() => navigate('/games/blockpuzzle/v1')}
          style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #D1D5DB', padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Home
        </button>
      </PlayLayout>
    );
  }

  return <BlockPuzzlePlaying onGameOver={handleGameOver} />;
}

function BlockPuzzlePlaying({ onGameOver }: { onGameOver: (r: BlockPuzzleResult) => void }) {
  const { containerRef, score, bestScore } = useBlockPuzzleGame({ onGameOver });
  return (
    <PlayLayout>
      <BlockPuzzleHUD score={score} bestScore={bestScore} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/blockpuzzle/v1', [
  { path: '', element: <BlockPuzzleTitleRoute /> },
  { path: 'play', element: <BlockPuzzlePlayRoute /> },
]);
