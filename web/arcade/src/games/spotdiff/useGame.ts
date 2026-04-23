import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame } from '@arcade/lib-spotdiff';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  stage: number;
  cleared: boolean;
  elapsedMs: number;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onClearRef = useRef(onClear);
  const onGameOverRef = useRef(onGameOver);
  onClearRef.current = onClear;
  onGameOverRef.current = onGameOver;

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [maxLives, setMaxLives] = useState(3);
  const [foundCount, setFoundCount] = useState(0);
  const [totalDiffs, setTotalDiffs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timeLimitMs, setTimeLimitMs] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });

    game.events.on('state-update', (data: { score: number; lives: number; maxLives: number; foundCount: number; totalDiffs: number; elapsedMs: number; timeLimitMs: number }) => {
      setScore(data.score);
      setLives(data.lives);
      setMaxLives(data.maxLives);
      setFoundCount(data.foundCount);
      setTotalDiffs(data.totalDiffs);
      setElapsedMs(data.elapsedMs);
      setTimeLimitMs(data.timeLimitMs);
    });

    game.events.on('stage-clear', (data: { score: number; stage: number; elapsedMs: number }) => {
      const result = { score: data.score, stage: data.stage, cleared: true, elapsedMs: data.elapsedMs };
      stageComplete({ stage: data.stage, score: data.score, elapsedMs: data.elapsedMs, cleared: true });
      onClearRef.current?.(result);
    });

    game.events.on('game-over', (data: { score: number; stage: number; elapsedMs: number }) => {
      const result = { score: data.score, stage: data.stage, cleared: false, elapsedMs: data.elapsedMs };
      stageComplete({ stage: data.stage, score: data.score, elapsedMs: data.elapsedMs, cleared: false });
      onGameOverRef.current?.(result);
    });

    return () => {
      destroyGame(game);
    };
  }, [stage]);

  return { containerRef, score, lives, maxLives, foundCount, totalDiffs, elapsedMs, timeLimitMs };
}
