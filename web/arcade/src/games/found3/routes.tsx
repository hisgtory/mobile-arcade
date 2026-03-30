import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { StageMap, type StageInfo } from '../../components/StageMap';
import { PlayLayout, isRN } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { ClearScreen as Found3Clear } from './ClearScreen';
import { HUD as Found3HUD } from './HUD';
import { SlotBar } from './SlotBar';
import { ItemBar } from './ItemBar';
import { useGame as useFound3Game, type GameResult as Found3Result } from './useGame';

const STAGES: StageInfo[] = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, cleared: false }));

function Found3HomeRoute() {
  const navigate = useNavigate();
  return (
    <GameHomeLayout title="Found 3" icon="🔍">
      <StageMap
        stages={STAGES}
        currentStage={1}
        onStageSelect={(stage) => navigate(`/games/found3/v1/stage/${stage}`)}
      />
    </GameHomeLayout>
  );
}

function Found3StageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const parsed = parseInt(stageId || '1', 10);
  const stage = Number.isNaN(parsed) ? 1 : parsed;
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<Found3Result | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: Found3Result) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: Found3Result) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/found3/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/found3/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <Found3Clear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <Found3Playing key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function Found3Playing({ stage, onClear, onGameOver }: { stage: number; onClear: (r: Found3Result) => void; onGameOver: (r: Found3Result) => void }) {
  const { containerRef, slotItems, remainingTiles, totalTiles, score, elapsedMs, itemCounts, doShuffle, doUndo, doMagnet, handleAdRequest } = useFound3Game({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <Found3HUD stage={stage} elapsedMs={elapsedMs} remainingTiles={remainingTiles} totalTiles={totalTiles} score={score} />
      <SlotBar items={slotItems} />
      <GameCanvas ref={containerRef} />
      <ItemBar onShuffle={doShuffle} onUndo={doUndo} onHint={doMagnet} shuffleCount={itemCounts.shuffle} undoCount={itemCounts.undo} hintCount={itemCounts.magnet} onAdRequest={handleAdRequest} />
    </PlayLayout>
  );
}

registerRoutes('/games/found3/v1', [
  { path: '', element: <Found3HomeRoute /> },
  { path: 'stage/:stageId', element: <Found3StageRoute /> },
]);
