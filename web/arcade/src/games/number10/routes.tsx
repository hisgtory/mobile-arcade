import { useNavigate } from 'react-router-dom';
import { globalStyles } from '../../styles/global';
import { GameCanvas } from '../../components/GameCanvas';
import { PlayLayout } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { HUD as Number10HUD } from './HUD';
import { useGame as useNumber10Game } from './useGame';

function Number10TitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Make 10</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Drag to select numbers that sum to 10!</p>
      <button
        onClick={() => navigate('/games/number10/v1/play')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function Number10PlayRoute() {
  const { containerRef, score, remaining } = useNumber10Game();
  return (
    <PlayLayout>
      <Number10HUD score={score} remaining={remaining} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/number10/v1', [
  { path: '', element: <Number10TitleRoute /> },
  { path: 'play', element: <Number10PlayRoute /> },
]);
