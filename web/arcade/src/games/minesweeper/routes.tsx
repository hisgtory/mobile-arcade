import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { globalStyles } from '../../styles/global';
import { GameCanvas } from '../../components/GameCanvas';
import { PlayLayout } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { HUD as MinesweeperHUD } from './HUD';
import { useGame as useMinesweeperGame, type GameResult as MinesweeperResult } from './useGame';
import { type Difficulty as MSDifficulty, DIFFICULTIES as MS_DIFFICULTIES } from '@arcade/lib-minesweeper';

function MinesweeperTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>💣 Minesweeper</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Classic mine-sweeping puzzle!</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24, width: '80%', maxWidth: 320 }}>
        <button
          onClick={() => navigate('/games/minesweeper/v1/play/easy')}
          style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '16px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
        >
          Easy (9×9)
        </button>
        <button
          onClick={() => navigate('/games/minesweeper/v1/play/medium')}
          style={{ backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
        >
          Medium (16×16)
        </button>
        <button
          onClick={() => navigate('/games/minesweeper/v1/play/expert')}
          style={{ backgroundColor: '#DC2626', color: '#fff', border: 'none', padding: '16px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
        >
          Expert (16×16)
        </button>
      </div>
    </PlayLayout>
  );
}

function MinesweeperPlayRoute() {
  const { difficulty: diffParam } = useParams();
  const navigate = useNavigate();
  const difficulty = (Object.keys(MS_DIFFICULTIES).includes(diffParam || '') ? diffParam : 'easy') as MSDifficulty;
  const [gameResult, setGameResult] = useState<MinesweeperResult | null>(null);

  const handleGameOver = useCallback((r: MinesweeperResult) => {
    setGameResult(r);
  }, []);

  if (gameResult) {
    return (
      <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 24, padding: 20 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: gameResult.won ? '#059669' : '#DC2626' }}>
          {gameResult.won ? '🎉 You Win!' : '💥 Game Over'}
        </h1>
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxWidth: 320, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 14, color: '#6B7280' }}>Time</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{Math.floor(gameResult.elapsed / 60)}:{(gameResult.elapsed % 60).toString().padStart(2, '0')}</p>
        </div>
        <button
          onClick={() => setGameResult(null)}
          style={{ backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/games/minesweeper/v1')}
          style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #D1D5DB', padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Home
        </button>
      </PlayLayout>
    );
  }

  return <MinesweeperPlaying key={difficulty} difficulty={difficulty} onGameOver={handleGameOver} />;
}

function MinesweeperPlaying({ difficulty, onGameOver }: { difficulty: MSDifficulty; onGameOver: (r: MinesweeperResult) => void }) {
  const { containerRef, minesRemaining, elapsed } = useMinesweeperGame({ difficulty, onGameOver });
  const diffLabel = MS_DIFFICULTIES[difficulty].label;
  return (
    <PlayLayout>
      <MinesweeperHUD minesRemaining={minesRemaining} elapsed={elapsed} difficulty={diffLabel} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/minesweeper/v1', [
  { path: '', element: <MinesweeperTitleRoute /> },
  { path: 'play/:difficulty', element: <MinesweeperPlayRoute /> },
]);
