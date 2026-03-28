import { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { styled } from './styles/stitches.config';
import { globalStyles } from './styles/global';

// ─── Shared ───
import { GameCanvas } from './components/GameCanvas';

// ─── Found3 ───
import { TitleScreen as Found3Title } from './games/found3/TitleScreen';
import { ClearScreen as Found3Clear } from './games/found3/ClearScreen';
import { HUD as Found3HUD } from './games/found3/HUD';
import { SlotBar } from './games/found3/SlotBar';
import { ItemBar } from './games/found3/ItemBar';
import { useGame as useFound3Game, type GameResult as Found3Result } from './games/found3/useGame';

// ─── Crunch3 ───
import { ClearScreen as Crunch3Clear } from './games/crunch3/ClearScreen';
import { HUD as Crunch3HUD } from './games/crunch3/HUD';
import { useGame as useCrunch3Game, type GameResult as Crunch3Result } from './games/crunch3/useGame';

const PlayLayout = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '$bg',
  overflow: 'hidden',
});

const isRN = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

// ─── Found3 Routes ─────────────────────────────────────

function Found3TitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <Found3Title
      stage={1}
      onPlay={() => navigate('/games/found3/v1/stage/1')}
    />
  );
}

function Found3StageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
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

// ─── Crunch3 Routes ────────────────────────────────────

function Crunch3TitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Crunch 3</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Swipe & match 3 to crush!</p>
      <button
        onClick={() => navigate('/games/crunch3/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <p style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#9CA3AF' }}>CC BY 4.0 — hisgtory</p>
    </PlayLayout>
  );
}

function Crunch3StageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<Crunch3Result | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: Crunch3Result) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: Crunch3Result) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/crunch3/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/crunch3/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <Crunch3Clear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <Crunch3Playing key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function Crunch3Playing({ stage, onClear, onGameOver }: { stage: number; onClear: (r: Crunch3Result) => void; onGameOver: (r: Crunch3Result) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useCrunch3Game({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <Crunch3HUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// ─── Root ──────────────────────────────────────────────

export function App() {
  globalStyles();
  return (
    <Routes>
      {/* Found3 */}
      <Route path="/games/found3/v1" element={<Found3TitleRoute />} />
      <Route path="/games/found3/v1/stage/:stageId" element={<Found3StageRoute />} />

      {/* Crunch3 */}
      <Route path="/games/crunch3/v1" element={<Crunch3TitleRoute />} />
      <Route path="/games/crunch3/v1/stage/:stageId" element={<Crunch3StageRoute />} />

      {/* Default */}
      <Route path="/" element={<Navigate to="/games/found3/v1" replace />} />
    </Routes>
  );
}
