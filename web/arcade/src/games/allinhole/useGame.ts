import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, getStageConfig } from '@arcade/lib-allinhole';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  movesUsed: number;
  cleared: boolean;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const stageConfig = getStageConfig(stage);
  const [movesLeft, setMovesLeft] = useState(stageConfig.maxMoves);
  const [remaining, setRemaining] = useState(stageConfig.ballCount);
  const [total] = useState(stageConfig.ballCount);

  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {
      stage,
      onClear: () => {},
      onGameOver: () => {},
    });
    gameRef.current = game;

    game.events.on('moves-update', (data: { movesLeft: number }) => {
      setMovesLeft(data.movesLeft);
    });

    game.events.on('balls-update', (data: { remaining: number; total: number }) => {
      setRemaining(data.remaining);
    });

    game.events.on('stage-clear', (data: { movesUsed: number }) => {
      stageComplete({ stage, score: data.movesUsed, cleared: true });
      onClearRef.current?.({ movesUsed: data.movesUsed, cleared: true });
    });

    game.events.on('game-over', (data: { movesUsed: number }) => {
      stageComplete({ stage, score: data.movesUsed, cleared: false });
      onGameOverRef.current?.({ movesUsed: data.movesUsed, cleared: false });
    });

    return () => {
      destroyGame(game);
      gameRef.current = null;
    };
  }, [stage]);

  return {
    containerRef,
    movesLeft,
    remaining,
    total,
  };
}
