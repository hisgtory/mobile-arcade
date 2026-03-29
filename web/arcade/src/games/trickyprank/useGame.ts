import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-trickyprank';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  attempts: number;
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
  const [attempts, setAttempts] = useState(0);
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('score-update', (data: { attempts: number; stage: number }) => {
      setAttempts(data.attempts);
    });

    game.events.on('stage-clear', (data: { score: number; attempts: number; stage: number }) => {
      const result = { score: data.score, attempts: data.attempts, stage: data.stage, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, cleared: true });
      onClear?.(result);
    });

    game.events.on('game-over', (data: { attempts: number; stage: number; reason: string }) => {
      const result = { score: 0, attempts: data.attempts, stage: data.stage, cleared: false };
      stageComplete({ stage: data.stage, score: 0, cleared: false });
      onGameOver?.(result);
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [stage, onClear, onGameOver]);

  const doHint = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.showHint();
  }, []);

  return { containerRef, attempts, doHint };
}
