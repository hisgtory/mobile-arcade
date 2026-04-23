import { useNavigate } from 'react-router-dom';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { PlayLayout } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { ArenaGame } from './ArenaGame';

function NeonVanguardHomeRoute() {
  const navigate = useNavigate();

  return (
    <GameHomeLayout title="Neon Vanguard" icon="⚔️">
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 20,
          padding: '24px 20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 'min(92vw, 640px)',
            borderRadius: 28,
            padding: '28px 24px',
            color: '#e2e8f0',
            background: 'linear-gradient(135deg, #0f172a 0%, #13294b 55%, #1e3a8a 100%)',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#93c5fd', marginBottom: 12 }}>
            Arena Shooter
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>3v3 tactical showdown</h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0, color: '#cbd5e1' }}>
            Pick Titan, Striker, or Seraph and fight through a fast 3-minute team arena with dashes, shields, healing, and ultimates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/games/neon-vanguard/v1/play')}
          style={{
            backgroundColor: '#2563EB',
            color: '#fff',
            border: 'none',
            padding: '18px 56px',
            borderRadius: 18,
            fontSize: 20,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 14px 28px rgba(37, 99, 235, 0.25)',
          }}
        >
          Enter Arena
        </button>
      </div>
    </GameHomeLayout>
  );
}

function NeonVanguardPlayRoute() {
  return (
    <PlayLayout>
      <ArenaGame />
    </PlayLayout>
  );
}

registerRoutes('/games/neon-vanguard/v1', [
  { path: '', element: <NeonVanguardHomeRoute /> },
  { path: 'play', element: <NeonVanguardPlayRoute /> },
]);
