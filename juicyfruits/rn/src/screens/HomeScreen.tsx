import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Image, Platform, Modal, Animated, Vibration, Pressable, TextInput, ScrollView, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BannerAd, BannerAdSize, useInterstitialAd } from 'react-native-google-mobile-ads';
import { RootStackParamList } from '../App';
import { 
  TILE_ASSETS, 
  ProgressService, 
  AudioService, 
  AD_UNIT_IDS,
  getStageConfig,
  AnalyticsService 
} from '@arcade/lib-juicyfruits-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// All fruits in the order they are introduced
const FRUIT_TYPES = [
  'apple', 'banana', 'cherry', 'grape', 'kiwi', 'lemon', 'orange', 
  'peach', 'pear', 'pineapple', 'strawberry', 'watermelon', 'mangosteen', 'pomegranate'
];

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [currentStage, setCurrentStage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugStage, setDebugStage] = useState('');
  const [isMuted, setIsMuted] = useState(AudioService.isMuted);
  const [volume, setVolume] = useState(AudioService.volume);
  const switchAnim = useRef(new Animated.Value(AudioService.isMuted ? 0 : 1)).current;

  // Interstitial Ad Hook
  const { isLoaded, isClosed, show, load } = useInterstitialAd(AD_UNIT_IDS.INTERSTITIAL, {
    requestNonPersonalizedAdsOnly: true,
  });

  // Get config for current stage to determine which fruits to show
  const stageConfig = getStageConfig(currentStage);
  const currentStageFruits = FRUIT_TYPES.slice(0, stageConfig?.typeCount || 3);

  // Initial load and reload on close
  useEffect(() => {
    load();
  }, [load]);

  // Navigate to game after ad is closed
  useEffect(() => {
    if (isClosed) {
      navigation.navigate('Game', { stageId: currentStage });
      load(); // Load next ad
    }
  }, [isClosed, navigation, currentStage, load]);

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

    // Log audio toggle
    AnalyticsService.logEvent('audio_toggle', { isMuted: newMuted });
  };

  const adjustVolume = async (delta: number) => {
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    await AudioService.setVolume(newVol);
    Vibration.vibrate(20);

    // Log volume change
    AnalyticsService.logEvent('volume_change', { volume: newVol });
  };

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

  const handlePlay = () => {
    if (isLoaded) {
      show();
    } else {
      navigation.navigate('Game', { stageId: currentStage });
    }
  };

  return (
    <ImageBackground source={TILE_ASSETS['background']} style={styles.background} resizeMode="cover">
      <View style={styles.fullContainer}>
        {/* Header with Safe Area Top */}
        <View style={[styles.homeHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => setShowSettings(true)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Text style={styles.title}>Juicy Fruits</Text>
            <Text style={styles.subtitle}>Sweet Fruit Triple Match</Text>
          </View>

          {/* Stage Card */}
          <View style={styles.duoCard}>
            <View style={styles.duoCardInner}>
              <Text style={styles.stageLabel}>CURRENT STAGE</Text>
              <TouchableOpacity onLongPress={() => setShowDebug(true)} activeOpacity={0.7}>
                <Text style={styles.stageValue}>{currentStage}</Text>
              </TouchableOpacity>
              
              {/* All Fruits Grid */}
              <View style={styles.fruitGrid}>
                 {currentStageFruits.map(fruit => (
                   <View key={fruit} style={styles.fruitIconWrapper}>
                     <Image source={TILE_ASSETS[fruit]} style={styles.fruitIcon} />
                   </View>
                 ))}
              </View>
            </View>
          </View>

          <View style={[styles.buttonFixedWrapper, { height: 70, paddingHorizontal: 40 }]}>
            <Pressable 
              style={({ pressed }) => [styles.duoBtnPrimary, pressed && styles.duoBtnPressed]} 
              onPress={handlePlay}
            >
              <View style={styles.duoBtnPrimaryInner}>
                <Text style={styles.duoBtnText}>PLAY</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>

        <View style={[styles.adContainer, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          <View style={styles.adWrapper}>
            <BannerAd
              unitId={AD_UNIT_IDS.BANNER}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
              onAdLoaded={() => console.log('[Home Ad] Loaded')}
              onAdFailedToLoad={(err) => console.log('[Home Ad] Error:', err)}
            />
          </View>
        </View>
      </View>

      {/* --- Overlay Popups --- */}
      {showSettings && (
        <View style={styles.absoluteOverlay}>
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
      )}

      {showDebug && (
        <View style={styles.absoluteOverlay}>
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
                autoFocus
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
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  fullContainer: { flex: 1 },
  homeHeader: { width: '100%', paddingHorizontal: 20, alignItems: 'flex-end', zIndex: 100 },
  settingsButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 32 },
  scrollContent: { alignItems: 'center', paddingBottom: 20 },
  logoContainer: { marginBottom: 20, alignItems: 'center', marginTop: 10 },
  title: { fontSize: 52, fontFamily: 'Fredoka-Bold', color: '#333', letterSpacing: -1 },
  subtitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: '#adb5bd', marginTop: -5 },
  duoCard: { width: SCREEN_WIDTH - 60, backgroundColor: '#E5E5E5', borderRadius: 24, paddingBottom: 6, marginBottom: 30 },
  duoCardInner: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#E5E5E5' },
  stageLabel: { fontSize: 14, fontFamily: 'Nunito-Black', color: '#adb5bd', marginBottom: 0 },
  stageValue: { fontSize: 72, fontFamily: 'Fredoka-Bold', color: '#1CB0F6', marginBottom: 10 },
  
  fruitGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  fruitIconWrapper: { width: 42, height: 42, backgroundColor: '#F8F9FA', borderRadius: 10, margin: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  fruitIcon: { width: 32, height: 32, borderRadius: 8 },

  buttonFixedWrapper: { width: '100%', height: 60 },
  duoBtnPrimary: { width: '100%', height: 64, backgroundColor: '#1899D6', borderRadius: 16, paddingBottom: 6 },
  duoBtnPrimaryInner: { flex: 1, backgroundColor: '#1CB0F6', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  duoBtnText: { color: '#FFF', fontSize: 24, fontFamily: 'Fredoka-Bold' },
  duoBtnSecondary: { width: '100%', height: 54, backgroundColor: '#D7D7D7', borderRadius: 16, paddingBottom: 5 },
  duoBtnSecondaryInner: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#D7D7D7' },
  duoBtnSecondaryText: { color: '#AFAFAF', fontSize: 18, fontFamily: 'Fredoka-Bold' },
  duoBtnPressed: { paddingBottom: 0, marginTop: 6 },

  adContainer: { width: '100%', alignItems: 'center', marginTop: 10 },
  adWrapper: { width: '100%', minHeight: 60, justifyContent: 'center', alignItems: 'center' },

  // Overlay Styles
  absoluteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  duoModalDepth: { width: '85%', backgroundColor: '#D7D7D7', borderRadius: 32, paddingBottom: 8 },
  duoModalInner: { backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: '#D7D7D7' },
  modalTitle: { fontSize: 24, fontFamily: 'Fredoka-Bold', marginBottom: 25, color: '#333', textAlign: 'center' },
  settingRow: { width: '100%', marginBottom: 25 },
  settingLabel: { fontSize: 16, fontFamily: 'Nunito-Black', color: '#4B4B4B', marginBottom: 10, textAlign: 'center' },
  switchTrack: { width: 56, height: 32, borderRadius: 16, padding: 2, justifyContent: 'center', alignSelf: 'center' },
  switchThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF' },
  volumeController: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  volBtn: { width: 44, height: 44, backgroundColor: '#F7F7F7', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5E5' },
  volBtnText: { fontSize: 26, fontFamily: 'Nunito-Black', color: '#4B4B4B', textAlignVertical: 'center', includeFontPadding: false, marginTop: Platform.OS === 'ios' ? -3 : 0 },
  volProgressBg: { flex: 1, height: 12, backgroundColor: '#E5E5E5', borderRadius: 6, marginHorizontal: 15, overflow: 'hidden' },
  volProgressFill: { height: '100%', backgroundColor: '#1CB0F6' },
  debugLabel: { fontFamily: 'Nunito-Bold', fontSize: 16, color: '#4B4B4B', marginBottom: 10 },
  debugInput: { width: '100%', height: 60, backgroundColor: '#F7F7F7', borderRadius: 16, borderWidth: 2, borderColor: '#E5E5E5', paddingHorizontal: 20, fontSize: 24, fontFamily: 'Fredoka-Bold', color: '#1CB0F6', textAlign: 'center', marginBottom: 25 },
});
