/**
 * GameBoard — main found3 game component (pure React, no Phaser)
 *
 * 1:1 recreation of lib/found3/src/scenes/PlayScene.ts logic:
 *   - Board generation, tile selection, slot matching, scoring
 *   - Undo, Shuffle, Magnet power-ups (exposed via ref)
 *   - Input locking during animations
 *   - Timer, game-over, stage-clear
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { styled } from '@stitches/react';
import {
  type TileData,
  type SlotItem,
  type GameState,
  type UndoEntry,
  type HapticFn,
  GamePhase,
} from '../types';
import { generateBoard, resetIdCounter, isTileBlocked } from '../logic/board';
import { addToSlotAndMatch } from '../logic/matcher';
import { getStageConfig } from '../logic/stage';
import { TileGrid } from './TileGrid';
import { SlotBar } from './SlotBar';

const BASE_TILE_GAP_RATIO = 0.08;

const Container = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
});

export interface GameResult {
  score: number;
  elapsedMs: number;
  cleared: boolean;
}

export interface GameBoardHandle {
  doShuffle: () => void;
  doUndo: () => void;
  doMagnet: () => void;
}

export interface GameBoardProps {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
  onStateUpdate?: (state: GameState) => void;
  haptic?: HapticFn;
  /** If true, the internal SlotBar is hidden (caller renders their own) */
  hideSlotBar?: boolean;
}

