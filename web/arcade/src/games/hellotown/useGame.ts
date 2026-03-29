import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, getStageConfig } from '@arcade/lib-hellotown';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  movesUsed?: number;
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
  const [score, setScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState(0);
  const [movesLeft, setMovesLeft] = useState(stageConfig.maxMoves);
  const [targetLevel] = useState(stageConfig.targetLevel);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {
      stage,
      onClear: () => {},
      onGameOver: () => {},
    });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number; combo: number; maxLevel: number }) => {
      setScore(data.score);
      setMaxLevel(data.maxLevel);
    });

    game.events.on('moves-update', (data: { movesLeft: number }) => {
      setMovesLeft(data.movesLeft);
    });

    game.events.on('stage-clear', (data: { score: number; movesUsed: number }) => {
      stageComplete({ stage, score: data.score, cleared: true });
      onClear?.({ score: data.score, movesUsed: data.movesUsed, cleared: true });
    });

    game.events.on('game-over', (data: { score: number }) => {
      stageComplete({ stage, score: data.score, cleared: false });
      onGameOver?.({ score: data.score, cleared: false });
    });

    return () => {
      destroyGame(game);
      gameRef.current = null;
    };
  }, [stage, onClear, onGameOver]);

  return {
    containerRef,
    score,
    maxLevel,
    movesLeft,
    targetLevel,
  };
}
