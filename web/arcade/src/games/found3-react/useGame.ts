import { useState, useCallback, useRef, useEffect } from 'react';
import { stageComplete, haptic } from '../../utils/bridge';

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
}

export function useGame({ stage, onClear }: UseGameOptions) {
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    elapsedMs: 0,
    remainingTiles: 0,
    totalTiles: 0,
  });

  const handleTileSelect = useCallback(() => {
    haptic('tile-selected');
  }, []);

  const handleMatch = useCallback(() => {
    haptic('match-found');
  }, []);

  const handleStateUpdate = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleClear = useCallback((result: { score: number; elapsedMs: number }) => {
    haptic('game-clear');
    stageComplete({ stage, score: result.score, cleared: true });
    onClearRef.current?.({ ...result, cleared: true });
  }, [stage]);

  return {
    gameState,
    onTileSelect: handleTileSelect,
    onMatch: handleMatch,
    onStateUpdate: handleStateUpdate,
    onClear: handleClear,
  };
}
