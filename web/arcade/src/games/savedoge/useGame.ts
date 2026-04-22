import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-savedoge';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  stage: number;
  inkUsed: number;
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
  const [ink, setInk] = useState(600);
  const [maxInk, setMaxInk] = useState(600);

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);

  // Stable refs for callbacks to avoid game re-creation
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number }) => {
      setScore(data.score);
    });

    game.events.on('ink-update', (data: { ink: number; maxInk: number }) => {
      setInk(Math.round(data.ink));
      setMaxInk(Math.round(data.maxInk));
    });

    game.events.on(
      'stage-clear',
      (data: { score: number; stage: number; inkUsed: number }) => {
        const result: GameResult = { ...data, cleared: true };
        stageComplete({
          stage: data.stage,
          score: data.score,
          cleared: true,
        });
        onClearRef.current?.(result);
      },
    );

    game.events.on(
      'game-over',
      (data: { score: number; stage: number; inkUsed: number }) => {
        const result: GameResult = { ...data, cleared: false };
        stageComplete({
          stage: data.stage,
          score: data.score,
          cleared: false,
        });
        onGameOverRef.current?.(result);
      },
    );

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

  return { containerRef, score, ink, maxInk, doUndo, doRestart };
}
