import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame } from '@arcade/lib-blockrush';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  cleared: boolean;
}

interface UseGameOptions {
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {
      onGameOver: () => {},
    });

    game.events.on('score-update', (data: { score: number }) => {
      setScore(data.score);
    });

    game.events.on('game-over', (data: { score: number }) => {
      stageComplete({ stage: 0, score: data.score, cleared: false });
      onGameOver?.({ score: data.score, cleared: false });
    });

    return () => {
      destroyGame(game);
    };
  }, [onGameOver]);

  return { containerRef, score };
}
