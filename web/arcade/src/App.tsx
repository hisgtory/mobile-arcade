import { Routes, Route, Navigate } from 'react-router-dom';
import { globalStyles } from './styles/global';

// Game route registrations (side-effect imports)
import './games/found3/routes';
import './games/crunch3/routes';
import './games/blockrush/routes';
import './games/watersort/routes';
import './games/tictactoe/routes';
import './games/minesweeper/routes';
import './games/number10/routes';
import './games/sudoku/routes';
import './games/blockpuzzle/routes';
import './games/found3-react/routes';
import './games/blockcrush/routes';
import './games/woodoku/routes';
import './games/getcolor/routes';
import './games/chess/routes';

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

// ─── MahjongMatch ───
import { ClearScreen as MahjongMatchClear } from './games/mahjong-match/ClearScreen';
import { HUD as MahjongMatchHUD } from './games/mahjong-match/HUD';
import { useGame as useMahjongMatchGame, type GameResult as MahjongMatchResult } from './games/mahjong-match/useGame';
// ─── Puzzle3Go ───
import { ClearScreen as Puzzle3GoClear } from './games/puzzle3go/ClearScreen';
import { HUD as Puzzle3GoHUD } from './games/puzzle3go/HUD';
import { useGame as usePuzzle3GoGame, type GameResult as Puzzle3GoResult } from './games/puzzle3go/useGame';
// ─── Screwdom ───
import { ClearScreen as ScrewdomClear } from './games/screwdom/ClearScreen';
import { HUD as ScrewdomHUD } from './games/screwdom/HUD';
import { useGame as useScrewdomGame, type GameResult as ScrewdomResult } from './games/screwdom/useGame';
// ─── PixelFlow ───
import { ClearScreen as PixelFlowClear } from './games/pixelflow/ClearScreen';
import { HUD as PixelFlowHUD } from './games/pixelflow/HUD';
import { useGame as usePixelFlowGame, type GameResult as PixelFlowResult } from './games/pixelflow/useGame';
// ─── TangledRope ───
import { ClearScreen as TangledRopeClear } from './games/tangledrope/ClearScreen';
import { HUD as TangledRopeHUD } from './games/tangledrope/HUD';
import { useGame as useTangledRopeGame, type GameResult as TangledRopeResult } from './games/tangledrope/useGame';
// ─── CandyFriends ───
import { ClearScreen as CandyFriendsClear } from './games/candyfriends/ClearScreen';
import { HUD as CandyFriendsHUD } from './games/candyfriends/HUD';
import { useGame as useCandyFriendsGame, type GameResult as CandyFriendsResult } from './games/candyfriends/useGame';

// ─── TicTacToe ───
import { HUD as TicTacToeHUD } from './games/tictactoe/HUD';
import { useGame as useTicTacToeGame } from './games/tictactoe/useGame';

// ─── SaveDoge ───
import { ClearScreen as SaveDogeClear } from './games/savedoge/ClearScreen';
import { HUD as SaveDogeHUD } from './games/savedoge/HUD';
import { useGame as useSaveDogeGame, type GameResult as SaveDogeResult } from './games/savedoge/useGame';
// ─── HexaAway (ADR-016: side-effect route registration) ───
import './games/hexaaway/routes';

import { getRegisteredRoutes } from './router';
// ─── TrickyTwist ───
import { ClearScreen as TrickyTwistClear } from './games/trickytwist/ClearScreen';
import { HUD as TrickyTwistHUD } from './games/trickytwist/HUD';
import { useGame as useTrickyTwistGame, type GameResult as TrickyTwistResult } from './games/trickytwist/useGame';
// ─── WordPuzzle ───
import { ClearScreen as WordPuzzleClear } from './games/wordpuzzle/ClearScreen';
import { HUD as WordPuzzleHUD } from './games/wordpuzzle/HUD';
import { useGame as useWordPuzzleGame, type GameResult as WordPuzzleResult } from './games/wordpuzzle/useGame';
// ─── MatchFactory ───
import { ClearScreen as MatchFactoryClear } from './games/matchfactory/ClearScreen';
import { HUD as MatchFactoryHUD } from './games/matchfactory/HUD';
import { useGame as useMatchFactoryGame, type GameResult as MatchFactoryResult } from './games/matchfactory/useGame';
// ─── TrickyPrank ───
import { ClearScreen as TrickyPrankClear } from './games/trickyprank/ClearScreen';
import { HUD as TrickyPrankHUD } from './games/trickyprank/HUD';
import { useGame as useTrickyPrankGame, type GameResult as TrickyPrankResult } from './games/trickyprank/useGame';

