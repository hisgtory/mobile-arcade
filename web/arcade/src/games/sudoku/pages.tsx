import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { StageMap, type StageInfo } from '../../components/StageMap';
import { PlayLayout, isRN } from '../../components/PlayLayout';
import { ClearScreen as SudokuClear } from './ClearScreen';
import { HUD as SudokuHUD } from './HUD';
import { NumberPad as SudokuNumberPad } from './NumberPad';
import { useGame as useSudokuGame, type GameResult as SudokuResult } from './useGame';

const STAGES: StageInfo[] = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, cleared: false }));

export function SudokuHomeRoute() {
  const navigate = useNavigate();
  return (
    <GameHomeLayout title="Sudoku" icon="🔢">
      <StageMap
        stages={STAGES}
        currentStage={1}
        onStageSelect={(stage) => navigate(`/games/sudoku/v1/stage/${stage}`)}
      />
    </GameHomeLayout>
  );
}

export function SudokuStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const parsed = parseInt(stageId || '1', 10);
  const stage = Number.isNaN(parsed) ? 1 : parsed;
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<SudokuResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: SudokuResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: SudokuResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/sudoku/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/sudoku/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <SudokuClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <SudokuPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function SudokuPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: SudokuResult) => void; onGameOver: (r: SudokuResult) => void }) {
  const { containerRef, gameState, inputNumber, doErase, toggleNotes, doHint, doRestart } = useSudokuGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <SudokuHUD stage={stage} difficulty={gameState.difficulty} mistakes={gameState.mistakes} maxMistakes={gameState.maxMistakes} elapsedMs={gameState.elapsedMs} />
      <GameCanvas ref={containerRef} />
      <SudokuNumberPad
        numberCounts={gameState.numberCounts}
        notesMode={gameState.notesMode}
        onNumber={inputNumber}
        onErase={doErase}
        onToggleNotes={toggleNotes}
        onHint={doHint}
        onRestart={doRestart}
      />
    </PlayLayout>
  );
}
