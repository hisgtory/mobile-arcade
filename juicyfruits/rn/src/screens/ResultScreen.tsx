import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, BackHandler, Vibration, ActivityIndicator, Animated, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useRewardedAd, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { RootStackParamList } from '../App';
import { 
  TILE_ASSETS, 
  AD_UNIT_IDS, 
  ProgressService 
} from '@arcade/lib-juicyfruits-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { result, stageId, stats, rewardCoins = 0 } = route.params;
  const isWin = result === 'win';
  
  const [isRewarded, setIsRewarded] = useState(false);
  const [displayReward, setDisplayReward] = useState(0); 
  const animRef = useRef<number>(0); // 현재 애니메이션 중인 값 추적용
  
  // Rewarded Ad Hook
  const { isLoaded, isEarnedReward, show, load, error } = useRewardedAd(AD_UNIT_IDS.REWARDED, {
    requestNonPersonalizedAdsOnly: true,
  });

  // 1. 숫자 카운팅 로직 (애니메이션 시작 지점과 끝 지점을 받아 처리)
  const runCountAnimation = useCallback((start: number, end: number, speed: number) => {
    let current = start;
    const step = () => {
      if (current < end) {
        current += 1;
        animRef.current = current;
        setDisplayReward(current);
        setTimeout(() => requestAnimationFrame(step), speed);
      }
    };
    requestAnimationFrame(step);
  }, []);

  // 초기 보상 애니메이션 (0 -> 랜덤값)
  useEffect(() => {
    if (isWin && rewardCoins > 0) {
      runCountAnimation(0, rewardCoins, 100);
    }
  }, [isWin, rewardCoins, runCountAnimation]);

  // 광고 로딩
  useEffect(() => {
    if (isWin && !isRewarded) {
      load();
    }
  }, [isWin, isRewarded, load]);

  // 리워드 획득 시 2배 애니메이션 (랜덤값 -> 랜덤값 * 2)
  useEffect(() => {
    if (isEarnedReward && !isRewarded) {
      const handleDouble = async () => {
        setIsRewarded(true);
        await ProgressService.updateCoins(rewardCoins); // 주신 랜덤값만큼 한 번 더 저장 (총 2배)
        runCountAnimation(rewardCoins, rewardCoins * 2, 80);
        Vibration.vibrate(100);
      };
      handleDouble();
    }
  }, [isEarnedReward, rewardCoins, isRewarded, runCountAnimation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const topPercent = useMemo(() => {
    if (!isWin) return 100;
    if (!stats) return 50;
    const ratio = stats.time / stats.limit;
    return Math.max(1, Math.floor(ratio * 40 + (30 - stageId * 0.5) + Math.random() * 5));
  }, [isWin, stageId, stats]);

  return (
    <ImageBackground source={TILE_ASSETS['background']} style={styles.background} resizeMode="cover">
      <View style={styles.overlay}>
        <View style={[styles.card, isWin ? styles.winCard : styles.loseCard]}>
          <Text style={styles.title}>{isWin ? 'STAGE CLEAR!' : 'GAME OVER'}</Text>
          
          {isWin && (
            <View style={styles.statsContainer}>
              <Text style={styles.percentText}>Top {topPercent}% Player</Text>
              <Text style={styles.timeDescription}>Clear Time: {stats?.time}s</Text>
              
              <View style={styles.rewardBox}>
                <Text style={styles.rewardLabel}>REWARD</Text>
                <View style={styles.coinReward}>
                   <Text style={styles.coinIcon}>🪙</Text>
                   <Text style={styles.rewardValue}>{displayReward}</Text>
                </View>
                
                {!isRewarded && (
                  <TouchableOpacity 
                    style={[styles.doubleBtn, !isLoaded && styles.doubleBtnDisabled]} 
                    onPress={() => isLoaded && show()}
                    disabled={!isLoaded}
                  >
                    {isLoaded ? (
                      <Text style={styles.doubleBtnText}>📺 GET 2X COINS</Text>
                    ) : (
                      <ActivityIndicator size="small" color="#adb5bd" />
                    )}
                  </TouchableOpacity>
                )}
                
                {isRewarded && (
                  <View style={styles.rewardedBadge}>
                    <Text style={styles.rewardedBadgeText}>✨ 2X APPLIED! ✨</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {!isWin && <Text style={styles.description}>Don't give up! Try again to beat the stage.</Text>}

          {/* 광고 배너 - 버튼 위로 배치 */}
          <View style={styles.adContainer}>
            <BannerAd
              unitId={AD_UNIT_IDS.BANNER}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.secondaryButtonText}>HOME</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, isWin ? styles.primaryButtonWin : styles.primaryButtonLose]}
              onPress={() => navigation.replace('Game', { stageId: isWin ? stageId + 1 : stageId })}
            >
              <Text style={styles.primaryButtonText}>{isWin ? 'NEXT STAGE' : 'RETRY'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  card: { backgroundColor: 'rgba(255,255,255,0.95)', width: '100%', borderRadius: 45, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 12 },
  winCard: { borderColor: '#4DABF7', borderWidth: 3 },
  loseCard: { borderColor: '#FF6B6B', borderWidth: 3 },
  title: { fontSize: 32, fontWeight: '900', color: '#333', marginBottom: 15 },
  statsContainer: { alignItems: 'center', marginBottom: 20, width: '100%' },
  percentText: { fontSize: 24, fontWeight: '800', color: '#4DABF7', marginBottom: 5 },
  timeDescription: { fontSize: 16, color: '#868e96', marginBottom: 15, fontWeight: '600' },
  rewardBox: { backgroundColor: '#F8F9FA', width: '100%', padding: 20, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF', marginBottom: 10 },
  rewardLabel: { fontSize: 12, fontWeight: 'bold', color: '#adb5bd', marginBottom: 5 },
  coinReward: { flexDirection: 'row', alignItems: 'center' },
  coinIcon: { fontSize: 24, marginRight: 8 },
  rewardValue: { fontSize: 32, fontWeight: '900', color: '#FFD700', minWidth: 50, textAlign: 'center' },
  doubleBtn: { marginTop: 15, backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#E6BE00', width: '100%', alignItems: 'center', height: 48, justifyContent: 'center' },
  doubleBtnDisabled: { backgroundColor: '#f1f3f5', borderColor: '#dee2e6' },
  doubleBtnText: { color: '#333', fontWeight: '900', fontSize: 14 },
  rewardedBadge: { marginTop: 15, backgroundColor: '#E3F2FD', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  rewardedBadgeText: { color: '#1976D2', fontWeight: 'bold', fontSize: 13 },
  description: { fontSize: 18, color: '#495057', textAlign: 'center', lineHeight: 24, marginBottom: 25, fontWeight: '600' },
  adContainer: { width: '100%', alignItems: 'center', marginBottom: 15 },
  buttonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  button: { flex: 1, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  primaryButtonWin: { backgroundColor: '#4DABF7' },
  primaryButtonLose: { backgroundColor: '#FF6B6B' },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#F1F3F5' },
  secondaryButtonText: { color: '#495057', fontSize: 18, fontWeight: 'bold' },
});
