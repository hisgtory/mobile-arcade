import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Dimensions, ImageBackground, Image } from 'react-native';
import { 
  TileData, 
  SlotItem, 
  GamePhase, 
  MAX_SLOT,
  UndoEntry 
} from '../types';
import { generateBoard, isTileBlocked, shuffleBoard } from '../logic/board';
import { addToSlotAndMatch, undoLastSlotItem } from '../logic/matcher';
import { getStageConfig } from '../logic/stage';
import { Tile } from './Tile';
import { SlotBar } from './SlotBar';
import { ItemBar } from './ItemBar';
import { TILE_ASSETS } from '../assets';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_TILE_GAP_RATIO = 0.08;

interface GameBoardProps {
  stageId: number;
  onGameEnd?: (result: 'win' | 'lose', stats?: { time: number, limit: number }) => void;
  onExit?: () => void;
  onRestart?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  stageId, 
  onGameEnd, 
  onExit, 
  onRestart 
}) => {
  const config = getStageConfig(stageId);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.PLAYING);
  const [showSettings, setShowSettings] = useState(false);
  const [itemCounts, setItemCounts] = useState({ undo: 3, shuffle: 3, expand: 3 });
  const [maxSlot, setMaxSlot] = useState(MAX_SLOT);
  const [elapsedTime, setElapsedTime] = useState(0); 
  
  const undoHistoryRef = useRef<UndoEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Layout calculations
  const horizontalMargin = 20; 
  const boardAvailW = SCREEN_WIDTH - horizontalMargin * 2; 
  const boardAvailH = SCREEN_HEIGHT - 350; 
  
  const extraOffset = (config.layers - 1) * 0.5;
  const effectiveCols = config.cols + extraOffset;
  const effectiveRows = config.rows + extraOffset;
  
  const maxTileW = boardAvailW / (effectiveCols + (effectiveCols - 1) * BASE_TILE_GAP_RATIO);
  const maxTileH = boardAvailH / (effectiveRows + (effectiveRows - 1) * BASE_TILE_GAP_RATIO);
  
  const countScale = Math.max(1.0, 1.2 - (config.tileCount / 150));
  const tileSize = Math.floor(Math.min(maxTileW, maxTileH) * countScale); 
  const gap = Math.floor(tileSize * BASE_TILE_GAP_RATIO);

  const gridWidth = effectiveCols * (tileSize + gap) - gap;
  const gridHeight = effectiveRows * (tileSize + gap) - gap;
  const actualBoardOffsetX = (SCREEN_WIDTH - gridWidth) / 2;

  useEffect(() => {
    const newTiles = generateBoard(config).map(t => ({ ...t, isSelectable: true }));
    const updated = newTiles.map(t => ({ ...t, isSelectable: !isTileBlocked(t, newTiles) }));
    setTiles(updated);
    setSlots([]);
    setMaxSlot(MAX_SLOT);
    setElapsedTime(0);
    undoHistoryRef.current = [];
    setPhase(GamePhase.PLAYING);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stageId]);

  const handleGameEnd = useCallback((result: 'win' | 'lose') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase(result === 'win' ? GamePhase.CLEAR : GamePhase.GAMEOVER);
    const timeUsed = config.timeLimit - elapsedTime; // 혹은 그냥 elapsedTime 전달
    onGameEnd?.(result, { time: elapsedTime, limit: config.timeLimit });
  }, [elapsedTime, config.timeLimit, onGameEnd]);

  const handleTilePress = useCallback((tile: TileData) => {
    if (phase !== GamePhase.PLAYING || !tile) return;
    
    undoHistoryRef.current.push({
      slotItem: { id: tile.id, type: tile.type },
      tileData: { ...tile }
    });

    const nextTiles = tiles.filter(t => t && t.id !== tile.id);
    const updatedTiles = nextTiles.map(t => ({
      ...t,
      isSelectable: !isTileBlocked(t, nextTiles)
    }));
    
    const result = addToSlotAndMatch(slots, tile, maxSlot);
    const nextSlots = result.slotItems || [];
    const matched = result.matched;
    
    setTiles(updatedTiles);
    setSlots(nextSlots);

    if (updatedTiles.length === 0 && nextSlots.length === 0) {
      handleGameEnd('win');
    } else if (nextSlots.length >= maxSlot && !matched) {
      handleGameEnd('lose');
    }
  }, [tiles, slots, phase, handleGameEnd, maxSlot]);

  const handleUndo = () => {
    if (itemCounts.undo <= 0 || undoHistoryRef.current.length === 0) return;
    const lastAction = undoHistoryRef.current.pop()!;
    const { slotItems } = undoLastSlotItem(slots);
    const newTiles = [...tiles, lastAction.tileData];
    const updatedTiles = newTiles.map(t => ({ ...t, isSelectable: !isTileBlocked(t, newTiles) }));
    setTiles(updatedTiles);
    setSlots(slotItems);
    setItemCounts(prev => ({ ...prev, undo: prev.undo - 1 }));
  };

  const handleShuffle = () => {
    if (itemCounts.shuffle <= 0 || tiles.length === 0) return;
    const shuffled = shuffleBoard(tiles);
    setTiles(shuffled);
    setItemCounts(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
  };

  const handleExpand = () => {
    if (itemCounts.expand <= 0) return;
    setMaxSlot(prev => prev + 1);
    setItemCounts(prev => ({ ...prev, expand: prev.expand - 1 }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const sortedTiles = [...tiles].sort((a, b) => a.layer - b.layer);

  return (
    <ImageBackground source={TILE_ASSETS['background']} style={styles.container} resizeMode="cover">
      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SETTINGS</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => { setShowSettings(false); onRestart?.(); }}>
               <Text style={styles.modalBtnText}>RESTART</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtn} onPress={() => { setShowSettings(false); onExit?.(); }}>
               <Text style={styles.modalBtnText}>EXIT GAME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSettings(false)}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header Area: No ImageBackground, Pure View and Text */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
           <Text style={styles.timerText}>⏱️ {formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.centerContainer}>
           <Text style={styles.stageText}>STAGE {stageId}</Text>
        </View>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SlotBar slots={slots} maxSlot={maxSlot} />

      <View style={styles.boardContainer}>
        <View style={{ width: SCREEN_WIDTH, height: gridHeight, position: 'relative' }}>
          {sortedTiles.map(tile => (
            <Tile key={tile.id} tile={tile} size={tileSize} gap={gap} boardPad={actualBoardOffsetX} onPress={handleTilePress} />
          ))}
        </View>
      </View>

      <ItemBar itemCounts={itemCounts} onUndo={handleUndo} onShuffle={handleShuffle} onExpand={handleExpand} />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 10 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    alignItems: 'center', 
    height: 60, 
    width: '100%',
    marginBottom: 5 
  },
  headerSide: { width: 100 },
  timerText: { fontSize: 18, fontWeight: '800', color: '#333' },
  centerContainer: { flex: 1, alignItems: 'center' },
  stageText: { fontSize: 22, fontWeight: '900', color: '#333', letterSpacing: 1 },
  settingsButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 24 },
  boardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '80%', padding: 30, borderRadius: 30, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 30, color: '#333' },
  modalBtn: { width: '100%', height: 55, backgroundColor: '#f1f3f5', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalBtnText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeButton: { marginTop: 10, padding: 10 },
  closeButtonText: { color: '#adb5bd', fontSize: 16, fontWeight: '600' },
});
