import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame } from '@arcade/lib-blockpuzzle';
import { stageComplete, haptic } from '../../utils/bridge';

export interface GameResult {
  score: number;
}

interface UseGameOptions {
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {});

    game.events.on('piece-placed', () => haptic('piece-placed'));
    game.events.on('line-cleared', () => haptic('line-cleared'));
    game.events.on('combo-cleared', () => haptic('combo-cleared'));
    game.events.on('game-over', () => haptic('game-over'));

    game.events.on('state-update', (data: { score: number; bestScore: number }) => {
      setScore(data.score);
      setBestScore(data.bestScore);
    });

    game.events.on('game-over', (data: { score: number }) => {
      stageComplete({ stage: 0, score: data.score, cleared: false });
      onGameOverRef.current?.({ score: data.score });
    });

    return () => {
      destroyGame(game);
    };
  }, []);

  return { containerRef, score, bestScore };
}
