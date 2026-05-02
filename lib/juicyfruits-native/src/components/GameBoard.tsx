import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Dimensions, ImageBackground, Animated, Vibration, Platform, Image, ActivityIndicator, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { 
  TileData, 
  SlotItem, 
  GamePhase, 
  MAX_SLOT,
  UndoEntry,
  DEFAULT_ITEM_COUNTS 
} from '../types';
import { generateBoard, isTileBlocked, shuffleBoard } from '../logic/board';
import { addToSlotAndMatch, undoLastSlotItem } from '../logic/matcher';
import { getStageConfig } from '../logic/stage';
import { AudioService } from '../logic/audio';
import { ProgressService } from '../logic/progress';
import { AD_UNIT_IDS } from '../logic/ads';
import { Tile } from './Tile';
import { SlotBar } from './SlotBar';
import { ItemBar } from './ItemBar';
import { TILE_ASSETS } from '../assets';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_TILE_GAP_RATIO = 0.05;

const ITEM_PRICES = { undo: 50, shuffle: 100, magnet: 150 };

interface GameBoardProps {
  stageId: number;
  onGameEnd?: (result: 'win' | 'lose', stats?: { time: number, limit: number }) => void;
  onExit?: () => void;
  onRestart?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ stageId, onGameEnd, onExit, onRestart }) => {
  const insets = useSafeAreaInsets();
  const config = getStageConfig(stageId);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.PLAYING);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [itemCounts, setItemCounts] = useState(DEFAULT_ITEM_COUNTS);
  const [coins, setCoins] = useState(0);
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
  const boardAvailH = SCREEN_HEIGHT - 450 - insets.top - insets.bottom; 
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
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  }, [toastOpacity]);

  const handleTilePress = useCallback((tile: TileData) => {
    if (phase !== GamePhase.PLAYING || !tile) return;
    Vibration.vibrate(35);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    undoHistoryRef.current.push({ slotItem: { id: tile.id, type: tile.type }, tileData: { ...tile } });
    const nextTiles = tiles.filter(t => t && t.id !== tile.id);
    const updatedTiles = nextTiles.map(t => ({ ...t, isSelectable: !isTileBlocked(t, nextTiles) }));
    const result = addToSlotAndMatch(slots, tile, maxSlot);
    if (result.matched) {
        if (Platform.OS === 'android') Vibration.vibrate([0, 50, 40, 60, 30, 80, 20, 150]);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTiles(updatedTiles);
    setSlots(result.slotItems || []);
    if (updatedTiles.length === 0 && (result.slotItems || []).length === 0) handleGameEnd('win');
    else if ((result.slotItems || []).length >= maxSlot && !result.matched) handleGameEnd('lose');
  }, [tiles, slots, phase, handleGameEnd, maxSlot]);

  const updateItems = async (newCounts: any) => {
    setItemCounts(newCounts);
    await ProgressService.updateItemCounts(newCounts);
  };

  const buyItem = async (itemType: keyof typeof ITEM_PRICES) => {
    const price = ITEM_PRICES[itemType];
    if (coins < price) { showToast("Not enough coins!"); Vibration.vibrate([0, 30, 50, 30]); return; }
    const newCoins = await ProgressService.updateCoins(-price);
    setCoins(newCoins);
    const newCounts = { ...itemCounts, [itemType]: itemCounts[itemType] + 1 };
    await updateItems(newCounts);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleMagnet = () => {
    if (itemCounts.magnet <= 0 || phase !== GamePhase.PLAYING || tiles.length === 0) return;
    let targetType: number | null = null;
    const typeCountsOnBoard: Record<number, TileData[]> = {};
    tiles.forEach(t => { if (!typeCountsOnBoard[t.type]) typeCountsOnBoard[t.type] = []; typeCountsOnBoard[t.type].push(t); });
    for (const slotItem of slots) {
      if (typeCountsOnBoard[slotItem.type] && typeCountsOnBoard[slotItem.type].length >= (3 - slots.filter(s => s.type === slotItem.type).length)) {
        targetType = slotItem.type;
        break;
      }
    }
    if (targetType === null) {
      for (const type in typeCountsOnBoard) { if (typeCountsOnBoard[type].length >= 3) { targetType = Number(type); break; } }
    }
    if (targetType === null) { showToast("No triplets available!"); return; }
    const neededFromBoard = 3 - slots.filter(s => s.type === targetType).length;
    const targetTilesFromBoard = typeCountsOnBoard[targetType].slice(0, neededFromBoard);
    const removedIds = targetTilesFromBoard.map(t => t.id);
    const nextTiles = tiles.filter(t => !removedIds.includes(t.id));
    const updatedTiles = nextTiles.map(t => ({ ...t, isSelectable: !isTileBlocked(t, nextTiles) }));
    const nextSlots = slots.filter(s => s.type !== targetType);
    Vibration.vibrate(150);
    setTiles(updatedTiles); setSlots(nextSlots);
    updateItems({ ...itemCounts, magnet: itemCounts.magnet - 1 });
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
    const init = async () => {
      const progress = await ProgressService.loadProgress();
      setItemCounts(progress.itemCounts); setCoins(progress.coins);
      const generated = generateBoard(config);
      setTiles(generated.map(t => ({ ...t, isSelectable: !isTileBlocked(t, generated) })));
      setSlots([]); setMaxSlot(MAX_SLOT); setElapsedTime(0);
      setIsMuted(AudioService.isMuted); setVolume(AudioService.volume);
      switchAnim.setValue(AudioService.isMuted ? 0 : 1);
      undoHistoryRef.current = []; setPhase(GamePhase.PLAYING);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setElapsedTime(v => v + 1), 1000);
    };
    init();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stageId, switchAnim]);

  const handleGameEnd = useCallback((res: 'win' | 'lose') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase(res === 'win' ? GamePhase.CLEAR : GamePhase.GAMEOVER);
    onGameEnd?.(res, { time: elapsedTime, limit: config.timeLimit });
  }, [elapsedTime, config.timeLimit, onGameEnd]);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${s%60 < 10 ? '0' : ''}${s%60}`;

  return (
    <ImageBackground source={TILE_ASSETS['background']} style={styles.background} resizeMode="cover">
      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.duoModalDepth}>
            <View style={styles.duoModalInner}>
              <Text style={styles.modalTitle}>SETTINGS</Text>
              <View style={styles.settingRow}><Text style={styles.settingLabel}>MUSIC</Text><TouchableOpacity activeOpacity={0.8} onPress={toggleMusic}><View style={[styles.switchTrack, { backgroundColor: isMuted ? '#dee2e6' : '#58CC02' }]}><Animated.View style={[styles.switchThumb, { transform: [{ translateX: switchAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 26] }) }] }]} /></View></TouchableOpacity></View>
              <View style={styles.settingRow}><Text style={styles.settingLabel}>VOLUME</Text><View style={styles.volumeController}><TouchableOpacity style={styles.volBtn} onPress={() => adjustVolume(-0.1)}><Text style={styles.volBtnText}>-</Text></TouchableOpacity><View style={styles.volProgressBg}><View style={[styles.volProgressFill, { width: `${volume * 100}%` }]} /></View><TouchableOpacity style={styles.volBtn} onPress={() => adjustVolume(0.1)}><Text style={styles.volBtnText}>+</Text></TouchableOpacity></View></View>
              <View style={styles.buttonFixedWrapper}><Pressable style={({ pressed }) => [styles.duoBtnSecondary, pressed && styles.duoBtnPressed]} onPress={() => { setShowSettings(false); onRestart?.(); }}><View style={styles.duoBtnSecondaryInner}><Text style={styles.duoBtnSecondaryText}>RESTART</Text></View></Pressable></View>
              <View style={styles.buttonFixedWrapper}><Pressable style={({ pressed }) => [styles.duoBtnSecondary, pressed && styles.duoBtnPressed]} onPress={() => { setShowSettings(false); onExit?.(); }}><View style={styles.duoBtnSecondaryInner}><Text style={styles.duoBtnSecondaryText}>EXIT GAME</Text></View></Pressable></View>
              <TouchableOpacity style={styles.closeLink} onPress={() => setShowSettings(false)}><Text style={styles.closeLinkText}>CLOSE</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showShop} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.duoModalDepth, { width: '90%' }]}>
            <View style={styles.duoModalInner}>
              <Text style={styles.modalTitle}>FRUIT SHOP</Text>
              <Text style={styles.shopCoinText}>Your Coins: 🪙 {coins.toLocaleString()}</Text>
              <View style={styles.shopItemList}>
                {Object.entries(ITEM_PRICES).map(([key, price]) => (
                  <View key={key} style={styles.shopItem}>
                    <Image source={TILE_ASSETS[key === 'magnet' ? 'ui_magnet' : `item_${key}`]} style={styles.shopItemIcon} />
                    <View style={styles.shopItemInfo}><Text style={styles.shopItemName}>{key.toUpperCase()}</Text><Text style={styles.shopItemPrice}>🪙 {price}</Text></View>
                    <View style={styles.buyBtnFixedWrapper}>
                      <Pressable style={({ pressed }) => [styles.buyBtn, pressed && styles.duoBtnPressed]} onPress={() => buyItem(key as any)}>
                        <View style={styles.buyBtnInner}><Text style={styles.buyBtnText}>BUY</Text></View>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.closeLink} onPress={() => setShowShop(false)}><Text style={styles.closeLinkText}>BACK TO GAME</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toastMsg && <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}><Text style={styles.toastText}>{toastMsg}</Text></Animated.View>}

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerSide}><Text style={styles.timerText}>⏱️ {formatTime(elapsedTime)}</Text></View>
        <View style={styles.centerContainer}><Text style={styles.stageText}>{stageId}</Text></View>
        <View style={[styles.headerSide, styles.headerRight]}>
          <View style={styles.coinBadgeFixedWrapper}>
            <Pressable style={({ pressed }) => [styles.coinBadge, pressed && styles.badgePressed]} onPress={() => setShowShop(true)}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinText}>{coins.toLocaleString()}</Text>
            </Pressable>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}><Text style={styles.settingsIcon}>⚙️</Text></TouchableOpacity>
        </View>
      </View>

      <SlotBar slots={slots} maxSlot={maxSlot} />
      <View style={styles.boardContainer}>
        <View style={{ width: SCREEN_WIDTH, height: gridHeight, position: 'relative' }}>
          {[...tiles].sort((a,b)=>a.layer-b.layer).map(tile => (<Tile key={tile.id} tile={tile} size={tileSize} gap={gap} boardPad={actualBoardOffsetX} onPress={handleTilePress} />))}
        </View>
      </View>
      
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.adContainer}><BannerAd unitId={AD_UNIT_IDS.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} /></View>
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
            updateItems({ ...itemCounts, undo: itemCounts.undo - 1 });
          }} 
          onShuffle={() => {
            if (tiles.length === 0 || itemCounts.shuffle <= 0) return;
            Vibration.vibrate([0, 30, 30, 30, 30, 50]);
            setTiles(shuffleBoard(tiles).map(t => ({ ...t, isSelectable: !isTileBlocked(t, tiles) })));
            updateItems({ ...itemCounts, shuffle: itemCounts.shuffle - 1 });
          }} 
          onMagnet={handleMagnet} 
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center', marginBottom: 5 },
  headerSide: { width: 120 },
  headerRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  timerText: { fontSize: 18, fontFamily: 'Nunito-Black', color: '#333' },
  centerContainer: { flex: 1, alignItems: 'center' },
  stageText: { fontSize: 32, fontFamily: 'Fredoka-Bold', color: '#333' },
  
  coinBadgeFixedWrapper: { height: 36, justifyContent: 'center' },
  coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5A500', paddingBottom: 3, borderRadius: 15, marginRight: 10 },
  badgePressed: { paddingBottom: 0, marginTop: 3 },
  coinIcon: { fontSize: 16, marginLeft: 10, marginRight: 4, backgroundColor: '#FFD700', borderRadius: 12, padding: 2 },
  coinText: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#FFF', marginRight: 10 },

  settingsButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 24 },
  boardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomSection: { width: '100%' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  duoModalDepth: { width: '85%', backgroundColor: '#D7D7D7', borderRadius: 32, paddingBottom: 8 },
  duoModalInner: { backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: '#D7D7D7' },
  
  modalTitle: { fontSize: 24, fontFamily: 'Fredoka-Bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  
  settingRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  settingLabel: { fontSize: 16, fontFamily: 'Nunito-Black', color: '#4B4B4B' },
  switchTrack: { width: 56, height: 32, borderRadius: 16, padding: 2, justifyContent: 'center' },
  switchThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF' },
  
  volumeController: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 140 },
  volBtn: { width: 32, height: 32, backgroundColor: '#F7F7F7', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5E5' },
  volBtnText: { fontSize: 20, fontFamily: 'Nunito-Black', color: '#4B4B4B' },
  volProgressBg: { flex: 1, height: 10, backgroundColor: '#E5E5E5', borderRadius: 5, marginHorizontal: 8, overflow: 'hidden' },
  volProgressFill: { height: '100%', backgroundColor: '#1CB0F6' },
  
  buttonFixedWrapper: { width: '100%', height: 58, justifyContent: 'center' },
  duoBtnSecondary: { height: 50, backgroundColor: '#D7D7D7', borderRadius: 16, paddingBottom: 4 },
  duoBtnSecondaryInner: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5E5' },
  duoBtnSecondaryText: { color: '#AFAFAF', fontFamily: 'Fredoka-Bold', fontSize: 16 },
  duoBtnPressed: { paddingBottom: 0, marginTop: 4 },

  closeLink: { marginTop: 10, alignSelf: 'center', padding: 10 },
  closeLinkText: { color: '#adb5bd', fontFamily: 'Nunito-Bold', fontSize: 14 },
  
  toastContainer: { position: 'absolute', top: SCREEN_HEIGHT / 2, alignSelf: 'center', backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, zIndex: 9999 },
  toastText: { color: '#FFF', fontFamily: 'Nunito-Bold', fontSize: 15 },
  
  shopCoinText: { fontSize: 18, fontFamily: 'Fredoka-Bold', color: '#1CB0F6', marginBottom: 25, textAlign: 'center' },
  shopItemList: { width: '100%', marginBottom: 10 },
  shopItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 20, marginBottom: 12, borderWidth: 2, borderColor: '#E5E5E5' },
  shopItemIcon: { width: 44, height: 44 },
  shopItemInfo: { flex: 1, marginLeft: 12 },
  shopItemName: { fontSize: 16, fontFamily: 'Fredoka-Bold', color: '#333' },
  shopItemPrice: { fontSize: 13, fontFamily: 'Nunito-Bold', color: '#adb5bd' },
  
  buyBtnFixedWrapper: { width: 70, height: 44, justifyContent: 'center' },
  buyBtn: { width: 70, height: 40, backgroundColor: '#1899D6', borderRadius: 12, paddingBottom: 3 },
  buyBtnInner: { flex: 1, backgroundColor: '#1CB0F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buyBtnText: { color: '#FFF', fontFamily: 'Fredoka-Bold', fontSize: 14 },
  adContainer: { width: '100%', alignItems: 'center', marginBottom: 10 },
});
