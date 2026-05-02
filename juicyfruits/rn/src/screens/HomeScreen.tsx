import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Image, Platform, Modal, Animated, Vibration, Pressable, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { RootStackParamList } from '../App';
import { 
  TILE_ASSETS, 
  ProgressService, 
  AudioService, 
  AD_UNIT_IDS 
} from '@arcade/lib-juicyfruits-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [currentStage, setCurrentStage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showDebug, setShowDebug] = useState(false); // 디버그 모달
  const [debugStage, setDebugStage] = useState('');
  const [isMuted, setIsMuted] = useState(AudioService.isMuted);
  const [volume, setVolume] = useState(AudioService.volume);
  const switchAnim = useRef(new Animated.Value(AudioService.isMuted ? 0 : 1)).current;

  useFocusEffect(
    useCallback(() => {
      ProgressService.loadProgress().then(p => setCurrentStage(p.highestStage));
      setIsMuted(AudioService.isMuted);
      setVolume(AudioService.volume);
      switchAnim.setValue(AudioService.isMuted ? 0 : 1);
    }, [switchAnim])
  );

  const toggleMusic = async () => {
    await AudioService.toggleMute();
    const newMuted = AudioService.isMuted;
    setIsMuted(newMuted);
    Animated.timing(switchAnim, { toValue: newMuted ? 0 : 1, duration: 200, useNativeDriver: false }).start();
    Vibration.vibrate(30);
  };

  const adjustVolume = async (delta: number) => {
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    await AudioService.setVolume(newVol);
    Vibration.vibrate(20);
  };

  // 디버그 스테이지 변경 함수
  const handleSetStage = async () => {
    const stageNum = parseInt(debugStage, 10);
    if (!isNaN(stageNum) && stageNum > 0) {
      await ProgressService.setHighestStage(stageNum);
      setCurrentStage(stageNum);
      setShowDebug(false);
      setDebugStage('');
      Vibration.vibrate(100);
    }
  };

  return (
    <ImageBackground source={TILE_ASSETS['background']} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        {/* Settings Modal */}
        <Modal visible={showSettings} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.duoModalDepth}>
              <View style={styles.duoModalInner}>
                <Text style={styles.modalTitle}>SETTINGS</Text>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>MUSIC</Text>
                  <TouchableOpacity activeOpacity={0.8} onPress={toggleMusic}>
                    <View style={[styles.switchTrack, { backgroundColor: isMuted ? '#dee2e6' : '#58CC02' }]}>
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
                <View style={styles.buttonFixedWrapper}>
                  <Pressable style={({ pressed }) => [styles.duoBtnSecondary, pressed && styles.duoBtnPressed]} onPress={() => setShowSettings(false)}>
                    <View style={styles.duoBtnSecondaryInner}><Text style={styles.duoBtnSecondaryText}>CLOSE</Text></View>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Debug Modal (Hidden feature) */}
        <Modal visible={showDebug} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.duoModalDepth, { width: '80%' }]}>
              <View style={styles.duoModalInner}>
                <Text style={styles.modalTitle}>DEBUG TOOL</Text>
                <Text style={styles.debugLabel}>Jump to Stage:</Text>
                <TextInput 
                  style={styles.debugInput}
                  keyboardType="number-pad"
                  value={debugStage}
                  onChangeText={setDebugStage}
                  placeholder="Enter Stage #"
                />
                <View style={styles.buttonFixedWrapper}>
                  <Pressable style={({ pressed }) => [styles.duoBtnPrimary, pressed && styles.duoBtnPressed]} onPress={handleSetStage}>
                    <View style={styles.duoBtnPrimaryInner}><Text style={styles.duoBtnText}>APPLY</Text></View>
                  </Pressable>
                </View>
                <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setShowDebug(false)}>
                   <Text style={{ color: '#adb5bd', fontFamily: 'Nunito-Bold' }}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.homeHeader}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.title}>Juicy Fruits</Text>
            <Text style={styles.subtitle}>Sweet Fruit Triple Match</Text>
          </View>

          {/* Stage Card - Long press stage number to open debug tool */}
          <View style={styles.duoCard}>
            <View style={styles.duoCardInner}>
              <Text style={styles.stageLabel}>CURRENT STAGE</Text>
              <TouchableOpacity onLongPress={() => setShowDebug(true)} activeOpacity={0.7}>
                <Text style={styles.stageValue}>{currentStage}</Text>
              </TouchableOpacity>
              <View style={styles.previewContainer}>
                 <Image source={TILE_ASSETS['apple']} style={styles.previewIcon} />
                 <Image source={TILE_ASSETS['orange']} style={styles.previewIcon} />
                 <Image source={TILE_ASSETS['grape']} style={styles.previewIcon} />
              </View>
            </View>
          </View>

          <View style={[styles.buttonFixedWrapper, { height: 70 }]}>
            <Pressable 
              style={({ pressed }) => [styles.duoBtnPrimary, pressed && styles.duoBtnPressed]} 
              onPress={() => navigation.navigate('Game', { stageId: currentStage })}
            >
              <View style={styles.duoBtnPrimaryInner}>
                <Text style={styles.duoBtnText}>PLAY</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.adContainer}>
          <BannerAd
            unitId={AD_UNIT_IDS.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  homeHeader: { width: '100%', paddingHorizontal: 20, paddingTop: 10, alignItems: 'flex-end' },
  settingsButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 32 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, marginTop: -30 },
  logoContainer: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 52, fontFamily: 'Fredoka-Bold', color: '#333', letterSpacing: -1 },
  subtitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: '#adb5bd', marginTop: -5 },
  duoCard: { width: '100%', backgroundColor: '#E5E5E5', borderRadius: 24, paddingBottom: 6, marginBottom: 40 },
  duoCardInner: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, alignItems: 'center', borderWidth: 2, borderColor: '#E5E5E5' },
  stageLabel: { fontSize: 14, fontFamily: 'Nunito-Black', color: '#adb5bd', marginBottom: 5 },
  stageValue: { fontSize: 84, fontFamily: 'Fredoka-Bold', color: '#1CB0F6' },
  previewContainer: { flexDirection: 'row', marginTop: 10 },
  previewIcon: { width: 40, height: 44, marginHorizontal: 8 },
  buttonFixedWrapper: { width: '100%', height: 60 },
  duoBtnPrimary: { width: '100%', height: 64, backgroundColor: '#1899D6', borderRadius: 16, paddingBottom: 6 },
  duoBtnPrimaryInner: { flex: 1, backgroundColor: '#1CB0F6', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  duoBtnText: { color: '#FFF', fontSize: 24, fontFamily: 'Fredoka-Bold' },
  duoBtnSecondary: { width: '100%', height: 54, backgroundColor: '#D7D7D7', borderRadius: 16, paddingBottom: 5 },
  duoBtnSecondaryInner: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#D7D7D7' },
  duoBtnSecondaryText: { color: '#AFAFAF', fontSize: 18, fontFamily: 'Fredoka-Bold' },
  duoBtnPressed: { paddingBottom: 0, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  duoModalDepth: { width: '85%', backgroundColor: '#D7D7D7', borderRadius: 32, paddingBottom: 8 },
  duoModalInner: { backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: '#D7D7D7' },
  modalTitle: { fontSize: 24, fontFamily: 'Fredoka-Bold', marginBottom: 25, color: '#333', textAlign: 'center' },
  settingRow: { width: '100%', marginBottom: 25 },
  settingLabel: { fontSize: 16, fontFamily: 'Nunito-Black', color: '#4B4B4B', marginBottom: 10, textAlign: 'center' },
  switchTrack: { width: 56, height: 32, borderRadius: 16, padding: 2, justifyContent: 'center', alignSelf: 'center' },
  switchThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF' },
  volumeController: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  volBtn: { width: 40, height: 40, backgroundColor: '#F7F7F7', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5E5' },
  volBtnText: { fontSize: 24, fontFamily: 'Nunito-Black', color: '#4B4B4B' },
  volProgressBg: { flex: 1, height: 12, backgroundColor: '#E5E5E5', borderRadius: 6, marginHorizontal: 15, overflow: 'hidden' },
  volProgressFill: { height: '100%', backgroundColor: '#1CB0F6' },
  adContainer: { width: '100%', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 20 : 10, marginTop: 10 },
  // Debug Styles
  debugLabel: { fontFamily: 'Nunito-Bold', fontSize: 16, color: '#4B4B4B', marginBottom: 10 },
  debugInput: { width: '100%', height: 60, backgroundColor: '#F7F7F7', borderRadius: 16, borderWidth: 2, borderColor: '#E5E5E5', paddingHorizontal: 20, fontSize: 24, fontFamily: 'Fredoka-Bold', color: '#1CB0F6', textAlign: 'center', marginBottom: 25 },
});