export const GameBoard = forwardRef<GameBoardHandle, GameBoardProps>(
  ({ stage, onClear, onGameOver, onStateUpdate, haptic, hideSlotBar }, ref) => {
    const config = getStageConfig(stage);

    const [tiles, setTiles] = useState<TileData[]>([]);
    const [slotItems, setSlotItems] = useState<SlotItem[]>([]);
    const [removingType, setRemovingType] = useState<number | null>(null);
    const [phase, setPhase] = useState<GamePhase>(GamePhase.IDLE);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [timeLeft, setTimeLeft] = useState(config.timeLimit);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hintTileIds, setHintTileIds] = useState<Set<string>>(new Set());
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef(0);
    const undoHistoryRef = useRef<UndoEntry[]>([]);

    // Stable callback refs (avoids stale closures in effects)
    const onStateUpdateRef = useRef(onStateUpdate);
    onStateUpdateRef.current = onStateUpdate;
    const onClearRef = useRef(onClear);
    onClearRef.current = onClear;
    const onGameOverRef = useRef(onGameOver);
    onGameOverRef.current = onGameOver;

    // Tile size calculation — matches Phaser PlayScene (Scale.FIT logic)
    // Use actual viewport width (minus padding) instead of hardcoded 360
    const padding = 16;
    const boardAvailW = Math.min(
      typeof window !== 'undefined' ? window.innerWidth - padding * 2 : 360,
      400,
    );
    // Estimate available board height: viewport minus HUD(~50) + SlotBar(~60) + ItemBar(~80) + padding
    const boardAvailH = typeof window !== 'undefined' ? window.innerHeight - 220 : 480;
    const extraOffset = (config.layers - 1) * 0.5;
    const effectiveCols = config.cols + extraOffset;
    const effectiveRows = config.rows + extraOffset;
    const maxTileW =
      boardAvailW / (effectiveCols + (effectiveCols - 1) * BASE_TILE_GAP_RATIO);
    const maxTileH =
      boardAvailH / (effectiveRows + (effectiveRows - 1) * BASE_TILE_GAP_RATIO);
    const maxCap = 70;
    const tileSize = Math.floor(Math.min(maxTileW, maxTileH, maxCap));
    const gap = Math.floor(tileSize * BASE_TILE_GAP_RATIO);

    const getElapsedMs = useCallback(() => {
      if (startTimeRef.current === 0) return 0;
      return Date.now() - startTimeRef.current;
    }, []);

    // ─── Initialize board ────────────────────────────────
    useEffect(() => {
      resetIdCounter();
      const board = generateBoard(config);
      setTiles(board);
      setSlotItems([]);
      setScore(0);
      setCombo(0);
      setTimeLeft(config.timeLimit);
      setPhase(GamePhase.PLAYING);
      setRemovingType(null);
      setIsAnimating(false);
      setHintTileIds(new Set());
      undoHistoryRef.current = [];
      startTimeRef.current = Date.now();
    }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Timer ───────────────────────────────────────────
    useEffect(() => {
      if (phase !== GamePhase.PLAYING) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPhase(GamePhase.GAME_OVER);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [phase]);

    // ─── Notify state changes ────────────────────────────
    useEffect(() => {
      onStateUpdateRef.current?.({
        phase,
        stage,
        score,
        combo,
        remainingTiles: tiles.length,
        totalTiles: config.tileCount,
        timeLeft,
        elapsedMs: getElapsedMs(),
        slotItems,
      });
    }, [phase, score, combo, tiles.length, timeLeft, slotItems, stage, config.tileCount, getElapsedMs]);

    // ─── Game over callback ──────────────────────────────
    useEffect(() => {
      if (phase === GamePhase.GAME_OVER) {
        onGameOverRef.current?.({ score, elapsedMs: getElapsedMs(), cleared: false });
      }
    }, [phase, score, getElapsedMs]);

    // ─── Clear callback ──────────────────────────────────
    useEffect(() => {
      if (phase === GamePhase.CLEAR) {
        onClearRef.current?.({ score: score + 500, elapsedMs: getElapsedMs(), cleared: true });
      }
    }, [phase, score, getElapsedMs]);

    // ─── Tile selection (matches PlayScene._onTileSelect) ─
    const handleTileTap = useCallback(
      (tile: TileData) => {
        if (isAnimating || phase !== GamePhase.PLAYING) return;

        // Haptic: tile tap (immediate, before any state change)
        haptic?.('tile-tapped');

        setIsAnimating(true);
        setHintTileIds(new Set());

        const newItem: SlotItem = { id: tile.id, type: tile.type };

        // Save undo entry before removing
        undoHistoryRef.current.push({ slotItem: newItem, tileData: { ...tile } });

        const result = addToSlotAndMatch(slotItems, newItem);

        // Remove tile from board
        setTiles((prev) => prev.filter((t) => t.id !== tile.id));

        if (result.matched) {
          // Haptic: slot matched
          haptic?.('slot-matched');

          // Clear undo history on match (same as Phaser)
          undoHistoryRef.current = [];

          setRemovingType(result.matchedType ?? null);
          setCombo((prev) => prev + 1);
          setScore((prev) => prev + 100 * (combo + 1));

          // Brief delay to show removal animation, then update slot
          setTimeout(() => {
            setSlotItems(result.slotItems);
            setRemovingType(null);

            // Check win condition after match animation
            setTiles((prev) => {
              if (prev.length === 0) {
                haptic?.('stage-clear');
                setScore((s) => s + 500);
                setPhase(GamePhase.CLEAR);
              }
              return prev;
            });

            setIsAnimating(false);
          }, 250);
        } else {
          setCombo(0);
          setSlotItems(result.slotItems);

          // Check if slot is full (game over)
          if (result.slotFull) {
            haptic?.('game-over');
            setPhase(GamePhase.GAME_OVER);
          }

          // Check win: tile we just removed might have been the last
          setTiles((prev) => {
            if (prev.length === 0) {
              haptic?.('stage-clear');
              setScore((s) => s + 500);
              setPhase(GamePhase.CLEAR);
            }
            return prev;
          });

          setIsAnimating(false);
        }
      },
      [isAnimating, phase, slotItems, combo, haptic],
    );

    // ─── Power-ups (exposed via ref) ─────────────────────

    // Shuffle: randomize tile types, keep positions (matches PlayScene.doShuffle)
    const doShuffle = useCallback(() => {
      if (isAnimating || phase !== GamePhase.PLAYING) return;

      setTiles((prev) => {
        if (prev.length === 0) return prev;

        const types = prev.map((t) => t.type);
        // Fisher-Yates shuffle
        for (let i = types.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [types[i], types[j]] = [types[j], types[i]];
        }

        return prev.map((t, idx) => ({ ...t, type: types[idx] }));
      });

      undoHistoryRef.current = [];
      setHintTileIds(new Set());
    }, [isAnimating, phase]);

    // Undo: return last tile to board (matches PlayScene.doUndo)
    const doUndo = useCallback(() => {
      if (isAnimating || phase !== GamePhase.PLAYING) return;
      if (undoHistoryRef.current.length === 0) return;

      const entry = undoHistoryRef.current.pop()!;

      // Remove from slot
      setSlotItems((prev) => {
        const idx = prev.findIndex((s) => s.id === entry.slotItem.id);
        if (idx < 0) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });

      // Restore tile to board
      setTiles((prev) => [...prev, entry.tileData]);
      setHintTileIds(new Set());
    }, [isAnimating, phase]);

    // Magnet: highlight tiles that can match (matches PlayScene.doMagnet)
    const doMagnet = useCallback(() => {
      if (isAnimating || phase !== GamePhase.PLAYING) return;

      // Find selectable tiles
      const selectableTiles = tiles.filter((t) => !isTileBlocked(t, tiles));
      const typeMap = new Map<number, TileData[]>();
      for (const t of selectableTiles) {
        const arr = typeMap.get(t.type) || [];
        arr.push(t);
        typeMap.set(t.type, arr);
      }

      // Prefer a type with 3+ selectable tiles
      let hintTiles: TileData[] | null = null;
      for (const [, group] of typeMap) {
        if (group.length >= 3) {
          hintTiles = group.slice(0, 3);
          break;
        }
      }

      // Fallback: 2 selectable tiles of same type
      if (!hintTiles) {
        for (const [, group] of typeMap) {
          if (group.length >= 2) {
            hintTiles = group.slice(0, Math.min(3, group.length));
            break;
          }
        }
      }

      if (!hintTiles || hintTiles.length === 0) return;

      const ids = new Set(hintTiles.map((t) => t.id));
      setHintTileIds(ids);

      // Auto-clear hint after bounce animation
      setTimeout(() => setHintTileIds(new Set()), 800);
    }, [isAnimating, phase, tiles]);

    // Expose power-up methods via ref
    useImperativeHandle(
      ref,
      () => ({ doShuffle, doUndo, doMagnet }),
      [doShuffle, doUndo, doMagnet],
    );

    return (
      <Container>
        <TileGrid
          tiles={tiles}
          cols={config.cols}
          rows={config.rows}
          layers={config.layers}
          tileSize={tileSize}
          gap={gap}
          hintTileIds={hintTileIds}
          onTileTap={handleTileTap}
        />
        {!hideSlotBar && <SlotBar items={slotItems} removingType={removingType} />}
      </Container>
    );
  },
);

GameBoard.displayName = 'GameBoard';
