import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { PlayLayout } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { HUD as TicTacToeHUD } from './HUD';
import { useGame as useTicTacToeGame } from './useGame';

const GRID_OPTIONS = [
  { size: 3, label: '3×3', desc: 'Classic' },
  { size: 4, label: '4×4', desc: 'After 3 wins' },
  { size: 5, label: '5×5', desc: 'After 6 wins' },
] as const;

function TicTacToeHomeRoute() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(3);
  return (
    <GameHomeLayout title="Tic Tac Toe" icon="⭕">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', gap: 24 }}>
        <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 600, alignSelf: 'flex-start' }}>Grid Size</p>
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340, justifyContent: 'center' }}>
          {GRID_OPTIONS.map((opt) => (
            <button
              key={opt.size}
              onClick={() => setSelected(opt.size)}
              style={{
                flex: 1,
                padding: '16px 8px',
                borderRadius: 16,
                border: selected === opt.size ? '2px solid #2563EB' : '2px solid #E5E7EB',
                backgroundColor: selected === opt.size ? '#EFF6FF' : '#fff',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate(`/games/tictactoe/v1/play?grid=${selected}`)}
          style={{ marginTop: 16, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '18px 56px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
        >
          Play
        </button>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>Grid auto-upgrades as you win!</p>
      </div>
    </GameHomeLayout>
  );
}

function TicTacToePlayRoute() {
  const { containerRef, playerScore, aiScore } = useTicTacToeGame({ difficulty: 'medium' });
  return (
    <PlayLayout>
      <TicTacToeHUD playerScore={playerScore} aiScore={aiScore} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/tictactoe/v1', [
  { path: '', element: <TicTacToeHomeRoute /> },
  { path: 'play', element: <TicTacToePlayRoute /> },
]);
