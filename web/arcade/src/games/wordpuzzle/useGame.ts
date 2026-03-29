import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-wordpuzzle';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  foundWords: number;
  totalWords: number;
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
  const [foundWords, setFoundWords] = useState(0);
  const [totalWords, setTotalWords] = useState(0);

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

    game.events.on('words-update', (data: { found: number; total: number }) => {
      setFoundWords(data.found);
      setTotalWords(data.total);
    });

    game.events.on('stage-clear', (data: { score: number; foundWords: number; totalWords: number; stage: number }) => {
      const result = { score: data.score, foundWords: data.foundWords, totalWords: data.totalWords, stage: data.stage, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, cleared: true });
      onClear?.(result);
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [stage, onClear]);

  const doHint = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.useHint();
  }, []);

  const doRestart = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.restart();
  }, []);

  return { containerRef, score, foundWords, totalWords, doHint, doRestart };
}
