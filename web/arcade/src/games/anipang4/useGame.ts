import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, getStageConfig } from '@arcade/lib-anipang4';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  timeUsed?: number;
  cleared: boolean;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const stageConfig = getStageConfig(stage);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(stageConfig.timeLimit);
  const [targetScore] = useState(stageConfig.targetScore);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {
      stage,
      onClear: () => {},
      onGameOver: () => {},
    });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number; combo: number }) => {
      setScore(data.score);
      setCombo(data.combo);
    });

    game.events.on('time-update', (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
    });

    game.events.on('stage-clear', (data: { score: number; timeUsed: number }) => {
      stageComplete({ stage, score: data.score, cleared: true });
      onClear?.({ score: data.score, timeUsed: data.timeUsed, cleared: true });
    });

    game.events.on('game-over', (data: { score: number }) => {
      stageComplete({ stage, score: data.score, cleared: false });
      onGameOver?.({ score: data.score, cleared: false });
    });

    return () => {
      destroyGame(game);
      gameRef.current = null;
    };
  }, [stage, onClear, onGameOver]);

  return {
    containerRef,
    score,
    combo,
    timeLeft,
    targetScore,
  };
}
