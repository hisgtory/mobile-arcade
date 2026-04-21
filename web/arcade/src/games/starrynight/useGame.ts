import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame } from '@arcade/lib-starrynight';
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
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

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
      onGameOverRef.current?.({ score: data.score, cleared: false });
    });

    return () => {
      destroyGame(game);
    };
  }, []);

  return { containerRef, score };
}
