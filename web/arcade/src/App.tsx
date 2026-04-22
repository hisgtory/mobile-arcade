import { useCallback, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { globalStyles } from './styles/global';
import { styled } from './styles/stitches.config';
import { GameCanvas } from './components/GameCanvas';

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

// ─── SlidingMatch ───
import { ClearScreen as SlideMatchClear } from './games/slidematch/ClearScreen';
import { HUD as SlideMatchHUD } from './games/slidematch/HUD';
import { useGame as useSlideMatchGame, type GameResult as SlideMatchResult } from './games/slidematch/useGame';
// ─── CandyPop ───
import { ClearScreen as CandyPopClear } from './games/candypop/ClearScreen';
import { HUD as CandyPopHUD } from './games/candypop/HUD';
import { useGame as useCandyPopGame, type GameResult as CandyPopResult } from './games/candypop/useGame';
// ─── AllInHole ───
import { ClearScreen as AllInHoleClear } from './games/allinhole/ClearScreen';
import { HUD as AllInHoleHUD } from './games/allinhole/HUD';
import { useGame as useAllInHoleGame, type GameResult as AllInHoleResult } from './games/allinhole/useGame';
// ─── LineDraw ───
import { ClearScreen as LineDrawClear } from './games/linedraw/ClearScreen';
import { HUD as LineDrawHUD } from './games/linedraw/HUD';
import { useGame as useLineDrawGame, type GameResult as LineDrawResult } from './games/linedraw/useGame';
// ─── EscapeRoom ───
import { ClearScreen as EscapeRoomClear } from './games/escaperoom/ClearScreen';
import { HUD as EscapeRoomHUD } from './games/escaperoom/HUD';
import { useGame as useEscapeRoomGame, type GameResult as EscapeRoomResult } from './games/escaperoom/useGame';
// ─── Fishdom ───
import { ClearScreen as FishdomClear } from './games/fishdom/ClearScreen';
import { HUD as FishdomHUD } from './games/fishdom/HUD';
import { useGame as useFishdomGame, type GameResult as FishdomResult } from './games/fishdom/useGame';
// ─── CarJam ───
import { ClearScreen as CarJamClear } from './games/carjam/ClearScreen';
import { HUD as CarJamHUD } from './games/carjam/HUD';
import { useGame as useCarJamGame, type GameResult as CarJamResult } from './games/carjam/useGame';
// ─── BlockyQuest ───
import { ClearScreen as BlockyQuestClear } from './games/blockyquest/ClearScreen';
import { HUD as BlockyQuestHUD } from './games/blockyquest/HUD';
import { useGame as useBlockyQuestGame, type GameResult as BlockyQuestResult } from './games/blockyquest/useGame';
// ─── TrafficJam ───
import { ClearScreen as TrafficJamClear } from './games/trafficjam/ClearScreen';
import { HUD as TrafficJamHUD } from './games/trafficjam/HUD';
import { useGame as useTrafficJamGame, type GameResult as TrafficJamResult } from './games/trafficjam/useGame';
import { TOTAL_STAGES as TRAFFICJAM_TOTAL_STAGES } from '@arcade/lib-trafficjam';
// ─── StarryNight ───
import { HUD as StarryNightHUD } from './games/starrynight/HUD';
import { useGame as useStarryNightGame, type GameResult as StarryNightResult } from './games/starrynight/useGame';
// ─── BusJam ───
import { ClearScreen as BusJamClear } from './games/busjam/ClearScreen';
import { HUD as BusJamHUD } from './games/busjam/HUD';
import { useGame as useBusJamGame, type GameResult as BusJamResult } from './games/busjam/useGame';
// ─── CarOut ───
import { ClearScreen as CarOutClear } from './games/carout/ClearScreen';
import { HUD as CarOutHUD } from './games/carout/HUD';
import { useGame as useCarOutGame, type GameResult as CarOutResult } from './games/carout/useGame';
// ─── SkewerJam ───
import { ClearScreen as SkewerJamClear } from './games/skewerjam/ClearScreen';
import { HUD as SkewerJamHUD } from './games/skewerjam/HUD';
import { useGame as useSkewerJamGame, type GameResult as SkewerJamResult } from './games/skewerjam/useGame';
// ─── Anipang4 ───
import { ClearScreen as Anipang4Clear } from './games/anipang4/ClearScreen';
import { HUD as Anipang4HUD } from './games/anipang4/HUD';
import { useGame as useAnipang4Game, type GameResult as Anipang4Result } from './games/anipang4/useGame';

// ─── TicTacToe ───
import { HUD as TicTacToeHUD } from './games/tictactoe/HUD';
import { useGame as useTicTacToeGame } from './games/tictactoe/useGame';

// ─── TidyMaster ───
import { ClearScreen as TidyMasterClear } from './games/tidymaster/ClearScreen';
import { HUD as TidyMasterHUD } from './games/tidymaster/HUD';
import { useGame as useTidyMasterGame, type GameResult as TidyMasterResult } from './games/tidymaster/useGame';
// ─── DefendKing ───
import { ClearScreen as DefendKingClear } from './games/defendking/ClearScreen';
import { HUD as DefendKingHUD } from './games/defendking/HUD';
import { useGame as useDefendKingGame, type GameResult as DefendKingResult } from './games/defendking/useGame';
// ─── SpotDiff ───
import { ClearScreen as SpotDiffClear } from './games/spotdiff/ClearScreen';
import { HUD as SpotDiffHUD } from './games/spotdiff/HUD';
import { useGame as useSpotDiffGame, type GameResult as SpotDiffResult } from './games/spotdiff/useGame';
// ─── MysteryTown ───
import { ClearScreen as MysteryTownClear } from './games/mystery-town/ClearScreen';
import { HUD as MysteryTownHUD } from './games/mystery-town/HUD';
import { useGame as useMysteryTownGame, type GameResult as MysteryTownResult } from './games/mystery-town/useGame';
// ─── SpotIt ───
import { ClearScreen as SpotItClear } from './games/spotit/ClearScreen';
import { HUD as SpotItHUD } from './games/spotit/HUD';
import { useGame as useSpotItGame, type GameResult as SpotItResult } from './games/spotit/useGame';
// ─── ForestPop ───
import { ClearScreen as ForestPopClear } from './games/forestpop/ClearScreen';
import { HUD as ForestPopHUD } from './games/forestpop/HUD';
import { useGame as useForestPopGame, type GameResult as ForestPopResult } from './games/forestpop/useGame';
// ─── HelloTown ───
import { ClearScreen as HelloTownClear } from './games/hellotown/ClearScreen';
import { HUD as HelloTownHUD } from './games/hellotown/HUD';
import { useGame as useHelloTownGame, type GameResult as HelloTownResult } from './games/hellotown/useGame';
import { TOTAL_STAGES as HELLOTOWN_TOTAL_STAGES } from '@arcade/lib-hellotown';
// ─── Tangram ───
import { ClearScreen as TangramClear } from './games/tangram/ClearScreen';
import { HUD as TangramHUD } from './games/tangram/HUD';
import { useGame as useTangramGame, type GameResult as TangramResult } from './games/tangram/useGame';
// ─── PixelArt ───
import { ClearScreen as PixelArtClear } from './games/pixelart/ClearScreen';
import { HUD as PixelArtHUD } from './games/pixelart/HUD';
import { useGame as usePixelArtGame, type GameResult as PixelArtResult } from './games/pixelart/useGame';
// ─── ToonBlast ───
import { ClearScreen as ToonBlastClear } from './games/toonblast/ClearScreen';
import { HUD as ToonBlastHUD } from './games/toonblast/HUD';
import { useGame as useToonBlastGame, type GameResult as ToonBlastResult } from './games/toonblast/useGame';
// ─── ColorSlide ───
import { ClearScreen as ColorSlideClear } from './games/colorslide/ClearScreen';
import { HUD as ColorSlideHUD } from './games/colorslide/HUD';
import { useGame as useColorSlideGame, type GameResult as ColorSlideResult } from './games/colorslide/useGame';
// ─── YarnFever ───
import { ClearScreen as YarnFeverClear } from './games/yarnfever/ClearScreen';
import { HUD as YarnFeverHUD } from './games/yarnfever/HUD';
import { useGame as useYarnFeverGame, type GameResult as YarnFeverResult } from './games/yarnfever/useGame';
// ─── Arrows ───
import { ClearScreen as ArrowsClear } from './games/arrows/ClearScreen';
import { HUD as ArrowsHUD } from './games/arrows/HUD';
import { useGame as useArrowsGame, type GameResult as ArrowsResult } from './games/arrows/useGame';
// ─── BrainOut ───
import { ClearScreen as BrainOutClear } from './games/brainout/ClearScreen';
import { HUD as BrainOutHUD } from './games/brainout/HUD';
import { useGame as useBrainOutGame, type GameResult as BrainOutResult } from './games/brainout/useGame';

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

// ─── SlidingMatch Routes ──────────────────────────────

function SlideMatchTitleRoute() {
// ─── CandyPop Routes ──────────────────────────────────

function CandyPopTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#e8f5e9' }}>
      <h1 style={{ fontSize: 44, fontWeight: 800, color: '#2e7d32', letterSpacing: -1 }}>🌳 Candy Pop</h1>
      <p style={{ fontSize: 16, color: '#558b2f' }}>Forest Match-3 Puzzle</p>
      <button
        onClick={() => navigate('/games/candypop/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <p style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#81c784' }}>Pixel food icons by Alex Kovacsart (CC BY 4.0)</p>
// ─── AllInHole Routes ─────────────────────────────────

function AllInHoleTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#1a1a2e' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#eeeeff', letterSpacing: -1 }}>All in Hole</h1>
      <p style={{ fontSize: 16, color: '#8888aa' }}>Swipe to slide all balls into holes!</p>
      <button
        onClick={() => navigate('/games/allinhole/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#3B82F6', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
// ─── LineDraw Routes ──────────────────────────────────

function LineDrawTitleRoute() {
// ─── EscapeRoom Routes ────────────────────────────────

function EscapeRoomTitleRoute() {
// ─── Fishdom Routes ────────────────────────────────────

function FishdomTitleRoute() {
// ─── CarJam Routes ─────────────────────────────────────

function CarJamTitleRoute() {
// ─── ColorSlide Routes ────────────────────────────────

function ColorSlideTitleRoute() {
// ─── TrafficJam Routes ─────────────────────────────────

function TrafficJamTitleRoute() {
// ─── StarryNight Routes ───────────────────────────────

function StarryNightTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#0f172a' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fbbf24', letterSpacing: -1 }}>⭐ Starry Night</h1>
      <p style={{ fontSize: 16, color: '#94a3b8' }}>Fill lines under the starry sky!</p>
      <button
        onClick={() => navigate('/games/starrynight/v1/play')}
        style={{ marginTop: 32, backgroundColor: '#fbbf24', color: '#0f172a', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
// ─── BusJam Routes ────────────────────────────────────

function BusJamTitleRoute() {
// ─── CarOut Routes ─────────────────────────────────────

function CarOutTitleRoute() {
// ─── SkewerJam Routes ─────────────────────────────────

function SkewerJamTitleRoute() {
// ─── Anipang4 Routes ──────────────────────────────────

function Anipang4TitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <GameTitle>Sliding Match</GameTitle>
      <GameDescription>Slide rows & columns to match 3!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/slidematch/v1/stage/1')}>
        Play
      </PrimaryButton>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Line Draw</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Draw a path through every cell!</p>
      <button
        onClick={() => navigate('/games/linedraw/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Escape Room</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Find clues & solve puzzles to escape!</p>
      <button
        onClick={() => navigate('/games/escaperoom/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#0C4A6E', letterSpacing: -1 }}>🐠 Fishdom</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Match 3 to build your aquarium!</p>
      <button
        onClick={() => navigate('/games/fishdom/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#0EA5E9', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Car Jam</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Tap cars to clear the traffic!</p>
      <button
        onClick={() => navigate('/games/carjam/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Color Slide</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Slide tiles to group colors!</p>
      <button
        onClick={() => navigate('/games/colorslide/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#A855F7', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Traffic Frenzy</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Tap cars to clear the road!</p>
      <button
        onClick={() => navigate('/games/trafficjam/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Bus Jam</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Match passengers to their buses!</p>
      <button
        onClick={() => navigate('/games/busjam/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Car Out!</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Slide cars to free the exit!</p>
      <button
        onClick={() => navigate('/games/carout/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#EF4444', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Skewer Jam</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Sort food on skewers!</p>
      <button
        onClick={() => navigate('/games/skewerjam/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#EA580C', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Anipang 4</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Match tiles before time runs out!</p>
      <button
        onClick={() => navigate('/games/anipang4/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <p style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#9CA3AF' }}>Pixel food icons by Alex Kovacsart (CC BY 4.0)</p>
    </PlayLayout>
  );
}

function SlideMatchStageRoute() {
function CandyPopStageRoute() {
function AllInHoleStageRoute() {
function LineDrawStageRoute() {
function EscapeRoomStageRoute() {
function FishdomStageRoute() {
function CarJamStageRoute() {
function ColorSlideStageRoute() {
function TrafficJamStageRoute() {
function StarryNightPlayRoute() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState<StarryNightResult | null>(null);

  const handleGameOver = useCallback((r: StarryNightResult) => {
    setGameResult(r);
  }, []);

  if (gameResult) {
    return (
      <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 24, padding: 20, backgroundColor: '#0f172a' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fbbf24' }}>Game Over</h1>
        <div style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 20, width: '85%', maxWidth: 320, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Score</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{gameResult.score.toLocaleString()}</p>
        </div>
        <button
          onClick={() => { setGameResult(null); }}
          style={{ backgroundColor: '#fbbf24', color: '#0f172a', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/games/starrynight/v1')}
          style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Home
        </button>
      </PlayLayout>
    );
  }

  return <StarryNightPlaying onGameOver={handleGameOver} />;
}

function StarryNightPlaying({ onGameOver }: { onGameOver: (r: StarryNightResult) => void }) {
  const { containerRef, score } = useStarryNightGame({ onGameOver });
  return (
    <PlayLayout css={{ backgroundColor: '#0f172a' }}>
      <StarryNightHUD score={score} />
function BusJamStageRoute() {
function CarOutStageRoute() {
function SkewerJamStageRoute() {
function Anipang4StageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<SlideMatchResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'result'>('playing');

  const handleClear = useCallback((r: SlideMatchResult) => {
    if (!isRN) { setGameResult(r); setScreen('result'); }
  }, []);
  const handleGameOver = useCallback((r: SlideMatchResult) => {
    if (!isRN) { setGameResult(r); setScreen('result'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/slidematch/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/slidematch/v1', { replace: true }), [navigate]);

  if (screen === 'result' && gameResult) {
    return <SlideMatchClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <SlideMatchPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function SlideMatchPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: SlideMatchResult) => void; onGameOver: (r: SlideMatchResult) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useSlideMatchGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <SlideMatchHUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
  const [gameResult, setGameResult] = useState<CandyPopResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: CandyPopResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: CandyPopResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/candypop/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/candypop/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <CandyPopClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <CandyPopPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function CandyPopPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: CandyPopResult) => void; onGameOver: (r: CandyPopResult) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useCandyPopGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout css={{ backgroundColor: '#e8f5e9' }}>
      <CandyPopHUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
  const [gameResult, setGameResult] = useState<AllInHoleResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: AllInHoleResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: AllInHoleResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/allinhole/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/allinhole/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <AllInHoleClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <AllInHolePlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function AllInHolePlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: AllInHoleResult) => void; onGameOver: (r: AllInHoleResult) => void }) {
  const { containerRef, movesLeft, remaining, total } = useAllInHoleGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <AllInHoleHUD stage={stage} movesLeft={movesLeft} remaining={remaining} total={total} />
  const [gameResult, setGameResult] = useState<LineDrawResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: LineDrawResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/linedraw/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/linedraw/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <LineDrawClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <LineDrawPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function LineDrawPlaying({ stage, onClear }: { stage: number; onClear: (r: LineDrawResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useLineDrawGame({ stage, onClear });
  return (
    <PlayLayout>
      <LineDrawHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<EscapeRoomResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: EscapeRoomResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/escaperoom/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/escaperoom/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <EscapeRoomClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <EscapeRoomPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function EscapeRoomPlaying({ stage, onClear }: { stage: number; onClear: (r: EscapeRoomResult) => void }) {
  const { containerRef, score, clues, doRestart } = useEscapeRoomGame({ stage, onClear });
  return (
    <PlayLayout>
      <EscapeRoomHUD stage={stage} score={score} clues={clues} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<FishdomResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: FishdomResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: FishdomResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/fishdom/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/fishdom/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <FishdomClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <FishdomPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function FishdomPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: FishdomResult) => void; onGameOver: (r: FishdomResult) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useFishdomGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <FishdomHUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
  const [gameResult, setGameResult] = useState<CarJamResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: CarJamResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/carjam/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/carjam/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <CarJamClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <CarJamPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function CarJamPlaying({ stage, onClear }: { stage: number; onClear: (r: CarJamResult) => void }) {
  const { containerRef, score, moves, carsRemaining, carsTotal, doUndo, doRestart } = useCarJamGame({ stage, onClear });
  return (
    <PlayLayout>
      <CarJamHUD stage={stage} score={score} moves={moves} carsRemaining={carsRemaining} carsTotal={carsTotal} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<ColorSlideResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: ColorSlideResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/colorslide/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/colorslide/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ColorSlideClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <ColorSlidePlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function ColorSlidePlaying({ stage, onClear }: { stage: number; onClear: (r: ColorSlideResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useColorSlideGame({ stage, onClear });
  return (
    <PlayLayout>
      <ColorSlideHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<TrafficJamResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: TrafficJamResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/trafficjam/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/trafficjam/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    const isLastStage = stage >= TRAFFICJAM_TOTAL_STAGES;
    return <TrafficJamClear result={gameResult} stage={stage} onNext={isLastStage ? null : handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <TrafficJamPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function TrafficJamPlaying({ stage, onClear }: { stage: number; onClear: (r: TrafficJamResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useTrafficJamGame({ stage, onClear });
  return (
    <PlayLayout>
      <TrafficJamHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<BusJamResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: BusJamResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: BusJamResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/busjam/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/busjam/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <BusJamClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <BusJamPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function BusJamPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: BusJamResult) => void; onGameOver: (r: BusJamResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useBusJamGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <BusJamHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<CarOutResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: CarOutResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/carout/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/carout/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <CarOutClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <CarOutPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function CarOutPlaying({ stage, onClear }: { stage: number; onClear: (r: CarOutResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useCarOutGame({ stage, onClear });
  return (
    <PlayLayout>
      <CarOutHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<SkewerJamResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: SkewerJamResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/skewerjam/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/skewerjam/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <SkewerJamClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <SkewerJamPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function SkewerJamPlaying({ stage, onClear }: { stage: number; onClear: (r: SkewerJamResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useSkewerJamGame({ stage, onClear });
  return (
    <PlayLayout>
      <SkewerJamHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<Anipang4Result | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: Anipang4Result) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: Anipang4Result) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/anipang4/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/anipang4/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <Anipang4Clear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <Anipang4Playing key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function Anipang4Playing({ stage, onClear, onGameOver }: { stage: number; onClear: (r: Anipang4Result) => void; onGameOver: (r: Anipang4Result) => void }) {
  const { containerRef, score, combo, timeLeft, targetScore } = useAnipang4Game({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <Anipang4HUD stage={stage} score={score} targetScore={targetScore} timeLeft={timeLeft} combo={combo} />
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

// ─── TidyMaster Routes ────────────────────────────────

function TidyMasterTitleRoute() {
// ─── DefendKing Routes ────────────────────────────────

function DefendKingTitleRoute() {
// ─── SpotDiff Routes ──────────────────────────────────

function SpotDiffTitleRoute() {
// ─── Root ──────────────────────────────────────────────
// ─── MysteryTown Routes ───────────────────────────────

function MysteryTownTitleRoute() {
// ─── Root ──────────────────────────────────────────────
// ─── SpotIt Routes ─────────────────────────────────────

function SpotItTitleRoute() {
// ─── ForestPop Routes ──────────────────────────────────

function ForestPopTitleRoute() {
// ─── Root ──────────────────────────────────────────────
// ─── HelloTown Routes ─────────────────────────────────

function HelloTownTitleRoute() {
// ─── Tangram Routes ───────────────────────────────────

function TangramTitleRoute() {
// ─── PixelArt Routes ──────────────────────────────────

function PixelArtTitleRoute() {
// ─── Root ──────────────────────────────────────────────
// ─── BlockyQuest Routes ────────────────────────────────

function BlockyQuestTitleRoute() {
// ─── ToonBlast Routes ──────────────────────────────────

function ToonBlastTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#1a1a2e' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#e2e8f0', letterSpacing: -1 }}>Toon Blast</h1>
      <p style={{ fontSize: 16, color: '#8b8fa3' }}>Tap blocks to blast!</p>
      <button
        onClick={() => navigate('/games/toonblast/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#FA6C41', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
// ─── Root ──────────────────────────────────────────────
// ─── YarnFever Routes ─────────────────────────────────

function YarnFeverTitleRoute() {
// ─── Root ──────────────────────────────────────────────
// ─── Arrows Routes ────────────────────────────────────

function ArrowsTitleRoute() {
// ─── Root ──────────────────────────────────────────────
// ─── BrainOut Routes ──────────────────────────────────

function BrainOutTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <GameTitle>Tidy Master</GameTitle>
      <GameDescription>Sort items into the right shelves!</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/tidymaster/v1/stage/1')}>
        Play
      </PrimaryButton>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Defend King</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Destroy all enemies to protect the king!</p>
      <button
        onClick={() => navigate('/games/defendking/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Spot Diff</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Find all the differences!</p>
      <button
        onClick={() => navigate('/games/spotdiff/v1/stage/1')}
      <h1 style={{ fontSize: 42, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>🔍 Mystery Town</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Merge clues to solve the case!</p>
      <button
        onClick={() => navigate('/games/mystery-town/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#8B5CF6', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Investigate
      <h1 style={{ fontSize: 44, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>🔍 Spot It!</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Find the hidden objects!</p>
      <button
        onClick={() => navigate('/games/spotit/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#F59E0B', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <p style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#9CA3AF' }}>Pixel food icons by Alex Kovacsart (CC BY 4.0)</p>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>🌲 Forest Pop</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Tap groups of forest friends to pop!</p>
      <button
        onClick={() => navigate('/games/forestpop/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#16A34A', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      <h1 style={{ fontSize: 40, fontWeight: 800, color: '#8B4513', letterSpacing: -1 }}>Hello Town</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Merge items to build your town!</p>
      <button
        onClick={() => navigate('/games/hellotown/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#8B4513', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Tangram</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Fill the silhouette with triangle pieces!</p>
      <button
        onClick={() => navigate('/games/tangram/v1/stage/1')}
      <GameTitle>Pixel Art</GameTitle>
      <GameDescription>Number coloring puzzle! 🎨</GameDescription>
      <PrimaryButton onClick={() => navigate('/games/pixelart/v1/stage/1')}>
        Play
      </PrimaryButton>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Blocky Quest</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Place blocks & clear lines!</p>
      <button
        onClick={() => navigate('/games/blockyquest/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Yarn Fever</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Untangle the yarn!</p>
      <button
        onClick={() => navigate('/games/yarnfever/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Arrows</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Rotate arrows to find the path!</p>
      <button
        onClick={() => navigate('/games/arrows/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>🧠 Brain Out</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>넌센스 퀴즈에 도전하세요!</p>
      <button
        onClick={() => navigate('/games/brainout/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function TidyMasterStageRoute() {
function DefendKingStageRoute() {
function SpotDiffStageRoute() {
function MysteryTownStageRoute() {
function SpotItStageRoute() {
function ForestPopStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const parsed = parseInt(stageId || '1', 10);
  const stage = Number.isNaN(parsed) ? 1 : parsed;
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<ForestPopResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: ForestPopResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: ForestPopResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/forestpop/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/forestpop/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ForestPopClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <ForestPopPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function ForestPopPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: ForestPopResult) => void; onGameOver: (r: ForestPopResult) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useForestPopGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <ForestPopHUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
function HelloTownStageRoute() {
function TangramStageRoute() {
function PixelArtStageRoute() {
function BlockyQuestStageRoute() {
function ToonBlastStageRoute() {
function YarnFeverStageRoute() {
function ArrowsStageRoute() {
function BrainOutStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<TidyMasterResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: TidyMasterResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: TidyMasterResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/tidymaster/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/tidymaster/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <TidyMasterClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <TidyMasterPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function TidyMasterPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: TidyMasterResult) => void; onGameOver: (r: TidyMasterResult) => void }) {
  const { containerRef, score, moves, timeRemaining, doUndo, doRestart } = useTidyMasterGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <TidyMasterHUD stage={stage} score={score} moves={moves} timeRemaining={timeRemaining} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<DefendKingResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: DefendKingResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: DefendKingResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/defendking/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/defendking/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <DefendKingClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <DefendKingPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function DefendKingPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: DefendKingResult) => void; onGameOver: (r: DefendKingResult) => void }) {
  const { containerRef, score, ammoLeft, enemiesLeft } = useDefendKingGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <DefendKingHUD stage={stage} score={score} ammoLeft={ammoLeft} enemiesLeft={enemiesLeft} />
  const [gameResult, setGameResult] = useState<SpotDiffResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: SpotDiffResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: SpotDiffResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/spotdiff/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/spotdiff/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <SpotDiffClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <SpotDiffPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function SpotDiffPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: SpotDiffResult) => void; onGameOver: (r: SpotDiffResult) => void }) {
  const { containerRef, score, lives, maxLives, foundCount, totalDiffs, elapsedMs, timeLimitMs } = useSpotDiffGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <SpotDiffHUD stage={stage} score={score} foundCount={foundCount} totalDiffs={totalDiffs} lives={lives} maxLives={maxLives} elapsedMs={elapsedMs} timeLimitMs={timeLimitMs} />
  const [gameResult, setGameResult] = useState<MysteryTownResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: MysteryTownResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: MysteryTownResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/mystery-town/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/mystery-town/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <MysteryTownClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <MysteryTownPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function MysteryTownPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: MysteryTownResult) => void; onGameOver: (r: MysteryTownResult) => void }) {
  const { containerRef, score, moves, clues, targetClues, doRestart } = useMysteryTownGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <MysteryTownHUD stage={stage} score={score} moves={moves} clues={clues} targetClues={targetClues} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<SpotItResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: SpotItResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: SpotItResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/spotit/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/spotit/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <SpotItClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <SpotItPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function SpotItPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: SpotItResult) => void; onGameOver: (r: SpotItResult) => void }) {
  const { containerRef, score, foundCount, targetCount, targetTypes, remainingMs, hintCount, doHint } = useSpotItGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <SpotItHUD stage={stage} score={score} foundCount={foundCount} targetCount={targetCount} remainingMs={remainingMs} targetTypes={targetTypes} />
      <GameCanvas ref={containerRef} />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 16px', backgroundColor: '#fff', borderTop: '1px solid #F3F4F6' }}>
        <button
          onClick={doHint}
          disabled={hintCount <= 0}
          style={{
            backgroundColor: hintCount > 0 ? '#FBBF24' : '#E5E7EB',
            color: hintCount > 0 ? '#fff' : '#9CA3AF',
            border: 'none',
            padding: '12px 32px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: hintCount > 0 ? 'pointer' : 'default',
          }}
        >
          💡 Hint ({hintCount})
        </button>
      </div>
  const [gameResult, setGameResult] = useState<HelloTownResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: HelloTownResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: HelloTownResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/hellotown/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/hellotown/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <HelloTownClear result={gameResult} stage={stage} totalStages={HELLOTOWN_TOTAL_STAGES} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <HelloTownPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function HelloTownPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: HelloTownResult) => void; onGameOver: (r: HelloTownResult) => void }) {
  const { containerRef, score, maxLevel, movesLeft, targetLevel } = useHelloTownGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <HelloTownHUD stage={stage} score={score} targetLevel={targetLevel} maxLevel={maxLevel} movesLeft={movesLeft} />
  const [gameResult, setGameResult] = useState<TangramResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: TangramResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/tangram/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/tangram/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <TangramClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <TangramPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function TangramPlaying({ stage, onClear }: { stage: number; onClear: (r: TangramResult) => void }) {
  const { containerRef, score, moves, doReset, doRestart } = useTangramGame({ stage, onClear });
  return (
    <PlayLayout>
      <TangramHUD stage={stage} score={score} moves={moves} onReset={doReset} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<PixelArtResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: PixelArtResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/pixelart/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/pixelart/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <PixelArtClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <PixelArtPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function PixelArtPlaying({ stage, onClear }: { stage: number; onClear: (r: PixelArtResult) => void }) {
  const { containerRef, score, progress, doRestart } = usePixelArtGame({ stage, onClear });
  return (
    <PlayLayout>
      <PixelArtHUD stage={stage} score={score} progress={progress} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<BlockyQuestResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: BlockyQuestResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: BlockyQuestResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/blockyquest/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/blockyquest/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <BlockyQuestClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <BlockyQuestPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function BlockyQuestPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: BlockyQuestResult) => void; onGameOver: (r: BlockyQuestResult) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useBlockyQuestGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <BlockyQuestHUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
  const [gameResult, setGameResult] = useState<ToonBlastResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: ToonBlastResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: ToonBlastResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/toonblast/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/toonblast/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ToonBlastClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <ToonBlastPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function ToonBlastPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: ToonBlastResult) => void; onGameOver: (r: ToonBlastResult) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useToonBlastGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout css={{ backgroundColor: '#1a1a2e' }}>
      <ToonBlastHUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
  const [gameResult, setGameResult] = useState<YarnFeverResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: YarnFeverResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/yarnfever/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/yarnfever/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <YarnFeverClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <YarnFeverPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function YarnFeverPlaying({ stage, onClear }: { stage: number; onClear: (r: YarnFeverResult) => void }) {
  const { containerRef, score, crossings, moves, doRestart } = useYarnFeverGame({ stage, onClear });
  return (
    <PlayLayout>
      <YarnFeverHUD stage={stage} crossings={crossings} moves={moves} score={score} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<ArrowsResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: ArrowsResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/arrows/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/arrows/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <ArrowsClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <ArrowsPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function ArrowsPlaying({ stage, onClear }: { stage: number; onClear: (r: ArrowsResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useArrowsGame({ stage, onClear });
  return (
    <PlayLayout>
      <ArrowsHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<BrainOutResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: BrainOutResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: BrainOutResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/brainout/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/brainout/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <BrainOutClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <BrainOutPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function BrainOutPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: BrainOutResult) => void; onGameOver: (r: BrainOutResult) => void }) {
  const { containerRef, score, hintsLeft, puzzleIndex, totalPuzzles, doHint } = useBrainOutGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <BrainOutHUD stage={stage} score={score} puzzleIndex={puzzleIndex} totalPuzzles={totalPuzzles} hintsLeft={hintsLeft} onHint={doHint} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

// ─── Root ──────────────────────────────────────────────
// ─── Nonogram (side-effect: registers routes) ───
import './games/nonogram/routes';
import { getRegisteredRoutes } from './router';

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

// ─── BusCraze ───
import { ClearScreen as BusCrazeClear } from './games/buscraze/ClearScreen';
import { HUD as BusCrazeHUD } from './games/buscraze/HUD';
import { useGame as useBusCrazeGame, type GameResult as BusCrazeResult } from './games/buscraze/useGame';
// ─── DreamStore ───
import { ClearScreen as DreamStoreClear } from './games/dreamstore/ClearScreen';
import { HUD as DreamStoreHUD } from './games/dreamstore/HUD';
import { useGame as useDreamStoreGame, type GameResult as DreamStoreResult } from './games/dreamstore/useGame';
// ─── DOP5 ───
import { ClearScreen as DOP5Clear } from './games/dop5/ClearScreen';
import { HUD as DOP5HUD } from './games/dop5/HUD';
import { useGame as useDOP5Game, type GameResult as DOP5Result } from './games/dop5/useGame';
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

// ─── Anipang3 ───
import { ClearScreen as Anipang3Clear } from './games/anipang3/ClearScreen';
import { HUD as Anipang3HUD } from './games/anipang3/HUD';
import { useGame as useAnipang3Game, type GameResult as Anipang3Result } from './games/anipang3/useGame';
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

// ─── BusCraze Routes ──────────────────────────────────

function BusCrazeTitleRoute() {
// ─── DOP5 Routes ──────────────────────────────────────

function DOP5TitleRoute() {
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
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Bus Craze</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Slide the bus out of traffic!</p>
      <button
        onClick={() => navigate('/games/buscraze/v1/stage/1')}
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>DOP 5</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Erase to find the answer!</p>
      <button
        onClick={() => navigate('/games/dop5/v1/stage/1')}
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

function BusCrazeStageRoute() {
function DOP5StageRoute() {
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
  const [gameResult, setGameResult] = useState<BusCrazeResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: BusCrazeResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/buscraze/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/buscraze/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <BusCrazeClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <BusCrazePlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function BusCrazePlaying({ stage, onClear }: { stage: number; onClear: (r: BusCrazeResult) => void }) {
  const { containerRef, score, moves, doUndo, doRestart } = useBusCrazeGame({ stage, onClear });
  return (
    <PlayLayout>
      <BusCrazeHUD stage={stage} score={score} moves={moves} onUndo={doUndo} onRestart={doRestart} />
  const [gameResult, setGameResult] = useState<DOP5Result | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: DOP5Result) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/dop5/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/dop5/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <DOP5Clear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <DOP5Playing key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} />;
}

function DOP5Playing({ stage, onClear }: { stage: number; onClear: (r: DOP5Result) => void }) {
  const { containerRef, score, erasePercent, doRestart } = useDOP5Game({ stage, onClear });
  return (
    <PlayLayout>
      <DOP5HUD stage={stage} score={score} erasePercent={erasePercent} onRestart={doRestart} />
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

// ─── DreamStore Routes ────────────────────────────────

function DreamStoreTitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#fff5f7' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#be185d', letterSpacing: -1 }}>Dream Store</h1>
      <p style={{ fontSize: 16, color: '#9d174d' }}>Serve customers & run your dream shop!</p>
      <button
        onClick={() => navigate('/games/dreamstore/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#db2777', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
      <p style={{ position: 'absolute', bottom: 24, fontSize: 12, color: '#f9a8d4' }}>Pixel food icons by Alex Kovacsart (CC BY 4.0)</p>
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

function DreamStoreStageRoute() {
function SaveDogeStageRoute() {
function TrickyTwistStageRoute() {
function WordPuzzleStageRoute() {
function MatchFactoryStageRoute() {
function TrickyPrankStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<DreamStoreResult | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: DreamStoreResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: DreamStoreResult) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/dreamstore/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/dreamstore/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <DreamStoreClear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <DreamStorePlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function DreamStorePlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: DreamStoreResult) => void; onGameOver: (r: DreamStoreResult) => void }) {
  const { containerRef, score, combo, timeLeft, customersServed, totalCustomers } = useDreamStoreGame({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <DreamStoreHUD stage={stage} score={score} timeLeft={timeLeft} customersServed={customersServed} totalCustomers={totalCustomers} combo={combo} />
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

// ─── Anipang3 Routes ──────────────────────────────────

function Anipang3TitleRoute() {
  const navigate = useNavigate();
  globalStyles();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Anipang 3</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Swipe & match cute animals!</p>
      <button
        onClick={() => navigate('/games/anipang3/v1/stage/1')}
        style={{ marginTop: 32, backgroundColor: '#F97316', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function Anipang3StageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = parseInt(stageId || '1', 10);
  const [playKey, setPlayKey] = useState(0);
  const [gameResult, setGameResult] = useState<Anipang3Result | null>(null);
  const [screen, setScreen] = useState<'playing' | 'clear'>('playing');

  const handleClear = useCallback((r: Anipang3Result) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleGameOver = useCallback((r: Anipang3Result) => {
    if (!isRN) { setGameResult(r); setScreen('clear'); }
  }, []);
  const handleNext = useCallback(() => {
    navigate(`/games/anipang3/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/anipang3/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return <Anipang3Clear result={gameResult} stage={stage} onNext={handleNext} onRetry={handleRetry} onHome={handleHome} />;
  }

  return <Anipang3Playing key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function Anipang3Playing({ stage, onClear, onGameOver }: { stage: number; onClear: (r: Anipang3Result) => void; onGameOver: (r: Anipang3Result) => void }) {
  const { containerRef, score, combo, movesLeft, targetScore } = useAnipang3Game({ stage, onClear, onGameOver });
  return (
    <PlayLayout>
      <Anipang3HUD stage={stage} score={score} targetScore={targetScore} movesLeft={movesLeft} combo={combo} />
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

      {/* StarryNight */}
      <Route path="/games/starrynight/v1" element={<StarryNightTitleRoute />} />
      <Route path="/games/starrynight/v1/play" element={<StarryNightPlayRoute />} />

      {/* WaterSort */}
      <Route path="/games/watersort/v1" element={<WaterSortTitleRoute />} />
      <Route path="/games/watersort/v1/stage/:stageId" element={<WaterSortStageRoute />} />

      {/* CandyPop */}
      <Route path="/games/candypop/v1" element={<CandyPopTitleRoute />} />
      <Route path="/games/candypop/v1/stage/:stageId" element={<CandyPopStageRoute />} />
      {/* LineDraw */}
      <Route path="/games/linedraw/v1" element={<LineDrawTitleRoute />} />
      <Route path="/games/linedraw/v1/stage/:stageId" element={<LineDrawStageRoute />} />
      {/* EscapeRoom */}
      <Route path="/games/escaperoom/v1" element={<EscapeRoomTitleRoute />} />
      <Route path="/games/escaperoom/v1/stage/:stageId" element={<EscapeRoomStageRoute />} />
      {/* CarJam */}
      <Route path="/games/carjam/v1" element={<CarJamTitleRoute />} />
      <Route path="/games/carjam/v1/stage/:stageId" element={<CarJamStageRoute />} />
      {/* BlockyQuest */}
      <Route path="/games/blockyquest/v1" element={<BlockyQuestTitleRoute />} />
      <Route path="/games/blockyquest/v1/stage/:stageId" element={<BlockyQuestStageRoute />} />
      {/* ColorSlide */}
      <Route path="/games/colorslide/v1" element={<ColorSlideTitleRoute />} />
      <Route path="/games/colorslide/v1/stage/:stageId" element={<ColorSlideStageRoute />} />
      {/* TrafficJam */}
      <Route path="/games/trafficjam/v1" element={<TrafficJamTitleRoute />} />
      <Route path="/games/trafficjam/v1/stage/:stageId" element={<TrafficJamStageRoute />} />
      {/* BusJam */}
      <Route path="/games/busjam/v1" element={<BusJamTitleRoute />} />
      <Route path="/games/busjam/v1/stage/:stageId" element={<BusJamStageRoute />} />
      {/* CarOut */}
      <Route path="/games/carout/v1" element={<CarOutTitleRoute />} />
      <Route path="/games/carout/v1/stage/:stageId" element={<CarOutStageRoute />} />
      {/* SkewerJam */}
      <Route path="/games/skewerjam/v1" element={<SkewerJamTitleRoute />} />
      <Route path="/games/skewerjam/v1/stage/:stageId" element={<SkewerJamStageRoute />} />
      {/* Anipang4 */}
      <Route path="/games/anipang4/v1" element={<Anipang4TitleRoute />} />
      <Route path="/games/anipang4/v1/stage/:stageId" element={<Anipang4StageRoute />} />
      {/* BusCraze */}
      <Route path="/games/buscraze/v1" element={<BusCrazeTitleRoute />} />
      <Route path="/games/buscraze/v1/stage/:stageId" element={<BusCrazeStageRoute />} />
      {/* DOP5 */}
      <Route path="/games/dop5/v1" element={<DOP5TitleRoute />} />
      <Route path="/games/dop5/v1/stage/:stageId" element={<DOP5StageRoute />} />
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

      {/* TidyMaster */}
      <Route path="/games/tidymaster/v1" element={<TidyMasterTitleRoute />} />
      <Route path="/games/tidymaster/v1/stage/:stageId" element={<TidyMasterStageRoute />} />
      {/* DefendKing */}
      <Route path="/games/defendking/v1" element={<DefendKingTitleRoute />} />
      <Route path="/games/defendking/v1/stage/:stageId" element={<DefendKingStageRoute />} />
      {/* SpotDiff */}
      <Route path="/games/spotdiff/v1" element={<SpotDiffTitleRoute />} />
      <Route path="/games/spotdiff/v1/stage/:stageId" element={<SpotDiffStageRoute />} />
      {/* SlidingMatch */}
      <Route path="/games/slidematch/v1" element={<SlideMatchTitleRoute />} />
      <Route path="/games/slidematch/v1/stage/:stageId" element={<SlideMatchStageRoute />} />
      {/* MysteryTown */}
      <Route path="/games/mystery-town/v1" element={<MysteryTownTitleRoute />} />
      <Route path="/games/mystery-town/v1/stage/:stageId" element={<MysteryTownStageRoute />} />
      {/* AllInHole */}
      <Route path="/games/allinhole/v1" element={<AllInHoleTitleRoute />} />
      <Route path="/games/allinhole/v1/stage/:stageId" element={<AllInHoleStageRoute />} />
      {/* SpotIt */}
      <Route path="/games/spotit/v1" element={<SpotItTitleRoute />} />
      <Route path="/games/spotit/v1/stage/:stageId" element={<SpotItStageRoute />} />
      {/* ForestPop */}
      <Route path="/games/forestpop/v1" element={<ForestPopTitleRoute />} />
      <Route path="/games/forestpop/v1/stage/:stageId" element={<ForestPopStageRoute />} />
      {/* Fishdom */}
      <Route path="/games/fishdom/v1" element={<FishdomTitleRoute />} />
      <Route path="/games/fishdom/v1/stage/:stageId" element={<FishdomStageRoute />} />
      {/* HelloTown */}
      <Route path="/games/hellotown/v1" element={<HelloTownTitleRoute />} />
      <Route path="/games/hellotown/v1/stage/:stageId" element={<HelloTownStageRoute />} />
      {/* Tangram */}
      <Route path="/games/tangram/v1" element={<TangramTitleRoute />} />
      <Route path="/games/tangram/v1/stage/:stageId" element={<TangramStageRoute />} />
      {/* PixelArt */}
      <Route path="/games/pixelart/v1" element={<PixelArtTitleRoute />} />
      <Route path="/games/pixelart/v1/stage/:stageId" element={<PixelArtStageRoute />} />
      {/* ToonBlast */}
      <Route path="/games/toonblast/v1" element={<ToonBlastTitleRoute />} />
      <Route path="/games/toonblast/v1/stage/:stageId" element={<ToonBlastStageRoute />} />
      {/* YarnFever */}
      <Route path="/games/yarnfever/v1" element={<YarnFeverTitleRoute />} />
      <Route path="/games/yarnfever/v1/stage/:stageId" element={<YarnFeverStageRoute />} />
      {/* Arrows */}
      <Route path="/games/arrows/v1" element={<ArrowsTitleRoute />} />
      <Route path="/games/arrows/v1/stage/:stageId" element={<ArrowsStageRoute />} />
      {/* BrainOut */}
      <Route path="/games/brainout/v1" element={<BrainOutTitleRoute />} />
      <Route path="/games/brainout/v1/stage/:stageId" element={<BrainOutStageRoute />} />
      {/* Anipang3 */}
      <Route path="/games/anipang3/v1" element={<Anipang3TitleRoute />} />
      <Route path="/games/anipang3/v1/stage/:stageId" element={<Anipang3StageRoute />} />
      {/* DreamStore */}
      <Route path="/games/dreamstore/v1" element={<DreamStoreTitleRoute />} />
      <Route path="/games/dreamstore/v1/stage/:stageId" element={<DreamStoreStageRoute />} />
      {/* Registered game routes (Nonogram, etc.) */}
      {getRegisteredRoutes().map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
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
