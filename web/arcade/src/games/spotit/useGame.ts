import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, getPlayScene, getStageConfig, type ItemType } from '@arcade/lib-spotit';
import { stageComplete } from '../../utils/bridge';

export interface GameResult {
  score: number;
  elapsedMs?: number;
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
  const [foundTypes, setFoundTypes] = useState<Set<number>>(new Set());
  const [targetCount] = useState(stageConfig.targetCount);
  const [targetTypes, setTargetTypes] = useState<ItemType[]>([]);
  const [remainingMs, setRemainingMs] = useState(stageConfig.timeLimit * 1000);
  const [hintCount, setHintCount] = useState(3);

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

    game.events.on('item-found', (data: { foundCount: number; targetCount: number; score: number; foundTypes: number[] }) => {
      setScore(data.score);
      setFoundTypes(new Set(data.foundTypes));
    });

    game.events.on('wrong-tap', (data: { score: number }) => {
      setScore(data.score);
    });

    game.events.on('time-update', (data: { remainingMs: number }) => {
      setRemainingMs(data.remainingMs);
    });

    game.events.on('target-types', (data: { targetTypes: ItemType[] }) => {
      setTargetTypes(data.targetTypes);
    });

    game.events.on('stage-clear', (data: { score: number; elapsedMs: number }) => {
      stageComplete({ stage, score: data.score, elapsedMs: data.elapsedMs, cleared: true });
      onClearRef.current?.({ score: data.score, elapsedMs: data.elapsedMs, cleared: true });
    });

    game.events.on('game-over', (data: { score: number; elapsedMs: number }) => {
      stageComplete({ stage, score: data.score, elapsedMs: data.elapsedMs, cleared: false });
      onGameOverRef.current?.({ score: data.score, elapsedMs: data.elapsedMs, cleared: false });
    });

    return () => {
      destroyGame(game);
      gameRef.current = null;
    };
  }, [stage]);

  const doHint = () => {
    if (hintCount <= 0) return;
    const scene = gameRef.current ? getPlayScene(gameRef.current) : null;
    if (scene) {
      scene.doHint();
      setHintCount(c => c - 1);
    }
  };

  return {
    containerRef,
    score,
    foundCount: foundTypes.size,
    foundTypes,
    targetCount,
    targetTypes,
    remainingMs,
    hintCount,
    doHint,
  };
}
