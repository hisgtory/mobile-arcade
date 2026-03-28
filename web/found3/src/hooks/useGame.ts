import { useRef, useEffect, useState, useCallback } from 'react';
import {
  createGame,
  destroyGame,
  getPlayScene,
  DEFAULT_BRIDGE_GAME_STATE,
  DEFAULT_ITEM_COUNTS,
  type SlotItem,
  type BridgeGameState,
  type ItemCounts,
} from '@arcade/lib-found3';
import { useBridge } from './useBridge';

export interface GameResult {
  cleared: boolean;
  score: number;
  elapsedMs: number;
}

export type ItemType = 'shuffle' | 'undo' | 'hint';

interface UseGameOptions {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
}

export function useGame(options: UseGameOptions) {
  const { stage, onClear, onGameOver } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const stateRef = useRef<BridgeGameState>(DEFAULT_BRIDGE_GAME_STATE);
  const bridge = useBridge();

  const [slotItems, setSlotItems] = useState<SlotItem[]>([]);
  const [remainingTiles, setRemainingTiles] = useState(0);
  const [totalTiles, setTotalTiles] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [itemCounts, setItemCounts] = useState<ItemCounts>({ ...DEFAULT_ITEM_COUNTS });

  // Stable refs for callbacks
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || gameRef.current) return;

    bridge.loadState().then((loaded) => {
      const state = loaded ?? DEFAULT_BRIDGE_GAME_STATE;
      stateRef.current = state;
      setItemCounts({ ...state.itemCounts });

      const game = createGame(el, { stage });
      gameRef.current = game;

      // Listen to Phaser events
      game.events.on('tile-selected', (data: any) => {
        setSlotItems([...data.slotItems]);
        setRemainingTiles(data.remainingTiles);
        setTotalTiles(data.totalTiles);
        setScore(data.score);
        setCombo(data.combo);
      });

      game.events.on('slot-matched', (data: any) => {
        setSlotItems([...data.slotItems]);
        setScore(data.score);
        setCombo(data.combo);
      });

      game.events.on('time-update', (data: any) => {
        setElapsedMs(data.elapsedMs);
      });

      game.events.on('stage-clear', (data: any) => {
        const result: GameResult = { cleared: true, score: data.score, elapsedMs: data.elapsedMs };
        bridge.saveState({
          ...stateRef.current,
          currentStage: stage + 1,
          stagesCleared: [...stateRef.current.stagesCleared, stage],
        });
        bridge.stageComplete({ stage, score: data.score, elapsedMs: data.elapsedMs, cleared: true });
        onClearRef.current?.(result);
      });

      game.events.on('game-over', (data: any) => {
        const result: GameResult = { cleared: false, score: data.score, elapsedMs: data.elapsedMs };
        bridge.saveState(stateRef.current);
        bridge.stageComplete({ stage, score: data.score, elapsedMs: data.elapsedMs, cleared: false });
        onGameOverRef.current?.(result);
      });
    });

    return () => {
      if (gameRef.current) {
        destroyGame(gameRef.current);
        gameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveItemCounts = useCallback((counts: ItemCounts) => {
    stateRef.current = { ...stateRef.current, itemCounts: counts };
    bridge.saveState(stateRef.current);
  }, [bridge]);

  const doShuffle = useCallback(() => {
    setItemCounts((prev) => {
      if (prev.shuffle <= 0) return prev;
      if (gameRef.current) getPlayScene(gameRef.current)?.doShuffle();
      const newCount = prev.shuffle - 1;
      const next = { ...prev, shuffle: newCount };
      bridge.itemUsed('shuffle', newCount);
      saveItemCounts(next);
      return next;
    });
  }, [bridge, saveItemCounts]);

  const doUndo = useCallback(() => {
    setItemCounts((prev) => {
      if (prev.undo <= 0) return prev;
      if (gameRef.current) getPlayScene(gameRef.current)?.doUndo();
      const newCount = prev.undo - 1;
      const next = { ...prev, undo: newCount };
      bridge.itemUsed('undo', newCount);
      saveItemCounts(next);
      return next;
    });
  }, [bridge, saveItemCounts]);

  const doMagnet = useCallback(() => {
    setItemCounts((prev) => {
      if (prev.magnet <= 0) return prev;
      if (gameRef.current) getPlayScene(gameRef.current)?.doMagnet();
      const newCount = prev.magnet - 1;
      const next = { ...prev, magnet: newCount };
      bridge.itemUsed('magnet', newCount);
      saveItemCounts(next);
      return next;
    });
  }, [bridge, saveItemCounts]);

  const handleAdRequest = useCallback(async (itemType: ItemType) => {
    const result = await bridge.requestAd();
    if (result?.rewarded) {
      setItemCounts((prev) => {
        const key = itemType === 'hint' ? 'magnet' : itemType;
        const next = { ...prev, [key]: prev[key] + 1 };
        saveItemCounts(next);
        return next;
      });
    }
  }, [bridge, saveItemCounts]);

  return {
    containerRef,
    slotItems,
    remainingTiles,
    totalTiles,
    score,
    combo,
    elapsedMs,
    itemCounts,
    doShuffle,
    doUndo,
    doMagnet,
    handleAdRequest,
  };
}
