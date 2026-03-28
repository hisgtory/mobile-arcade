import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, getPlayScene } from '@arcade/lib-sudoku';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  mistakes: number;
  elapsedMs: number;
  stage: number;
  cleared: boolean;
}

export interface GameState {
  mistakes: number;
  maxMistakes: number;
  elapsedMs: number;
  notesMode: boolean;
  selectedRow: number;
  selectedCol: number;
  numberCounts: Record<number, number>;
  difficulty: string;
}

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ stage, onClear, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    mistakes: 0,
    maxMistakes: 3,
    elapsedMs: 0,
    notesMode: false,
    selectedRow: -1,
    selectedCol: -1,
    numberCounts: {},
    difficulty: 'easy',
  });

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);
  const onClearRef = useRef(onClear);
  const onGameOverRef = useRef(onGameOver);
  onClearRef.current = onClear;
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { stage });
    gameRef.current = game;

    game.events.on('state-update', (data: GameState) => {
      setGameState({ ...data });
    });

    game.events.on('stage-clear', (data: { score: number; mistakes: number; elapsedMs: number; stage: number }) => {
      const result: GameResult = { ...data, cleared: true };
      stageComplete({ stage: data.stage, score: data.score, elapsedMs: data.elapsedMs, cleared: true });
      onClearRef.current?.(result);
    });

    game.events.on('game-over', (data: { score: number; mistakes: number; elapsedMs: number; stage: number }) => {
      const result: GameResult = { ...data, cleared: false };
      stageComplete({ stage: data.stage, score: data.score, elapsedMs: data.elapsedMs, cleared: false });
      onGameOverRef.current?.(result);
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [stage]);

  const inputNumber = useCallback((num: number) => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.inputNumber(num);
  }, []);

  const doErase = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.erase();
  }, []);

  const toggleNotes = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    const newMode = !gameState.notesMode;
    scene?.setNotesMode(newMode);
  }, [gameState.notesMode]);

  const doHint = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.useHint();
  }, []);

  const doRestart = useCallback(() => {
    if (!gameRef.current) return;
    const scene = getPlayScene(gameRef.current);
    scene?.restart();
  }, []);

  return {
    containerRef,
    gameState,
    inputNumber,
    doErase,
    toggleNotes,
    doHint,
    doRestart,
  };
}
