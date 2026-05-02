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
import { AudioService } from '../logic/audio';
import { Tile } from './Tile';
import { SlotBar } from './SlotBar';
import { ItemBar } from './ItemBar';
import { TILE_ASSETS } from '../assets';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_TILE_GAP_RATIO = 0.05;

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
  const [itemCounts, setItemCounts] = useState({ undo: 3, shuffle: 3, magnet: 3 });
  const [maxSlot, setMaxSlot] = useState(MAX_SLOT);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isMuted, setIsMuted] = useState(AudioService.isMuted);
  const [volume, setVolume] = useState(AudioService.volume);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const switchAnim = useRef(new Animated.Value(AudioService.isMuted ? 0 : 1)).current;
  const undoHistoryRef = useRef<UndoEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const horizontalMargin = 25; 
  const boardAvailW = SCREEN_WIDTH - horizontalMargin * 2; 
  const boardAvailH = SCREEN_HEIGHT - 380; 
  const gridEffectiveCols = config.cols + (config.layers - 1) * 0.5;
  const gridEffectiveRows = config.rows + (config.layers - 1) * 0.5;
  const tileSize = Math.floor(Math.min(boardAvailW / gridEffectiveCols, boardAvailH / gridEffectiveRows));
  const gap = Math.floor(tileSize * BASE_TILE_GAP_RATIO);
  const gridWidth = gridEffectiveCols * (tileSize + gap) - gap;
  const gridHeight = gridEffectiveRows * (tileSize + gap) - gap;
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

  // --- 혁신된 MAGNET 로직 ---
  const handleMagnet = () => {
    if (itemCounts.magnet <= 0 || phase !== GamePhase.PLAYING || tiles.length === 0) {
      if (itemCounts.magnet <= 0) showToast("No more MAGNET items!");
      return;
    }

    // 1. 타겟 과일 찾기 (슬롯에 이미 있는 과일 우선, 없으면 보드에서 아무거나 3개 있는 거)
    let targetType: number | null = null;
    const typeCountsOnBoard: Record<number, TileData[]> = {};
    tiles.forEach(t => {
      if (!typeCountsOnBoard[t.type]) typeCountsOnBoard[t.type] = [];
      typeCountsOnBoard[t.type].push(t);
    });

    // 슬롯에 있는 과일 중 보드에도 남은 게 있는지 확인
    for (const slotItem of slots) {
      if (typeCountsOnBoard[slotItem.type] && typeCountsOnBoard[slotItem.type].length >= (3 - slots.filter(s => s.type === slotItem.type).length)) {
        targetType = slotItem.type;
        break;
      }
    }

    // 슬롯에 적절한 게 없으면 보드에서 3개 한 세트가 있는 과일 선택
    if (targetType === null) {
      for (const type in typeCountsOnBoard) {
        if (typeCountsOnBoard[type].length >= 3) {
          targetType = Number(type);
          break;
        }
      }
    }

    if (targetType === null) {
      showToast("No triplets available!");
      return;
    }

    // 2. 해당 과일 3개를 채우기 위해 필요한 개수만큼 보드에서 추출 (스택 깊이 무관하게)
    const currentInSlot = slots.filter(s => s.type === targetType).length;
    const neededFromBoard = 3 - currentInSlot;
    const targetTilesFromBoard = typeCountsOnBoard[targetType].slice(0, neededFromBoard);

    // 3. 상태 일괄 업데이트 (버그 방지)
    const removedIds = targetTilesFromBoard.map(t => t.id);
    const nextTiles = tiles.filter(t => !removedIds.includes(t.id));
    const updatedTiles = nextTiles.map(t => ({ ...t, isSelectable: !isTileBlocked(t, nextTiles) }));
    
    // 슬롯에서 해당 타입 제거 (3개가 모였으므로 vanish)
    const nextSlots = slots.filter(s => s.type !== targetType);

    Vibration.vibrate(150);
    triggerMatchHaptic();
    
    setTiles(updatedTiles);
    setSlots(nextSlots);
    setItemCounts(prev => ({ ...prev, magnet: prev.magnet - 1 }));

    // 승리 판정
    if (updatedTiles.length === 0 && nextSlots.length === 0) handleGameEnd('win');
  };

  const toggleMusic = async () => {
    await AudioService.toggleMute();
    setIsMuted(AudioService.isMuted);
    Animated.timing(switchAnim, { toValue: AudioService.isMuted ? 0 : 1, duration: 200, useNativeDriver: false }).start();
    Vibration.vibrate(30);
  };

  const adjustVolume = async (delta: number) => {
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    await AudioService.setVolume(newVol);
    Vibration.vibrate(20);
  };

  useEffect(() => {
    const generated = generateBoard(config);
    setTiles(generated.map(t => ({ ...t, isSelectable: !isTileBlocked(t, generated) })));
    setSlots([]);
    setMaxSlot(MAX_SLOT);
    setElapsedTime(0);
    setIsMuted(AudioService.isMuted);
    setVolume(AudioService.volume);
    switchAnim.setValue(AudioService.isMuted ? 0 : 1);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsedTime(v => v + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stageId, switchAnim]);

  const handleGameEnd = useCallback((res: 'win' | 'lose') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase(res === 'win' ? GamePhase.CLEAR : GamePhase.GAMEOVER);
    onGameEnd?.(res, { time: elapsedTime, limit: config.timeLimit });
  }, [elapsedTime, config.timeLimit, onGameEnd]);

  return (
    <ImageBackground source={TILE_ASSETS['background']} style={styles.container} resizeMode="cover">
      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SETTINGS</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>MUSIC</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={toggleMusic}>
                <View style={[styles.switchTrack, { backgroundColor: isMuted ? '#dee2e6' : '#4DABF7' }]}>
                  <Animated.View style={[styles.switchThumb, { transform: [{ translateX: switchAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 26] }) }] }]} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>VOLUME</Text>
              <View style={styles.volumeController}>
                <TouchableOpacity style={styles.volBtn} onPress={() => adjustVolume(-0.1)}><Text style={styles.volBtnText}>-</Text></TouchableOpacity>
                <View style={styles.volProgressBg}><View style={[styles.volProgressFill, { width: `${volume * 100}%` }]} /></View>
                <TouchableOpacity style={styles.volBtn} onPress={() => adjustVolume(0.1)}><Text style={styles.volBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={() => { setShowSettings(false); onRestart?.(); }}><Text style={styles.modalBtnText}>RESTART</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalBtn} onPress={() => { setShowSettings(false); onExit?.(); }}><Text style={styles.modalBtnText}>EXIT GAME</Text></TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSettings(false)}><Text style={styles.closeButtonText}>CLOSE</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {toastMsg && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <View style={styles.headerSide}><Text style={styles.timerText}>⏱️ {`${Math.floor(elapsedTime/60)}:${elapsedTime%60 < 10 ? '0' : ''}${elapsedTime%60}`}</Text></View>
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
      <ItemBar 
        itemCounts={itemCounts} 
        onUndo={() => {
           if (undoHistoryRef.current.length === 0 || itemCounts.undo <= 0) return;
           Vibration.vibrate(50);
           const lastAction = undoHistoryRef.current.pop()!;
           const { slotItems } = undoLastSlotItem(slots);
           const newTiles = [...tiles, lastAction.tileData];
           setTiles(newTiles.map(t => ({ ...t, isSelectable: !isTileBlocked(t, newTiles) })));
           setSlots(slotItems);
           setItemCounts(prev => ({ ...prev, undo: prev.undo - 1 }));
        }} 
        onShuffle={() => {
          if (tiles.length === 0 || itemCounts.shuffle <= 0) return;
          Vibration.vibrate([0, 30, 30, 30, 30, 50]);
          const shuffled = shuffleBoard(tiles);
          setTiles(shuffled.map(t => ({ ...t, isSelectable: !isTileBlocked(t, shuffled) })));
          setItemCounts(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
        }} 
        onMagnet={handleMagnet} 
      />
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
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20, color: '#333' },
  settingRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingHorizontal: 15 },
  settingLabel: { fontSize: 16, fontWeight: 'bold', color: '#495057' },
  switchTrack: { width: 56, height: 32, borderRadius: 16, padding: 2, justifyContent: 'center', alignSelf: 'center' },
  switchThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  volumeController: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 180 },
  volBtn: { width: 36, height: 36, backgroundColor: '#f1f3f5', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  volBtnText: { fontSize: 20, fontWeight: 'bold', color: '#495057' },
  volProgressBg: { flex: 1, height: 8, backgroundColor: '#dee2e6', borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  volProgressFill: { height: '100%', backgroundColor: '#4DABF7' },
  modalBtn: { width: '100%', height: 55, backgroundColor: '#f1f3f5', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalBtnText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeButton: { marginTop: 10, padding: 10 },
  closeButtonText: { color: '#adb5bd', fontSize: 16, fontWeight: '600' },
  toastContainer: { position: 'absolute', top: SCREEN_HEIGHT / 2 - 25, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, zIndex: 9999 },
  toastText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
