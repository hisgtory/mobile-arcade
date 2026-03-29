import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { globalStyles } from '../../styles/global';
import { GameCanvas } from '../../components/GameCanvas';
import { PlayLayout, isRN } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { ClearScreen as SudokuClear } from './ClearScreen';
import { HUD as SudokuHUD } from './HUD';
import { NumberPad as SudokuNumberPad } from './NumberPad';
import { useGame as useSudokuGame, type GameResult as SudokuResult } from './useGame';

function SudokuTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Sudoku</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Classic number puzzle!</p>
      <button
        onClick={() => navigate('/games/sudoku/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function SudokuStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
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

registerRoutes('/games/sudoku/v1', [
  { path: '', element: <SudokuTitleRoute /> },
  { path: 'stage/:stageId', element: <SudokuStageRoute /> },
]);
