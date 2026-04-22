import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { PlayLayout } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { HUD as MinesweeperHUD } from './HUD';
import { useGame as useMinesweeperGame, type GameResult as MinesweeperResult } from './useGame';
import { type Difficulty as MSDifficulty, DIFFICULTIES as MS_DIFFICULTIES } from '@arcade/lib-minesweeper';

const DIFF_OPTIONS: { key: MSDifficulty; color: string; detail: string }[] = [
  { key: 'easy', color: '#059669', detail: '9×9 · 10 mines' },
  { key: 'medium', color: '#2563EB', detail: '16×16 · 40 mines' },
  { key: 'expert', color: '#DC2626', detail: '16×16 · 56 mines' },
];

function MinesweeperHomeRoute() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<MSDifficulty>('easy');
  return (
    <GameHomeLayout title="Minesweeper" icon="💣">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', gap: 16 }}>
        <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 600, alignSelf: 'flex-start' }}>Difficulty</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
          {DIFF_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              style={{
                padding: '14px 16px',
                borderRadius: 16,
                border: selected === opt.key ? `2px solid ${opt.color}` : '2px solid #E5E7EB',
                backgroundColor: selected === opt.key ? `${opt.color}10` : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>{opt.key}</span>
              <span style={{ fontSize: 13, color: '#6B7280' }}>{opt.detail}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate(`/games/minesweeper/v1/play/${selected}`)}
          style={{ marginTop: 16, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '18px 56px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
        >
          Play
        </button>
      </div>
    </GameHomeLayout>
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
  { path: '', element: <MinesweeperHomeRoute /> },
  { path: 'play/:difficulty', element: <MinesweeperPlayRoute /> },
]);
