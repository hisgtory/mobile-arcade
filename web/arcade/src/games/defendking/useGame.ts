import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame } from '@arcade/lib-defendking';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  cleared: boolean;
  stage: number;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [ammoLeft, setAmmoLeft] = useState(0);
  const [enemiesLeft, setEnemiesLeft] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(
      containerRef.current,
      { onClear: () => {}, onGameOver: () => {} },
      { stage },
    );

    game.events.on('score-update', (data: { score: number; ammoLeft: number; enemiesLeft: number }) => {
      setScore(data.score);
      setAmmoLeft(data.ammoLeft);
      setEnemiesLeft(data.enemiesLeft);
    });

    game.events.on('stage-clear', (data: { score: number; stage: number }) => {
      stageComplete({ stage: data.stage, score: data.score, cleared: true });
      onClear?.({ score: data.score, cleared: true, stage: data.stage });
    });

    game.events.on('game-over', (data: { score: number; stage: number }) => {
      stageComplete({ stage: data.stage, score: data.score, cleared: false });
      onGameOver?.({ score: data.score, cleared: false, stage: data.stage });
    });

    return () => {
      destroyGame(game);
    };
  }, [stage, onClear, onGameOver]);

  return { containerRef, score, ammoLeft, enemiesLeft };
}
