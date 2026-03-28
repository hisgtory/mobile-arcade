import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getStageConfig } from '@arcade/lib-slidematch';
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
  const onClearRef = useRef(onClear);
  const onGameOverRef = useRef(onGameOver);
  onClearRef.current = onClear;
  onGameOverRef.current = onGameOver;

  const stageConfig = getStageConfig(stage);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [movesLeft, setMovesLeft] = useState(stageConfig.maxMoves);
  const [targetScore] = useState(stageConfig.targetScore);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number; combo: number }) => {
      setScore(data.score);
      setCombo(data.combo);
    });

    game.events.on('moves-update', (data: { movesLeft: number }) => {
      setMovesLeft(data.movesLeft);
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
    targetScore,
  };
}
