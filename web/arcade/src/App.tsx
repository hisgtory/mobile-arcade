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

// ─── BlockRush ───
import { HUD as BlockRushHUD } from './games/blockrush/HUD';
import { useGame as useBlockRushGame, type GameResult as BlockRushResult } from './games/blockrush/useGame';

// ─── WaterSort ───
import { ClearScreen as WaterSortClear } from './games/watersort/ClearScreen';
import { HUD as WaterSortHUD } from './games/watersort/HUD';
import { useGame as useWaterSortGame, type GameResult as WaterSortResult } from './games/watersort/useGame';

// ─── Puzzle3Go ───
import { ClearScreen as Puzzle3GoClear } from './games/puzzle3go/ClearScreen';
import { HUD as Puzzle3GoHUD } from './games/puzzle3go/HUD';
import { useGame as usePuzzle3GoGame, type GameResult as Puzzle3GoResult } from './games/puzzle3go/useGame';

// ─── TicTacToe ───
import { HUD as TicTacToeHUD } from './games/tictactoe/HUD';
import { useGame as useTicTacToeGame } from './games/tictactoe/useGame';

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
      <p style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#9CA3AF' }}>Pixel food icons by Alex Kovacsart (CC BY 4.0)</p>
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

// ─── BlockRush Routes ──────────────────────────────────

function BlockRushTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Block Rush</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Fill lines to clear the board!</p>
      <button
        onClick={() => navigate('/games/blockrush/v1/play')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function BlockRushPlayRoute() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState<BlockRushResult | null>(null);

  const handleGameOver = useCallback((r: BlockRushResult) => {
    setGameResult(r); // Always show result in web (endless game, no RN stage flow)
  }, []);

  if (gameResult) {
    return (
      <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 24, padding: 20 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#DC2626' }}>Game Over</h1>
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxWidth: 320, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 14, color: '#6B7280' }}>Score</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{gameResult.score.toLocaleString()}</p>
        </div>
        <button
          onClick={() => { setGameResult(null); }}
          style={{ backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/games/blockrush/v1')}
          style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #D1D5DB', padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Home
        </button>
      </PlayLayout>
    );
  }

  return <BlockRushPlaying onGameOver={handleGameOver} />;
}

function BlockRushPlaying({ onGameOver }: { onGameOver: (r: BlockRushResult) => void }) {
  const { containerRef, score } = useBlockRushGame({ onGameOver });
  return (
    <PlayLayout>
      <BlockRushHUD score={score} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// ─── WaterSort Routes ─────────────────────────────────

function WaterSortTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Water Sort</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Sort the colors into tubes!</p>
      <button
        onClick={() => navigate('/games/watersort/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function WaterSortStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
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

// ─── Puzzle3Go Routes ─────────────────────────────────

function Puzzle3GoTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>퍼즐쓰리고</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>화투 패 매치-3 퍼즐!</p>
      <button
        onClick={() => navigate('/games/puzzle3go/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function Puzzle3GoStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<Puzzle3GoResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: Puzzle3GoResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: Puzzle3GoResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/puzzle3go/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/puzzle3go/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <Puzzle3GoClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <Puzzle3GoPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function Puzzle3GoPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: Puzzle3GoResult) => void; onGameOver: (r: Puzzle3GoResult) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = usePuzzle3GoGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <Puzzle3GoHUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// ─── TicTacToe Routes ─────────────────────────────────

function TicTacToeTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Tic Tac Toe</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Beat the AI in classic XO!</p>
      <button
        onClick={() => navigate('/games/tictactoe/v1/play')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function TicTacToePlayRoute() {
  const { containerRef, playerScore, aiScore } = useTicTacToeGame({ difficulty: 'medium' });
  return (
    <PlayLayout>
      <TicTacToeHUD playerScore={playerScore} aiScore={aiScore} />
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

      {/* BlockRush */}
      <Route path="/games/blockrush/v1" element={<BlockRushTitleRoute />} />
      <Route path="/games/blockrush/v1/play" element={<BlockRushPlayRoute />} />

      {/* WaterSort */}
      <Route path="/games/watersort/v1" element={<WaterSortTitleRoute />} />
      <Route path="/games/watersort/v1/stage/:stageId" element={<WaterSortStageRoute />} />

      {/* Puzzle3Go */}
      <Route path="/games/puzzle3go/v1" element={<Puzzle3GoTitleRoute />} />
      <Route path="/games/puzzle3go/v1/stage/:stageId" element={<Puzzle3GoStageRoute />} />

      {/* TicTacToe */}
      <Route path="/games/tictactoe/v1" element={<TicTacToeTitleRoute />} />
      <Route path="/games/tictactoe/v1/play" element={<TicTacToePlayRoute />} />

      {/* Default */}
      <Route path="/" element={<Navigate to="/games/found3/v1" replace />} />
    </Routes>
  );
}
