import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { PlayLayout } from '../../components/PlayLayout';
import { HUD as Number10HUD } from './HUD';
import { useGame as useNumber10Game } from './useGame';

export function Number10HomeRoute() {
  const navigate = useNavigate();
  return (
    <GameHomeLayout title="Make 10" icon="🔟">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#6B7280' }}>Drag to select numbers that sum to 10!</p>
        <button
          onClick={() => navigate('/games/number10/v1/play')}
          style={{ marginTop: 16, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '18px 56px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
        >
          Play
        </button>
      </div>
    </GameHomeLayout>
  );
}

export function Number10PlayRoute() {
  const { containerRef, score, remaining } = useNumber10Game();
  return (
    <PlayLayout>
      <Number10HUD score={score} remaining={remaining} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}
