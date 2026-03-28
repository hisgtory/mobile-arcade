import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame } from '@arcade/lib-tileconnect';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  cleared: boolean;
  elapsedMs?: number;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number; combo: number }) => {
      setScore(data.score);
      setCombo(data.combo);
    });

    game.events.on('time-update', (data: { elapsedMs: number; timeLimit: number }) => {
      setElapsedMs(data.elapsedMs);
      setTimeLimit(data.timeLimit * 1000);
    });

    game.events.on('tiles-update', (data: { remaining: number; total: number }) => {
      setRemaining(data.remaining);
      setTotal(data.total);
    });

    game.events.on('stage-clear', (data: { score: number; elapsedMs: number }) => {
      stageComplete({ stage, score: data.score, elapsedMs: data.elapsedMs, cleared: true });
      onClear?.({ score: data.score, cleared: true, elapsedMs: data.elapsedMs });
    });

    game.events.on('game-over', (data: { score: number; elapsedMs: number }) => {
      stageComplete({ stage, score: data.score, elapsedMs: data.elapsedMs, cleared: false });
      onGameOver?.({ score: data.score, cleared: false, elapsedMs: data.elapsedMs });
    });

    return () => {
      if (gameRef.current) {
        destroyGame(gameRef.current);
        gameRef.current = null;
      }
    };
  }, []);

  const doShuffle = () => {
    const scene = gameRef.current?.scene?.getScene('PlayScene') as any;
    scene?.doShuffle?.();
  };

  const doHint = () => {
    const scene = gameRef.current?.scene?.getScene('PlayScene') as any;
    scene?.doHint?.();
  };

  return { containerRef, score, combo, elapsedMs, timeLimit, remaining, total, doShuffle, doHint };
}
