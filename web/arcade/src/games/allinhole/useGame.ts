import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-allinhole';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  swallowed: number;
  totalObjects: number;
  stage: number;
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
  const [swallowed, setSwallowed] = useState(0);
  const [totalObjects, setTotalObjects] = useState(0);
  const [timeRemainingSec, setTimeRemainingSec] = useState(0);

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number; swallowed: number; totalObjects: number }) => {
      setScore(data.score);
      setSwallowed(data.swallowed);
      setTotalObjects(data.totalObjects);
    });

    game.events.on('time-update', (data: { timeRemainingSec: number }) => {
      setTimeRemainingSec(data.timeRemainingSec);
    });

    game.events.on('stage-clear', (data: { score: number; swallowed: number; totalObjects: number; stage: number }) => {
      const result: GameResult = { ...data, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, cleared: true });
      onClear?.(result);
    });

    game.events.on('game-over', (data: { score: number; swallowed: number; totalObjects: number; stage: number }) => {
      const result: GameResult = { ...data, cleared: false };
      stageComplete({ stage: data.stage, score: data.score, cleared: false });
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

  return { containerRef, score, swallowed, totalObjects, timeRemainingSec, doRestart };
}
