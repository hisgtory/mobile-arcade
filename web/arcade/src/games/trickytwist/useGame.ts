import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-trickytwist';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  correct: number;
  total: number;
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
  const [streak, setStreak] = useState(0);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number; streak: number }) => {
      setScore(data.score);
      setStreak(data.streak);
    });

    game.events.on('progress-update', (data: { current: number; total: number; correct: number; timeRemaining: number }) => {
      setCurrent(data.current);
      setTotal(data.total);
      setCorrectCount(data.correct);
      setTimeRemaining(data.timeRemaining);
    });

    game.events.on('stage-clear', (data: { score: number; correct: number; total: number; stage: number }) => {
      const result = { score: data.score, correct: data.correct, total: data.total, stage: data.stage, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, cleared: true });
      onClear?.(result);
    });

    game.events.on('game-over', (data: { score: number; correct: number; total: number; stage: number }) => {
      const result = { score: data.score, correct: data.correct, total: data.total, stage: data.stage, cleared: false };
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

  return { containerRef, score, streak, current, total, correctCount, timeRemaining, doRestart };
}
