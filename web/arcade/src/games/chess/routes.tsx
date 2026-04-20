import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { PlayLayout } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { HUD as ChessHUD } from './HUD';
import { useGame as useChessGame } from './useGame';
import type { Difficulty } from '@arcade/lib-chess';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', desc: 'Random moves' },
  { value: 'medium', label: 'Medium', desc: 'Greedy capture' },
  { value: 'hard', label: 'Hard', desc: 'Greedy (v2 soon)' },
];

function ChessHomeRoute() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Difficulty>('medium');
  return (
    <GameHomeLayout title="Chess" icon="♛">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', gap: 24 }}>
        <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 600, alignSelf: 'flex-start' }}>Difficulty</p>
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340, justifyContent: 'center' }}>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              style={{
                flex: 1,
                padding: '16px 8px',
                borderRadius: 16,
                border: selected === opt.value ? '2px solid #2563EB' : '2px solid #E5E7EB',
                backgroundColor: selected === opt.value ? '#EFF6FF' : '#fff',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate(`/games/chess/v1/play?difficulty=${selected}`)}
          style={{ marginTop: 16, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '18px 56px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
        >
          Play
        </button>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>You play White vs AI Black</p>
      </div>
    </GameHomeLayout>
  );
}

function ChessPlayRoute() {
  const [params] = useSearchParams();
  const difficulty = (params.get('difficulty') as Difficulty | null) ?? 'medium';
  const { containerRef, turn, status, playerWins, aiWins, draws, whiteMaterial, blackMaterial } =
    useChessGame({ difficulty });
  return (
    <PlayLayout>
      <ChessHUD
        turn={turn}
        status={status}
        playerWins={playerWins}
        aiWins={aiWins}
        draws={draws}
        whiteMaterial={whiteMaterial}
        blackMaterial={blackMaterial}
      />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/chess/v1', [
  { path: '', element: <ChessHomeRoute /> },
  { path: 'play', element: <ChessPlayRoute /> },
]);
