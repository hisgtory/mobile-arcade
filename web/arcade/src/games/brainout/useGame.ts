import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, getPlayScene, getStageConfig } from '@arcade/lib-brainout';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  puzzlesSolved?: number;
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
  const [hintsLeft, setHintsLeft] = useState(stageConfig.hints);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [totalPuzzles, setTotalPuzzles] = useState(5);
  const [currentHint, setCurrentHint] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {
      stage,
      onClear: () => {},
      onGameOver: () => {},
    });
    gameRef.current = game;

    game.events.on('score-update', (data: { score: number; hintsLeft: number }) => {
      setScore(data.score);
      setHintsLeft(data.hintsLeft);
    });

    game.events.on('puzzle-update', (data: { puzzleIndex: number; totalPuzzles: number; hint: string }) => {
      setPuzzleIndex(data.puzzleIndex);
      setTotalPuzzles(data.totalPuzzles);
      setCurrentHint(data.hint);
    });

    game.events.on('stage-clear', (data: { score: number; puzzlesSolved: number }) => {
      stageComplete({ stage, score: data.score, cleared: true });
      onClear?.({ score: data.score, puzzlesSolved: data.puzzlesSolved, cleared: true });
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

  const doHint = () => {
    const scene = gameRef.current ? getPlayScene(gameRef.current) : null;
    if (scene) scene.useHint();
  };

  return {
    containerRef,
    score,
    hintsLeft,
    puzzleIndex,
    totalPuzzles,
    currentHint,
    doHint,
  };
}
