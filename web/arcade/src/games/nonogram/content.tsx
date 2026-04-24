import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { StageMap } from '../../components/StageMap';
import { PlayLayout, isRN } from '../../components/PlayLayout';
import { GameCanvas } from '../../components/GameCanvas';
import { ClearScreen } from './ClearScreen';
import { HUD } from './HUD';
import { useGame, type GameResult } from './useGame';

const STAGE_COUNT = 10;

export function NonogramHome() {
  const navigate = useNavigate();
  const stages = Array.from({ length: STAGE_COUNT }, (_, i) => ({ id: i + 1, cleared: false }));

  return (
    <GameHomeLayout title="Nonogram" icon="🖼️">
      <StageMap
        stages={stages}
        currentStage={1}
        onStageSelect={(stage) => navigate(`/games/nonogram/v1/stage/${stage}`)}
      />
    </GameHomeLayout>
  );
}

export function NonogramStage() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: GameResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: GameResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/nonogram/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/nonogram/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ClearScreen result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <NonogramPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function NonogramPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: GameResult) => void; onGameOver: (r: GameResult) => void }) {
  const { containerRef, moves, progress, errors, doRestart } = useGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <HUD stage={stage} moves={moves} progress={progress} errors={errors} onRestart={doRestart} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}