const PlayLayout = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '$bg',
  overflow: 'hidden',
});

const GameTitle = styled('h1', {
  fontSize: 48,
  fontWeight: 800,
  color: '#111827',
  letterSpacing: -1,
  variants: {
    size: {
      large: { fontSize: 48 },
      medium: { fontSize: 36 },
    },
  },
});

const GameDescription = styled('p', {
  fontSize: 16,
  color: '#6B7280',
});

const PrimaryButton = styled('button', {
  marginTop: 32,
  backgroundColor: '#2563EB',
  color: '#fff',
  border: 'none',
  padding: '16px 48px',
  borderRadius: 16,
  fontSize: 20,
  fontWeight: 700,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#1D4ED8',
  },
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
      <GameTitle>Crunch 3</GameTitle>
      <GameDescription>Swipe & match 3 to crush!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/crunch3/v1/stage/1')}>
        Play
      </PrimaryButton>
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
      <GameTitle>Block Rush</GameTitle>
      <GameDescription>Fill lines to clear the board!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/blockrush/v1/play')}>
        Play
      </PrimaryButton>
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
      <GameTitle>Water Sort</GameTitle>
      <GameDescription>Sort the colors into tubes!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/watersort/v1/stage/1')}>
        Play
      </PrimaryButton>
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

// ─── MahjongMatch Routes ──────────────────────────────

function MahjongMatchTitleRoute() {
// ─── Puzzle3Go Routes ─────────────────────────────────

function Puzzle3GoTitleRoute() {
// ─── Screwdom Routes ──────────────────────────────────

function ScrewdomTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#f5f0e8' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#4A3520', letterSpacing: -1 }}>Screwdom</h1>
      <p style={{ fontSize: 16, color: '#8B7355' }}>Unscrew the planks!</p>
      <button
        onClick={() => navigate('/games/screwdom/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#A0522D', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
// ─── PixelFlow Routes ─────────────────────────────────

function PixelFlowTitleRoute() {
// ─── TangledRope Routes ───────────────────────────────

function TangledRopeTitleRoute() {
// ─── CandyFriends Routes ──────────────────────────────

function CandyFriendsTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <GameTitle>Mahjong Match</GameTitle>
      <GameDescription>Match free tiles to clear the board!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/mahjong-match/v1/stage/1')}>
        Play
      </PrimaryButton>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>퍼즐쓰리고</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>화투 패 매치-3 퍼즐!</p>
      <button
        onClick={() => navigate('/games/puzzle3go/v1/stage/1')}
      <GameTitle>Pixel Flow</GameTitle>
      <GameDescription>Connect the dots, fill the grid!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/pixelflow/v1/stage/1')}>
        Play
      </PrimaryButton>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Tangled Rope</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Untangle the ropes!</p>
      <button
        onClick={() => navigate('/games/tangledrope/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Candy Friends</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Match 3 sweet candies!</p>
      <button
        onClick={() => navigate('/games/candyfriends/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#EC4899', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <p style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#9CA3AF' }}>Pixel food icons by Alex Kovacsart (CC BY 4.0)</p>
    </PlayLayout>
  );
}

function MahjongMatchStageRoute() {
function Puzzle3GoStageRoute() {
function ScrewdomStageRoute() {
function PixelFlowStageRoute() {
function TangledRopeStageRoute() {
function CandyFriendsStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<MahjongMatchResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: MahjongMatchResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/mahjong-match/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing'); setGameResult(null);
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); setGameResult(null); }, []);
  const handleHome = useCallback(() => navigate('/games/mahjong-match/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <MahjongMatchClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <MahjongMatchPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function MahjongMatchPlaying({ stage, onClear }: { stage: number; onClear: (r: MahjongMatchResult) => void }) {
  const { containerRef, score, matchesLeft, shuffleNotice, doShuffle, doHint, doRestart } = useMahjongMatchGame({ stage, onClear });
  return (
    <PlayLayout>
      <MahjongMatchHUD stage={stage} score={score} matchesLeft={matchesLeft} shuffleNotice={shuffleNotice} onShuffle={doShuffle} onHint={doHint} onRestart={doRestart} />
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
  const [gameResult, setGameResult] = useState<ScrewdomResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: ScrewdomResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: ScrewdomResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/screwdom/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/screwdom/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ScrewdomClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <ScrewdomPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function ScrewdomPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: ScrewdomResult) => void; onGameOver: (r: ScrewdomResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useScrewdomGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout css={{ backgroundColor: '#f5f0e8' }}>
      <ScrewdomHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<PixelFlowResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: PixelFlowResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/pixelflow/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/pixelflow/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <PixelFlowClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <PixelFlowPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function PixelFlowPlaying({ stage, onClear }: { stage: number; onClear: (r: PixelFlowResult) => void }) {
  const { containerRef, score, moves, flowsCompleted, flowsTotal, coverage, doUndo, doRestart } = usePixelFlowGame({ stage, onClear });
  return (
    <PlayLayout>
      <PixelFlowHUD stage={stage} score={score} moves={moves} flowsCompleted={flowsCompleted} flowsTotal={flowsTotal} coverage={coverage} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<TangledRopeResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: TangledRopeResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/tangledrope/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/tangledrope/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <TangledRopeClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <TangledRopePlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function TangledRopePlaying({ stage, onClear }: { stage: number; onClear: (r: TangledRopeResult) => void }) {
  const { containerRef, moves, intersections, doUndo, doRestart } = useTangledRopeGame({ stage, onClear });
  return (
    <PlayLayout>
      <TangledRopeHUD stage={stage} moves={moves} intersections={intersections} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<CandyFriendsResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: CandyFriendsResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: CandyFriendsResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/candyfriends/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/candyfriends/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <CandyFriendsClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <CandyFriendsPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function CandyFriendsPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: CandyFriendsResult) => void; onGameOver: (r: CandyFriendsResult) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useCandyFriendsGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <CandyFriendsHUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
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
      <GameTitle>Tic Tac Toe</GameTitle>
      <GameDescription>Beat the AI in classic XO!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/tictactoe/v1/play')}>
        Play
      </PrimaryButton>
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

// ─── SaveDoge Routes ──────────────────────────────────

function SaveDogeTitleRoute() {
// ─── TrickyTwist Routes ───────────────────────────────

function TrickyTwistTitleRoute() {
// ─── WordPuzzle Routes ────────────────────────────────

function WordPuzzleTitleRoute() {
// ─── MatchFactory Routes ──────────────────────────────

function MatchFactoryTitleRoute() {
// ─── TrickyPrank Routes ───────────────────────────────

function TrickyPrankTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 64 }}>🐕</div>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Save the Doge</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Draw lines to protect the Doge!</p>
      <button
        onClick={() => navigate('/games/savedoge/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#22C55E', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>🧩 Tricky Twist</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Brain-twisting logic puzzles!</p>
      <button
        onClick={() => navigate('/games/trickytwist/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Word Puzzle</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Find hidden Korean words!</p>
      <button
        onClick={() => navigate('/games/wordpuzzle/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Match Factory</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Swipe & match to fill orders!</p>
      <button
        onClick={() => navigate('/games/matchfactory/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <p style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#9CA3AF' }}>Pixel food icons by Alex Kovacsart (CC BY 4.0)</p>
      <GameTitle>Tricky Prank</GameTitle>
      <GameDescription>Think outside the box! 🧩</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/trickyprank/v1/stage/1')}>
        Play
      </PrimaryButton>
    </PlayLayout>
  );
}

function SaveDogeStageRoute() {
function TrickyTwistStageRoute() {
function WordPuzzleStageRoute() {
function MatchFactoryStageRoute() {
function TrickyPrankStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<SaveDogeResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: SaveDogeResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: SaveDogeResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/savedoge/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/savedoge/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <SaveDogeClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <SaveDogePlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function SaveDogePlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: SaveDogeResult) => void; onGameOver: (r: SaveDogeResult) => void }) {
  const { containerRef, score, ink, maxInk, doUndo, doRestart } = useSaveDogeGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <SaveDogeHUD stage={stage} score={score} ink={ink} maxInk={maxInk} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<TrickyTwistResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: TrickyTwistResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: TrickyTwistResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/trickytwist/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/trickytwist/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <TrickyTwistClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <TrickyTwistPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function TrickyTwistPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: TrickyTwistResult) => void; onGameOver: (r: TrickyTwistResult) => void }) {
  const { containerRef, score, streak, current, total, timeRemaining } = useTrickyTwistGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <TrickyTwistHUD stage={stage} score={score} streak={streak} current={current} total={total} timeRemaining={timeRemaining} />
  const [gameResult, setGameResult] = useState<WordPuzzleResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: WordPuzzleResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/wordpuzzle/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/wordpuzzle/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <WordPuzzleClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <WordPuzzlePlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function WordPuzzlePlaying({ stage, onClear }: { stage: number; onClear: (r: WordPuzzleResult) => void }) {
  const { containerRef, score, foundWords, totalWords, doHint, doRestart } = useWordPuzzleGame({ stage, onClear });
  return (
    <PlayLayout>
      <WordPuzzleHUD stage={stage} foundWords={foundWords} totalWords={totalWords} score={score} onHint={doHint} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<MatchFactoryResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: MatchFactoryResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: MatchFactoryResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/matchfactory/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/matchfactory/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <MatchFactoryClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <MatchFactoryPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function MatchFactoryPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: MatchFactoryResult) => void; onGameOver: (r: MatchFactoryResult) => void }) {
  const { containerRef, score, combo, movesLeft, orders } = useMatchFactoryGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <MatchFactoryHUD stage={stage} score={score} movesLeft={movesLeft} combo={combo} orders={orders} />
  const [gameResult, setGameResult] = useState<TrickyPrankResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: TrickyPrankResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: TrickyPrankResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/trickyprank/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/trickyprank/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <TrickyPrankClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <TrickyPrankPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function TrickyPrankPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: TrickyPrankResult) => void; onGameOver: (r: TrickyPrankResult) => void }) {
  const { containerRef, attempts, doHint } = useTrickyPrankGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <TrickyPrankHUD stage={stage} attempts={attempts} onHint={doHint} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// ─── Root ──────────────────────────────────────────────
import { getRegisteredRoutes } from './router';

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

      {/* MahjongMatch */}
      <Route path="/games/mahjong-match/v1" element={<MahjongMatchTitleRoute />} />
      <Route path="/games/mahjong-match/v1/stage/:stageId" element={<MahjongMatchStageRoute />} />
      {/* Puzzle3Go */}
      <Route path="/games/puzzle3go/v1" element={<Puzzle3GoTitleRoute />} />
      <Route path="/games/puzzle3go/v1/stage/:stageId" element={<Puzzle3GoStageRoute />} />
      {/* PixelFlow */}
      <Route path="/games/pixelflow/v1" element={<PixelFlowTitleRoute />} />
      <Route path="/games/pixelflow/v1/stage/:stageId" element={<PixelFlowStageRoute />} />
      {/* TangledRope */}
      <Route path="/games/tangledrope/v1" element={<TangledRopeTitleRoute />} />
      <Route path="/games/tangledrope/v1/stage/:stageId" element={<TangledRopeStageRoute />} />

      {/* TicTacToe */}
      <Route path="/games/tictactoe/v1" element={<TicTacToeTitleRoute />} />
      <Route path="/games/tictactoe/v1/play" element={<TicTacToePlayRoute />} />

      {/* SaveDoge */}
      <Route path="/games/savedoge/v1" element={<SaveDogeTitleRoute />} />
      <Route path="/games/savedoge/v1/stage/:stageId" element={<SaveDogeStageRoute />} />
      {/* Registered routes (ADR-016) */}
      {getRegisteredRoutes().map((r) => (
        <Route key={r.path} path={r.path} element={r.element} />
      ))}
      {/* TrickyTwist */}
      <Route path="/games/trickytwist/v1" element={<TrickyTwistTitleRoute />} />
      <Route path="/games/trickytwist/v1/stage/:stageId" element={<TrickyTwistStageRoute />} />
      {/* WordPuzzle */}
      <Route path="/games/wordpuzzle/v1" element={<WordPuzzleTitleRoute />} />
      <Route path="/games/wordpuzzle/v1/stage/:stageId" element={<WordPuzzleStageRoute />} />
      {/* MatchFactory */}
      <Route path="/games/matchfactory/v1" element={<MatchFactoryTitleRoute />} />
      <Route path="/games/matchfactory/v1/stage/:stageId" element={<MatchFactoryStageRoute />} />
      {/* Screwdom */}
      <Route path="/games/screwdom/v1" element={<ScrewdomTitleRoute />} />
      <Route path="/games/screwdom/v1/stage/:stageId" element={<ScrewdomStageRoute />} />
      {/* TrickyPrank */}
      <Route path="/games/trickyprank/v1" element={<TrickyPrankTitleRoute />} />
      <Route path="/games/trickyprank/v1/stage/:stageId" element={<TrickyPrankStageRoute />} />
      {/* CandyFriends */}
      <Route path="/games/candyfriends/v1" element={<CandyFriendsTitleRoute />} />
      <Route path="/games/candyfriends/v1/stage/:stageId" element={<CandyFriendsStageRoute />} />

      {/* Default */}
      {getRegisteredRoutes().map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="/" element={<Navigate to="/games/found3/v1" replace />} />
    </Routes>
  );
}
