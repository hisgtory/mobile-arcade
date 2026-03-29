import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-tangram';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  moves: number;
  stage: number;
  cleared: boolean;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
}

export function useGame({ stage, onClear }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);

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

    game.events.on('stage-clear', (data: { score: number; moves: number; stage: number }) => {
      const result = { score: data.score, moves: data.moves, stage: data.stage, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, moves: data.moves, cleared: true });
      onClear?.(result);
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [stage, onClear]);

  const doReset = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.resetPieces();
  }, []);

  const doRestart = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.restart();
  }, []);

  return { containerRef, score, moves, doReset, doRestart };
}
