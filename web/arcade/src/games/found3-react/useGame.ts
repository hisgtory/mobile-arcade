import { useState, useCallback, useRef } from 'react';
import { stageComplete, haptic } from '../../utils/bridge';

export { haptic };

export interface GameResult {
  score: number;
  elapsedMs: number;
  cleared: boolean;
}

interface GameState {
  score: number;
  elapsedMs: number;
  remainingTiles: number;
  totalTiles: number;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    elapsedMs: 0,
    remainingTiles: 0,
    totalTiles: 0,
  });

  const handleStateUpdate = useCallback((state: GameState) => {
    setGameState({
      score: state.score ?? 0,
      elapsedMs: state.elapsedMs ?? 0,
      remainingTiles: state.remainingTiles ?? 0,
      totalTiles: state.totalTiles ?? 0,
    });
  }, []);

  const handleClear = useCallback((result: { score: number; elapsedMs: number }) => {
    haptic('game-clear');
    stageComplete({ stage, score: result.score, elapsedMs: result.elapsedMs, cleared: true });
    onClearRef.current?.({ ...result, cleared: true });
  }, [stage]);

  const handleGameOver = useCallback((result: { score: number; elapsedMs: number }) => {
    stageComplete({ stage, score: result.score, elapsedMs: result.elapsedMs, cleared: false });
    onGameOverRef.current?.({ ...result, cleared: false });
  }, [stage]);

  return {
    gameState,
    onStateUpdate: handleStateUpdate,
    onClear: handleClear,
    onGameOver: handleGameOver,
  };
}
