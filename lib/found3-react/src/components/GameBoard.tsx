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
  MAX_SLOT,
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

interface GameBoardProps {
  stageId: number;
  onClear?: (score: number) => void;
  onGameOver?: (score: number) => void;
  onStateUpdate?: (state: GameState) => void;
  haptic?: HapticFn;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  stageId,
  onClear,
  onGameOver,
  onStateUpdate,
  haptic,
}) => {
  const config = getStageConfig(stageId);

  const [tiles, setTiles] = useState<TileData[]>([]);
  const [slotItems, setSlotItems] = useState<SlotItem[]>([]);
  const [removingType, setRemovingType] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.IDLE);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate tile size based on config
  const gap = 4;
  const extraOffset = (config.layers - 1) * 0.5;
  const effectiveCols = config.cols + extraOffset;
  const maxWidth = 360;
  const tileSize = Math.floor((maxWidth - (effectiveCols - 1) * gap) / effectiveCols);

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
  }, [stageId]);

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
    if (!onStateUpdate) return;
    onStateUpdate({
      phase,
      stage: stageId,
      score,
      combo,
      remainingTiles: tiles.length,
      timeLeft,
      slotItems,
    });
  }, [phase, score, combo, tiles.length, timeLeft, slotItems]);

  // Game over callback
  useEffect(() => {
    if (phase === GamePhase.GAME_OVER) {
      onGameOver?.(score);
    }
  }, [phase]);

  // Clear callback
  useEffect(() => {
    if (phase === GamePhase.CLEAR) {
      onClear?.(score);
    }
  }, [phase]);

  const handleTileTap = useCallback(
    (tile: TileData) => {
      if (phase !== GamePhase.PLAYING) return;

      // Haptic: tile tap (immediate, before any state change)
      haptic?.('tile-tapped');

      const newItem: SlotItem = { id: tile.id, type: tile.type };
      const result = addToSlotAndMatch(slotItems, newItem);

      // Remove tile from board
      setTiles((prev) => prev.filter((t) => t.id !== tile.id));

      if (result.matched) {
        // Haptic: slot matched
        haptic?.('slot-matched');

        setRemovingType(result.matchedType ?? null);
        setCombo((prev) => prev + 1);
        setScore((prev) => prev + 100 * (combo + 1));

        // Brief delay to show removal animation, then update slot
        setTimeout(() => {
          setSlotItems(result.slotItems);
          setRemovingType(null);
        }, 250);

        // Check if all tiles cleared
        setTiles((prev) => {
          if (prev.length === 0) {
            // Haptic: stage clear
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
    [phase, slotItems, combo, haptic],
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
