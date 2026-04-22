import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, getStageConfig } from '@arcade/lib-dreamstore';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  timeLeft?: number;
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
  const [customersServed, setCustomersServed] = useState(0);
  const [totalCustomers] = useState(stageConfig.customerCount);

  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

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

    game.events.on('customer-update', (data: { served: number; total: number }) => {
      setCustomersServed(data.served);
    });

    game.events.on('stage-clear', (data: { score: number; timeLeft: number }) => {
      stageComplete({ stage, score: data.score, cleared: true });
      onClearRef.current?.({ score: data.score, timeLeft: data.timeLeft, cleared: true });
    });

    game.events.on('game-over', (data: { score: number }) => {
      stageComplete({ stage, score: data.score, cleared: false });
      onGameOverRef.current?.({ score: data.score, cleared: false });
    });

    return () => {
      destroyGame(game);
      gameRef.current = null;
    };
  }, [stage]);

  return {
    containerRef,
    score,
    combo,
    timeLeft,
    customersServed,
    totalCustomers,
  };
}
