import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameBoard, type GameBoardHandle } from '@arcade/lib-found3-react';
import { GameHomeLayout } from '../../components/GameHomeLayout';
import { StageMap, type StageInfo } from '../../components/StageMap';
import { PlayLayout, isRN } from '../../components/PlayLayout';
import { styled } from '../../styles/stitches.config';
import { registerRoutes } from '../../router';
import { HUD } from './HUD';
import { useGame, haptic, type GameResult } from './useGame';

const STAGES: StageInfo[] = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, cleared: false }));

/* ---------- ItemBar ---------- */

const ItemBarRoot = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 20,
  padding: '8px 16px',
  paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
  backgroundColor: '$surface',
  borderTop: '1px solid $gray200',
});

const ItemButton = styled('button', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  width: 64,
  height: 64,
  padding: 0,
  backgroundColor: '$white',
  border: 'none',
  borderRadius: 14,
  cursor: 'pointer',
  fontFamily: '$body',
  color: '$gray500',
  boxShadow: '0 2px 0 0 #D1D5DB, 0 3px 6px rgba(0,0,0,0.08)',
  transition: 'transform 0.08s, box-shadow 0.08s',
  '&:active': {
    transform: 'translateY(2px)',
    boxShadow: '0 0px 0 0 #D1D5DB, 0 1px 2px rgba(0,0,0,0.06)',
  },
});

const ItemLabel = styled('span', {
  fontSize: 10,
  fontWeight: 600,
  color: '$gray500',
  lineHeight: 1,
});

function ItemBar({ onShuffle, onUndo, onHint }: { onShuffle: () => void; onUndo: () => void; onHint: () => void }) {
  return (
    <ItemBarRoot>
      <ItemButton onClick={onShuffle}>
        <span style={{ fontSize: 20 }}>🔀</span>
        <ItemLabel>Shuffle</ItemLabel>
      </ItemButton>
      <ItemButton onClick={onUndo}>
        <span style={{ fontSize: 20 }}>↩️</span>
        <ItemLabel>Undo</ItemLabel>
      </ItemButton>
      <ItemButton onClick={onHint}>
        <span style={{ fontSize: 20 }}>💡</span>
        <ItemLabel>Hint</ItemLabel>
      </ItemButton>
    </ItemBarRoot>
  );
}

/* ---------- Routes ---------- */

function Found3ReactHomeRoute() {
  const navigate = useNavigate();
  return (
    <GameHomeLayout title="Found 3" icon="🔍">
      <StageMap
        stages={STAGES}
        currentStage={1}
        onStageSelect={(stage) => navigate(`/games/found3-react/v1/stage/${stage}`)}
      />
    </GameHomeLayout>
  );
}

function Found3ReactStageRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const parsed = parseInt(stageId || '1', 10);
  const stage = Number.isNaN(parsed) ? 1 : parsed;
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
    navigate(`/games/found3-react/v1/stage/${stage + 1}`, { replace: true });
    setPlayKey((k) => k + 1); setScreen('playing');
  }, [navigate, stage]);
  const handleRetry = useCallback(() => { setPlayKey((k) => k + 1); setScreen('playing'); }, []);
  const handleHome = useCallback(() => navigate('/games/found3-react/v1', { replace: true }), [navigate]);

  if (screen === 'clear' && gameResult) {
    return (
      <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 24, padding: 20 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: gameResult.cleared ? '#059669' : '#DC2626' }}>
          {gameResult.cleared ? 'Stage Clear!' : 'Game Over'}
        </h1>
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxWidth: 320, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 14, color: '#6B7280' }}>Score</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{gameResult.score.toLocaleString()}</p>
        </div>
        {gameResult.cleared && (
          <button
            onClick={handleNext}
            style={{ backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', width: '85%', maxWidth: 320 }}
          >
            Next Stage
          </button>
        )}
        <button
          onClick={handleRetry}
          style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #D1D5DB', padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '85%', maxWidth: 320 }}
        >
          Retry
        </button>
        <button
          onClick={handleHome}
          style={{ backgroundColor: 'transparent', color: '#6B7280', border: 'none', padding: '8px', fontSize: 14, cursor: 'pointer' }}
        >
          Home
        </button>
      </PlayLayout>
    );
  }

  return <Found3ReactPlaying key={`${stage}-${playKey}`} stage={stage} onClear={handleClear} onGameOver={handleGameOver} />;
}

function Found3ReactPlaying({ stage, onClear, onGameOver }: { stage: number; onClear: (r: GameResult) => void; onGameOver: (r: GameResult) => void }) {
  const boardRef = useRef<GameBoardHandle>(null);
  const {
    gameState, onStateUpdate,
    onClear: handleClear, onGameOver: handleGameOver,
  } = useGame({ stage, onClear, onGameOver });

  return (
    <PlayLayout>
      <HUD
        stage={stage}
        elapsedMs={gameState.elapsedMs}
        remainingTiles={gameState.remainingTiles}
        totalTiles={gameState.totalTiles}
        score={gameState.score}
      />
      <GameBoard
        ref={boardRef}
        stage={stage}
        haptic={haptic}
        onStateUpdate={onStateUpdate}
        onClear={handleClear}
        onGameOver={handleGameOver}
      />
      <ItemBar
        onShuffle={() => boardRef.current?.doShuffle()}
        onUndo={() => boardRef.current?.doUndo()}
        onHint={() => boardRef.current?.doMagnet()}
      />
    </PlayLayout>
  );
}

registerRoutes('/games/found3-react/v1', [
  { path: '', element: <Found3ReactHomeRoute /> },
  { path: 'stage/:stageId', element: <Found3ReactStageRoute /> },
]);
