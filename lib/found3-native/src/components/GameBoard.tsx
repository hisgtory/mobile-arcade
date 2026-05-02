import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Dimensions, ImageBackground, Animated, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const undoHistoryRef = useRef<UndoEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Layout calculations
  const horizontalMargin = 20; 
  const boardAvailW = SCREEN_WIDTH - horizontalMargin * 2; 
  const boardAvailH = SCREEN_HEIGHT - 350; 
  const countScale = Math.max(1.0, 1.2 - (config.tileCount / 150));
  const tileSize = Math.floor(Math.min(boardAvailW / (config.cols + 0.5), boardAvailH / (config.rows + 0.5)) * countScale); 
  const gap = Math.floor(tileSize * BASE_TILE_GAP_RATIO);
  const gridWidth = (config.cols + (config.layers - 1) * 0.5) * (tileSize + gap) - gap;
  const gridHeight = (config.rows + (config.layers - 1) * 0.5) * (tileSize + gap) - gap;
  const actualBoardOffsetX = (SCREEN_WIDTH - gridWidth) / 2;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  }, [toastOpacity]);

  const triggerMatchHaptic = useCallback(() => {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 50, 40, 60, 30, 80, 20, 150]); 
    } else {
      const pattern = [0, 60, 110, 170, 240];
      pattern.forEach((delay, index) => {
        setTimeout(() => {
          Haptics.impactAsync(index === pattern.length - 1 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
        }, delay);
      });
    }
  }, []);

  const handleTilePress = useCallback((tile: TileData) => {
    if (phase !== GamePhase.PLAYING || !tile) return;
    Vibration.vibrate(35);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    undoHistoryRef.current.push({ slotItem: { id: tile.id, type: tile.type }, tileData: { ...tile } });
    const nextTiles = tiles.filter(t => t && t.id !== tile.id);
    const updatedTiles = nextTiles.map(t => ({ ...t, isSelectable: !isTileBlocked(t, nextTiles) }));
    const result = addToSlotAndMatch(slots, tile, maxSlot);
    if (result.matched) triggerMatchHaptic();

    setTiles(updatedTiles);
    setSlots(result.slotItems || []);
    if (updatedTiles.length === 0 && (result.slotItems || []).length === 0) handleGameEnd('win');
    else if ((result.slotItems || []).length >= maxSlot && !result.matched) handleGameEnd('lose');
  }, [tiles, slots, phase, handleGameEnd, maxSlot, triggerMatchHaptic]);

  const handleUndo = () => {
    if (undoHistoryRef.current.length === 0 || itemCounts.undo <= 0) return;
    Vibration.vibrate(50);
    const lastAction = undoHistoryRef.current.pop()!;
    const { slotItems } = undoLastSlotItem(slots);
    const newTiles = [...tiles, lastAction.tileData];
    setTiles(newTiles.map(t => ({ ...t, isSelectable: !isTileBlocked(t, newTiles) })));
    setSlots(slotItems);
    setItemCounts(prev => ({ ...prev, undo: prev.undo - 1 }));
  };

  const handleShuffle = () => {
    if (tiles.length === 0 || itemCounts.shuffle <= 0) return;
    Vibration.vibrate([0, 30, 30, 30, 30, 50]);
    const shuffled = shuffleBoard(tiles);
    setTiles(shuffled.map(t => ({ ...t, isSelectable: !isTileBlocked(t, shuffled) })));
    setItemCounts(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
  };

  const handleExpand = () => {
    if (itemCounts.expand <= 0) return;
    Vibration.vibrate(100);
    setMaxSlot(prev => prev + 1);
    setItemCounts(prev => ({ ...prev, expand: prev.expand - 1 }));
  };

  useEffect(() => {
    const generated = generateBoard(config);
    const initialTiles = generated.map(t => ({ ...t, isSelectable: !isTileBlocked(t, generated) }));
    setTiles(initialTiles);
    setSlots([]);
    setMaxSlot(MAX_SLOT);
    setElapsedTime(0);
    undoHistoryRef.current = [];
    setPhase(GamePhase.PLAYING);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsedTime(v => v + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stageId]);

  const handleGameEnd = useCallback((res: 'win' | 'lose') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase(res === 'win' ? GamePhase.CLEAR : GamePhase.GAMEOVER);
    onGameEnd?.(res, { time: elapsedTime, limit: config.timeLimit });
  }, [elapsedTime, config.timeLimit, onGameEnd]);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${s%60 < 10 ? '0' : ''}${s%60}`;

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
      {toastMsg && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
      <View style={styles.header}>
        <View style={styles.headerSide}><Text style={styles.timerText}>⏱️ {formatTime(elapsedTime)}</Text></View>
        <View style={styles.centerContainer}><Text style={styles.stageText}>STAGE {stageId}</Text></View>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <SlotBar slots={slots} maxSlot={maxSlot} />
      <View style={styles.boardContainer}>
        <View style={{ width: SCREEN_WIDTH, height: gridHeight, position: 'relative' }}>
          {[...tiles].sort((a,b)=>a.layer-b.layer).map(tile => (
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
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center', height: 60, width: '100%', marginBottom: 5 },
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
  toastContainer: { position: 'absolute', top: SCREEN_HEIGHT / 2 - 25, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, zIndex: 9999 },
  toastText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
