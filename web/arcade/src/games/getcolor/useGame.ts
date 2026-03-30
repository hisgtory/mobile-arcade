import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-getcolor';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  moves: number;
  stage: number;
  cleared: boolean;
  timeBonus?: number;
  secondsLeft?: number;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onTimeout?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onTimeout }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timerSec, setTimerSec] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);

  // Stable refs for callbacks — avoids game re-creation on parent re-render
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {
      stage,
    });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number }) => {
      setScore(data.score);
    });

    game.events.on('moves-update', (data: { moves: number }) => {
      setMoves(data.moves);
    });

    game.events.on('timer-update', (data: { remaining: number; total: number }) => {
      setTimerSec(data.remaining);
      setTimerTotal(data.total);
    });

    game.events.on('stage-clear', (data: { score: number; moves: number; stage: number; timeBonus: number; secondsLeft: number }) => {
      const result: GameResult = {
        score: data.score, moves: data.moves, stage: data.stage, cleared: true,
        timeBonus: data.timeBonus, secondsLeft: data.secondsLeft,
      };
      stageComplete({ stage: data.stage, score: data.score, moves: data.moves, cleared: true });
      onClearRef.current?.(result);
    });

    game.events.on('stage-timeout', (data: { score: number; moves: number; stage: number }) => {
      const result: GameResult = { score: data.score, moves: data.moves, stage: data.stage, cleared: false };
      onTimeoutRef.current?.(result);
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [stage]);

  const doUndo = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.undo();
  }, []);

  const doRestart = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.restart();
  }, []);

  return { containerRef, score, moves, timerSec, timerTotal, doUndo, doRestart };
}
