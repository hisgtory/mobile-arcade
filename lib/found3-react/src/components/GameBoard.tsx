/**
 * GameBoard — main found3 game component (pure React, no Phaser)
 *
 * Manages full game state: board generation, tile selection,
 * slot matching, scoring, timer, and game-over detection.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { styled } from '@stitches/react';
import {
  type TileData,
  type SlotItem,
  type GameState,
  type HapticFn,
  GamePhase,
} from '../types';
import { generateBoard, resetIdCounter } from '../logic/board';
import { addToSlotAndMatch } from '../logic/matcher';
import { getStageConfig } from '../logic/stage';
import { TileGrid } from './TileGrid';
import { SlotBar } from './SlotBar';

const Container = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  width: '100%',
  maxWidth: '400px',
  margin: '0 auto',
  userSelect: 'none',
});

interface GameResult {
  score: number;
  elapsedMs: number;
  cleared: boolean;
}

interface GameBoardProps {
  stage: number;
  onClear?: (result: GameResult) => void;
  onGameOver?: (result: GameResult) => void;
  onStateUpdate?: (state: GameState) => void;
  haptic?: HapticFn;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  stage,
  onClear,
  onGameOver,
  onStateUpdate,
  haptic,
}) => {
  const config = getStageConfig(stage);

  const [tiles, setTiles] = useState<TileData[]>([]);
  const [slotItems, setSlotItems] = useState<SlotItem[]>([]);
  const [removingType, setRemovingType] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.IDLE);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  // Stable callback refs (avoids stale closures in effects)
  const onStateUpdateRef = useRef(onStateUpdate);
  onStateUpdateRef.current = onStateUpdate;
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  // Tile size calculation — matches Phaser PlayScene exactly
  // BASE_TILE_GAP_RATIO = 0.08, maxCap = 70 (CSS px, no dpr)
  const BASE_TILE_GAP_RATIO = 0.08;
  const extraOffset = (config.layers - 1) * 0.5;
  const effectiveCols = config.cols + extraOffset;
  const effectiveRows = config.rows + extraOffset;
  const maxBoardWidth = 360;
  const maxTileW = maxBoardWidth / (effectiveCols + (effectiveCols - 1) * BASE_TILE_GAP_RATIO);
  const maxTileH = 480 / (effectiveRows + (effectiveRows - 1) * BASE_TILE_GAP_RATIO);
  const maxCap = 70;
  const tileSize = Math.floor(Math.min(maxTileW, maxTileH, maxCap));
  const gap = Math.floor(tileSize * BASE_TILE_GAP_RATIO);

  const getElapsedMs = useCallback(() => {
    if (startTimeRef.current === 0) return 0;
    return Date.now() - startTimeRef.current;
  }, []);

  // Initialize board
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
    startTimeRef.current = Date.now();
  }, [stage]);

  // Timer
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

  // Notify state changes
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

  // Game over callback
  useEffect(() => {
    if (phase === GamePhase.GAME_OVER) {
      onGameOverRef.current?.({ score, elapsedMs: getElapsedMs(), cleared: false });
    }
  }, [phase, score, getElapsedMs]);

  // Clear callback
  useEffect(() => {
    if (phase === GamePhase.CLEAR) {
      onClearRef.current?.({ score, elapsedMs: getElapsedMs(), cleared: true });
    }
  }, [phase, score, getElapsedMs]);

  const handleTileTap = useCallback(
    (tile: TileData) => {
      if (isAnimating || phase !== GamePhase.PLAYING) return;

      // Haptic: tile tap (immediate, before any state change)
      haptic?.('tile-tapped');

      const newItem: SlotItem = { id: tile.id, type: tile.type };
      const result = addToSlotAndMatch(slotItems, newItem);

      // Remove tile from board
      setTiles((prev) => prev.filter((t) => t.id !== tile.id));

      if (result.matched) {
        // Haptic: slot matched
        haptic?.('slot-matched');

        setIsAnimating(true);
        setRemovingType(result.matchedType ?? null);
        setCombo((prev) => prev + 1);
        setScore((prev) => prev + 100 * (combo + 1));

        // Brief delay to show removal animation, then update slot
        setTimeout(() => {
          setSlotItems(result.slotItems);
          setRemovingType(null);
          setIsAnimating(false);
        }, 250);

        // Check if all tiles cleared
        setTiles((prev) => {
          if (prev.length === 0) {
            haptic?.('stage-clear');
            setPhase(GamePhase.CLEAR);
          }
          return prev;
        });
      } else {
        setCombo(0);
        setSlotItems(result.slotItems);

        // Check if slot is full (game over)
        if (result.slotFull) {
          haptic?.('game-over');
          setPhase(GamePhase.GAME_OVER);
        }
      }
    },
    [isAnimating, phase, slotItems, combo, haptic],
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
        onTileTap={handleTileTap}
      />
      <SlotBar items={slotItems} removingType={removingType} />
    </Container>
  );
};
