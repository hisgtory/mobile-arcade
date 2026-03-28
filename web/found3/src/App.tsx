import { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { styled } from './styles/stitches.config';
import { globalStyles } from './styles/global';
import { TitleScreen } from './components/TitleScreen';
import { ClearScreen } from './components/ClearScreen';
import { HUD } from './components/HUD';
import { SlotBar } from './components/SlotBar';
import { ItemBar } from './components/ItemBar';
import { GameCanvas } from './components/GameCanvas';
import { useGame, type GameResult } from './hooks/useGame';

const PlayLayout = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '$bg',
  overflow: 'hidden',
});

const isRN = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

function StageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((result: GameResult) => {
    if (!isRN) {
      setGameResult(result);
      setScreen('clear');
    }
  }, []);

  const handleGameOver = useCallback((result: GameResult) => {
    if (!isRN) {
      setGameResult(result);
      setScreen('clear');
    }
  }, []);

  const handleNext = useCallback(() => {
    navigate(`/games/found3/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1);
    setScreen('playing');
  }, [navigate, stage]);

  const handleRetry = useCallback(() => {
    setPlayKey((k) => k + 1);
    setScreen('playing');
  }, []);

  const handleHome = useCallback(() => {
    navigate('/games/found3/v1', { replace: true });
  }, [navigate]);

  if (screen === 'clear' && gameResult) {
    return (
      <ClearScreen
        result={gameResult}
        stage={stage}
        onNext={handleNext}
        onRetry={handleRetry}
        onHome={handleHome}
      />
    );
  }

  return (
    <PlayingScreen
      key={`${stage}-${playKey}`}
      stage={stage}
      onClear={handleClear}
      onGameOver={handleGameOver}
    />
  );
}

function PlayingScreen({
  stage,
  onClear,
  onGameOver,
}: {
  stage: number;
  onClear: (r: GameResult) => void;
  onGameOver: (r: GameResult) => void;
}) {
  const {
    containerRef,
    slotItems,
    remainingTiles,
    totalTiles,
    score,
    elapsedMs,
    itemCounts,
    doShuffle,
    doUndo,
    doMagnet,
    handleAdRequest,
  } = useGame({ stage, onClear, onGameOver });

  return (
    <PlayLayout>
      <HUD
        stage={stage}
        elapsedMs={elapsedMs}
        remainingTiles={remainingTiles}
        totalTiles={totalTiles}
        score={score}
      />
      <SlotBar items={slotItems} />
      <GameCanvas ref={containerRef} />
      <ItemBar
        onShuffle={doShuffle}
        onUndo={doUndo}
        onHint={doMagnet}
        shuffleCount={itemCounts.shuffle}
        undoCount={itemCounts.undo}
        hintCount={itemCounts.magnet}
        onAdRequest={handleAdRequest}
      />
    </PlayLayout>
  );
}

function TitleRoute() {
  const navigate = useNavigate();
  globalStyles();

  const handlePlay = useCallback(() => {
    navigate('/games/found3/v1/stage/1');
  }, [navigate]);

  return <TitleScreen stage={1} onPlay={handlePlay} />;
}

export function App() {
  globalStyles();

  return (
    <Routes>
      <Route path="/games/found3/v1" element={<TitleRoute />} />
      <Route path="/games/found3/v1/stage/:stageId" element={<StageRoute />} />
      <Route path="/" element={<Navigate to="/games/found3/v1" replace />} />
    </Routes>
  );
}
