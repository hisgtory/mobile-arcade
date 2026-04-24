import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { PlayLayout, isRN } from '../../components/PlayLayout';
import { ClearScreen } from './ClearScreen';
import { HUD } from './HUD';
import { useGame, type GameResult } from './useGame';

export function GetColorHomeRoute() {
  const navigate = useNavigate();
  return (
    <GameHomeLayout title="Get Color" icon="🎨">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#9CA3AF' }}>Sort colors before time runs out!</p>
        <button
          onClick={() => navigate('/games/getcolor/v1/stage/1')}
          style={{ marginTop: 16, backgroundColor: '#4ECDC4', color: '#1a1a2e', border: 'none', padding: '18px 56px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
        >
          Play
        </button>
      </div>
    </GameHomeLayout>
  );
}

export function GetColorStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const parsed = parseInt(stageId || '1', 10);
  const stage = Number.isNaN(parsed) ? 1 : parsed;
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: GameResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleTimeout = useCallback((r: GameResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/getcolor/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/getcolor/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ClearScreen result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <GetColorPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onTimeout={handleTimeout} />;
}

function GetColorPlaying({ stage, onClear, onTimeout }: { stage: number; onClear: (r: GameResult) => void; onTimeout: (r: GameResult) => void }) {
  const { containerRef, score, moves, timerSec, doUndo, doRestart } = useGame({ stage, onClear, onTimeout });
  return (
    <PlayLayout css={{ backgroundColor: '#1a1a2e' }}>
      <HUD stage={stage} score={score} moves={moves} timerSec={timerSec} onUndo={doUndo} onRestart={doRestart} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}
