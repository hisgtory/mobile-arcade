import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-mystery-town';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  moves: number;
  stage: number;
  clues: number;
  cleared: boolean;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [clues, setClues] = useState(0);
  const [targetClues, setTargetClues] = useState(1);
  const [emptySlots, setEmptySlots] = useState(0);
  const [totalSlots, setTotalSlots] = useState(0);

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number }) => {
      setScore(data.score);
    });

    game.events.on('moves-update', (data: { moves: number }) => {
      setMoves(data.moves);
    });

    game.events.on('clues-update', (data: { clues: number; target: number }) => {
      setClues(data.clues);
      setTargetClues(data.target);
    });

    game.events.on('empty-update', (data: { empty: number; total: number }) => {
      setEmptySlots(data.empty);
      setTotalSlots(data.total);
    });

    game.events.on('stage-clear', (data: { score: number; moves: number; stage: number; clues: number }) => {
      const result = { score: data.score, moves: data.moves, stage: data.stage, clues: data.clues, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, moves: data.moves, cleared: true });
      onClear?.(result);
    });

    game.events.on('game-over', (data: { score: number; moves: number; stage: number; clues: number }) => {
      const result = { score: data.score, moves: data.moves, stage: data.stage, clues: data.clues, cleared: false };
      stageComplete({ stage: data.stage, score: data.score, moves: data.moves, cleared: false });
      onGameOver?.(result);
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [stage, onClear, onGameOver]);

  const doRestart = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.restart();
  }, []);

  return { containerRef, score, moves, clues, targetClues, emptySlots, totalSlots, doRestart };
}
