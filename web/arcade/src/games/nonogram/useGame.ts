import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-nonogram';
import { stageComplete, haptic } from '../../utils/bridge';

export interface GameResult {
  score: number;
  moves: number;
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
  const [moves, setMoves] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState(0);

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {
      stage,
    });
    gameRef.current = game;

    // Unified state update
    game.events.on('state-update', (data: { moves: number; progress: number; errors: number; phase: string }) => {
      setMoves(data.moves);
      setProgress(data.progress);
      setErrors(data.errors);
    });

    // Haptic events
    game.events.on('cell-tapped', () => haptic('cell-tapped'));
    game.events.on('mistake-made', () => haptic('mistake-made'));
    game.events.on('puzzle-clear', () => haptic('puzzle-clear'));

    game.events.on('stage-clear', (data: { score: number; moves: number; stage: number; elapsedMs: number }) => {
      const result: GameResult = { score: data.score, moves: data.moves, stage: data.stage, elapsedMs: data.elapsedMs, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, moves: data.moves, elapsedMs: data.elapsedMs, cleared: true });
      onClearRef.current?.(result);
    });

    game.events.on('game-over', (data: { score: number; moves: number; stage: number; elapsedMs: number }) => {
      const result: GameResult = { score: data.score, moves: data.moves, stage: data.stage, elapsedMs: data.elapsedMs, cleared: false };
      stageComplete({ stage: data.stage, score: data.score, moves: data.moves, elapsedMs: data.elapsedMs, cleared: false });
      onGameOverRef.current?.(result);
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [stage]);

  const doRestart = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.restart();
  }, []);

  return { containerRef, moves, progress, errors, doRestart };
}
