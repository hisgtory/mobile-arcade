import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-allinhole';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  absorbed: number;
  total: number;
  stage: number;
  elapsedMs: number;
  cleared: boolean;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [absorbed, setAbsorbed] = useState(0);
  const [total, setTotal] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('state-update', (data: {
      score: number;
      absorbed: number;
      total: number;
      elapsedMs: number;
      timeLimit: number;
    }) => {
      setScore(data.score);
      setAbsorbed(data.absorbed);
      setTotal(data.total);
      setElapsedMs(data.elapsedMs);
      setTimeLimit(data.timeLimit);
    });

    game.events.on('stage-clear', (data: {
      score: number;
      absorbed: number;
      total: number;
      stage: number;
      elapsedMs: number;
    }) => {
      const result = { ...data, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, elapsedMs: data.elapsedMs, cleared: true });
      onClear?.(result);
    });

    game.events.on('game-over', (data: {
      score: number;
      absorbed: number;
      total: number;
      stage: number;
      elapsedMs: number;
    }) => {
      const result = { ...data, cleared: false };
      stageComplete({ stage: data.stage, score: data.score, elapsedMs: data.elapsedMs, cleared: false });
      onGameOver?.(result);
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [stage, onClear, onGameOver]);

  const doRestart = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.restart();
  }, []);

  return { containerRef, score, absorbed, total, elapsedMs, timeLimit, doRestart };
}
