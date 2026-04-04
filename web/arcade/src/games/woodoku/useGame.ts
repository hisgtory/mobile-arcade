import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame } from '@arcade/lib-woodoku';
import { stageComplete, haptic } from '../../utils/bridge';

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
  const [combo, setCombo] = useState(0);

  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current);

    game.events.on('state-update', (data: { score: number; combo: number }) => {
      setScore(data.score);
      setCombo(data.combo);
    });

    game.events.on('piece-placed', () => haptic('light'));
    game.events.on('line-cleared', () => haptic('medium'));
    game.events.on('combo-cleared', () => haptic('heavy'));

    game.events.on('game-over', (data: { score: number }) => {
      stageComplete({ stage: 0, score: data.score, cleared: false });
      onGameOverRef.current?.({ score: data.score, cleared: false });
    });

    return () => {
      destroyGame(game);
    };
  }, []);

  return { containerRef, score, combo };
}
