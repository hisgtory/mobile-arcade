import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Image, Platform, Modal, Animated, Vibration, ActivityIndicator } from 'react-native';
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

  const VolumeControl = () => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>VOLUME</Text>
      <View style={styles.volumeController}>
        <TouchableOpacity style={styles.volBtn} onPress={() => adjustVolume(-0.1)}><Text style={styles.volBtnText}>-</Text></TouchableOpacity>
        <View style={styles.volProgressBg}><View style={[styles.volProgressFill, { width: `${volume * 100}%` }]} /></View>
        <TouchableOpacity style={styles.volBtn} onPress={() => adjustVolume(0.1)}><Text style={styles.volBtnText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground source={TILE_ASSETS['background']} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
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
              <VolumeControl />
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowSettings(false)}>
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </TouchableOpacity>
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

          <View style={styles.stageCard}>
            <Text style={styles.stageLabel}>CURRENT STAGE</Text>
            <Text style={styles.stageValue}>{currentStage}</Text>
            <View style={styles.previewContainer}>
               <Image source={TILE_ASSETS['apple']} style={styles.previewIcon} />
               <Image source={TILE_ASSETS['orange']} style={styles.previewIcon} />
               <Image source={TILE_ASSETS['grape']} style={styles.previewIcon} />
            </View>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={() => navigation.navigate('Game', { stageId: currentStage })}>
            <Text style={styles.playButtonText}>PLAY</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Ad (버튼 위로 이동, 하단 여백 확보) */}
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
  title: { fontSize: 56, fontWeight: '900', color: '#333', letterSpacing: -1 },
  subtitle: { fontSize: 20, color: '#adb5bd', fontWeight: '600', marginTop: -5 },
  stageCard: { backgroundColor: 'rgba(255, 255, 255, 0.95)', width: '100%', padding: 25, borderRadius: 40, alignItems: 'center', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.1, shadowRadius: 25, elevation: 8 },
  stageLabel: { fontSize: 14, fontWeight: 'bold', color: '#adb5bd', marginBottom: 10 },
  stageValue: { fontSize: 72, fontWeight: '900', color: '#4DABF7' },
  previewContainer: { flexDirection: 'row', marginTop: 15 },
  previewIcon: { width: 44, height: 44, marginHorizontal: 8 },
  playButton: { backgroundColor: '#FF6B6B', width: '100%', height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  playButtonText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 30, borderRadius: 30, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 25, color: '#333' },
  settingRow: { width: '100%', marginBottom: 25 },
  settingLabel: { fontSize: 16, fontWeight: 'bold', color: '#adb5bd', marginBottom: 10, textAlign: 'center' },
  switchTrack: { width: 56, height: 32, borderRadius: 16, padding: 2, justifyContent: 'center', alignSelf: 'center' },
  switchThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  volumeController: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  volBtn: { width: 40, height: 40, backgroundColor: '#f1f3f5', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  volBtnText: { fontSize: 24, fontWeight: 'bold', color: '#495057' },
  volProgressBg: { flex: 1, height: 10, backgroundColor: '#dee2e6', borderRadius: 5, marginHorizontal: 15, overflow: 'hidden' },
  volProgressFill: { height: '100%', backgroundColor: '#4DABF7' },
  closeButton: { marginTop: 10, padding: 10 },
  closeButtonText: { color: '#adb5bd', fontSize: 16, fontWeight: '600' },
  adContainer: { width: '100%', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 20 : 10, marginTop: 10 },
});
