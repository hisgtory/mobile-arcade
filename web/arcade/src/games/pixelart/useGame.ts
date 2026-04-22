import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame } from '@arcade/lib-pixelart';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  stage: number;
  progress: number;
  cleared: boolean;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
}

export function useGame({ stage, onClear }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);

  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number }) => {
      setScore(data.score);
    });

    game.events.on('progress-update', (data: { progress: number }) => {
      setProgress(data.progress);
    });

    game.events.on('stage-clear', (data: { score: number; stage: number; progress: number }) => {
      const result = { score: data.score, stage: data.stage, progress: data.progress, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, cleared: true });
      onClearRef.current?.(result);
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [stage]);

  const doRestart = useCallback(() => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene('PlayScene') as unknown as
      | { restart: () => void }
      | null;
    scene?.restart();
  }, []);

  return { containerRef, score, progress, doRestart };
}
