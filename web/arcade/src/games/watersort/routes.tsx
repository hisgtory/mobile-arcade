import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { StageMap, type StageInfo } from '../../components/StageMap';
import { PlayLayout, isRN } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { ClearScreen as WaterSortClear } from './ClearScreen';
import { HUD as WaterSortHUD } from './HUD';
import { useGame as useWaterSortGame, type GameResult as WaterSortResult } from './useGame';

const STAGES: StageInfo[] = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, cleared: false }));

function WaterSortHomeRoute() {
  const navigate = useNavigate();
  return (
    <GameHomeLayout title="Water Sort" icon="💧">
      <StageMap
        stages={STAGES}
        currentStage={1}
        onStageSelect={(stage) => navigate(`/games/watersort/v1/stage/${stage}`)}
      />
    </GameHomeLayout>
  );
}

function WaterSortStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const parsed = parseInt(stageId || '1', 10);
  const stage = Number.isNaN(parsed) ? 1 : parsed;
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<WaterSortResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: WaterSortResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/watersort/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/watersort/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <WaterSortClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <WaterSortPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function WaterSortPlaying({ stage, onClear }: { stage: number; onClear: (r: WaterSortResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useWaterSortGame({ stage, onClear });
  return (
    <PlayLayout>
      <WaterSortHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/watersort/v1', [
  { path: '', element: <WaterSortHomeRoute /> },
  { path: 'stage/:stageId', element: <WaterSortStageRoute /> },
]);
