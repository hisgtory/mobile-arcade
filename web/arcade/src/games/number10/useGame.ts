import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame } from '@arcade/lib-number10';
import { stageComplete } from '../../utils/bridge';

export function useGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(170);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current);

    game.events.on('score-update', (data: { score: number; remaining: number }) => {
      setScore(data.score);
      setRemaining(data.remaining);
    });

    game.events.on('game-over', (data: { score: number; total: number; perfect: boolean }) => {
      stageComplete({ stage: 0, score: data.score, cleared: data.perfect });
    });

    return () => {
      destroyGame(game);
    };
  }, []);

  return { containerRef, score, remaining };
}
