import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, type Difficulty } from '@arcade/lib-minesweeper';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  won: boolean;
  elapsed: number;
}

interface UseGameOptions {
  difficulty?: Difficulty;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ difficulty = 'easy', onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  const [minesRemaining, setMinesRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<string>('ready');

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { difficulty });

    game.events.on('state-update', (data: { minesRemaining: number; elapsed: number; phase: string }) => {
      setMinesRemaining(data.minesRemaining);
      setElapsed(data.elapsed);
      setPhase(data.phase);
    });

    game.events.on('game-over', (data: { won: boolean; elapsed: number }) => {
      stageComplete({ stage: 0, score: data.elapsed, cleared: data.won });
      onGameOverRef.current?.({ won: data.won, elapsed: data.elapsed });
    });

    return () => {
      destroyGame(game);
    };
  }, [difficulty]);

  return { containerRef, minesRemaining, elapsed, phase };
}
