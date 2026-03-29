import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, getStageConfig } from '@arcade/lib-blockyquest';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  cleared: boolean;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  const stageConfig = getStageConfig(stage);
  const [score, setScore] = useState(0);
  const [pieceSetsLeft, setPieceSetsLeft] = useState(stageConfig.pieceSets);
  const [targetScore] = useState(stageConfig.targetScore);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {
      stage,
      onClear: () => {},
      onGameOver: () => {},
    });

    game.events.on('score-update', (data: { score: number }) => {
      setScore(data.score);
    });

    game.events.on('pieces-update', (data: { pieceSetsLeft: number }) => {
      setPieceSetsLeft(data.pieceSetsLeft);
    });

    game.events.on('stage-clear', (data: { score: number }) => {
      stageComplete({ stage, score: data.score, cleared: true });
      onClear?.({ score: data.score, cleared: true });
    });

    game.events.on('game-over', (data: { score: number }) => {
      stageComplete({ stage, score: data.score, cleared: false });
      onGameOver?.({ score: data.score, cleared: false });
    });

    return () => {
      destroyGame(game);
    };
  }, [stage, onClear, onGameOver]);

  return {
    containerRef,
    score,
    pieceSetsLeft,
    targetScore,
  };
}
