import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Alert, Dimensions } from 'react-native';
import { 
  TileData, 
  SlotItem, 
  GamePhase, 
  MAX_SLOT 
} from '../types';
import { generateBoard, isTileBlocked } from '../logic/board';
import { addToSlotAndMatch } from '../logic/matcher';
import { getStageConfig } from '../logic/stage';
import { Tile } from './Tile';
import { SlotBar } from './SlotBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_TILE_GAP_RATIO = 0.08;

export const GameBoard: React.FC<GameBoardProps> = ({ stageId, onGameEnd }) => {
  const config = getStageConfig(stageId);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.PLAYING);
  const [score, setScore] = useState(0);

  // Layout calculations matching web
  const boardPadding = 12;
  const boardAvailW = SCREEN_WIDTH - boardPadding * 2;
  const boardAvailH = SCREEN_HEIGHT - 220; 
  
  const extraOffset = (config.layers - 1) * 0.5;
  const effectiveCols = config.cols + extraOffset;
  const effectiveRows = config.rows + extraOffset;
  
  const maxTileW = boardAvailW / (effectiveCols + (effectiveCols - 1) * BASE_TILE_GAP_RATIO);
  const maxTileH = boardAvailH / (effectiveRows + (effectiveRows - 1) * BASE_TILE_GAP_RATIO);
  
  const tileSize = Math.floor(Math.min(maxTileW, maxTileH)); 
  const gap = Math.floor(tileSize * BASE_TILE_GAP_RATIO);

  const gridWidth = effectiveCols * (tileSize + gap) - gap;
  const gridHeight = effectiveRows * (tileSize + gap) - gap;

  // 타일들을 중앙으로 모으기 위한 오프셋 계산
  const actualBoardOffsetX = (SCREEN_WIDTH - gridWidth) / 2;

  // 초기 보드 생성
  useEffect(() => {
    const newTiles = generateBoard(config).map(t => ({
      ...t,
      isSelectable: true
    }));
    const updated = newTiles.map(t => ({
      ...t,
      isSelectable: !isTileBlocked(t, newTiles)
    }));
    setTiles(updated);
  }, [stageId]);

  const handleTilePress = useCallback((tile: TileData) => {
    if (phase !== GamePhase.PLAYING) return;
    
    const nextTiles = tiles.filter(t => t.id !== tile.id);
    const updatedTiles = nextTiles.map(t => ({
      ...t,
      isSelectable: !isTileBlocked(t, nextTiles)
    }));
    
    const { slots: nextSlots, matchedCount } = addToSlotAndMatch(slots, tile);
    
    setTiles(updatedTiles);
    setSlots(nextSlots);
    if (matchedCount > 0) {
      setScore(s => s + matchedCount * 100);
    }

    if (updatedTiles.length === 0 && nextSlots.length === 0) {
      setPhase(GamePhase.CLEAR);
      onGameEnd?.('win');
    } else if (nextSlots.length >= MAX_SLOT) {
      setPhase(GamePhase.GAMEOVER);
      onGameEnd?.('lose');
    }
  }, [tiles, slots, phase, onGameEnd]);

  const sortedTiles = [...tiles].sort((a, b) => a.layer - b.layer);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>SCORE: {score.toLocaleString()}</Text>
        </View>
        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>STAGE {stageId}</Text>
        </View>
      </View>

      <View style={styles.boardContainer}>
        <View style={{ 
            width: SCREEN_WIDTH, 
            height: gridHeight,
            position: 'relative'
          }}>
          {sortedTiles.map(tile => (
            <Tile 
              key={tile.id} 
              tile={tile}
              size={tileSize}
              gap={gap}
              boardPad={actualBoardOffsetX} 
              onPress={handleTilePress} 
            />
          ))}
        </View>
      </View>

      <SlotBar slots={slots} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  stageBadge: {
    backgroundColor: '#4DABF7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
