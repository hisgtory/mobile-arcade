import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, getStageConfig, type Order } from '@arcade/lib-matchfactory';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  movesUsed?: number;
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
  const [movesLeft, setMovesLeft] = useState(stageConfig.maxMoves);
  const [orders, setOrders] = useState<Order[]>(
    stageConfig.orders.map((o) => ({ ...o, collected: 0 })),
  );

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

    game.events.on('moves-update', (data: { movesLeft: number }) => {
      setMovesLeft(data.movesLeft);
    });

    game.events.on('orders-update', (data: { orders: Order[] }) => {
      setOrders(data.orders.map((o) => ({ ...o })));
    });

    game.events.on('stage-clear', (data: { score: number; movesUsed: number }) => {
      stageComplete({ stage, score: data.score, cleared: true });
      onClearRef.current?.({ score: data.score, movesUsed: data.movesUsed, cleared: true });
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
    movesLeft,
    orders,
  };
}
