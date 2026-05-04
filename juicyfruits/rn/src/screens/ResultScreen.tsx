import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, BackHandler, Vibration, ActivityIndicator, Animated, Platform, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import {
  TILE_ASSETS,
  ProgressService,
  AnalyticsService,
  InterstitialService,
  RewardedService,
} from '@arcade/lib-juicyfruits-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { result, stageId, stats, rewardCoins = 0, ranking } = route.params;
  const isWin = result === 'win';
  const isGlobalFirst = ranking?.clearOrdinal === 1;
  const totalRewardCoins = rewardCoins + (ranking?.bonusCoins ?? 0);
  const [isRewarded, setIsRewarded] = useState(false);
  const [displayReward, setDisplayReward] = useState(0);
  const [isRewardedLoaded, setIsRewardedLoaded] = useState(RewardedService.isReady());
  const rafIdRef = useRef<number | null>(null);

  // 보상형 광고 ready 상태 구독 — 더블업 버튼 enable/disable 동기화
  useEffect(() => RewardedService.subscribe(() => setIsRewardedLoaded(RewardedService.isReady())), []);

  // 카운트업 애니메이션 — duration 고정. delta 크기와 무관 (작은 숫자 천천히, 큰 숫자 빠르게).
  const REWARD_ANIM_DURATION_MS = 2000;
  const runCountAnimation = useCallback((start: number, end: number) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    const delta = end - start;
    if (delta <= 0) {
      setDisplayReward(end);
      return;
    }
    const startTime = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startTime) / REWARD_ANIM_DURATION_MS);
      setDisplayReward(Math.round(start + delta * t));
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  // 언마운트 시 진행 중인 RAF 정리
  useEffect(() => () => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
  }, []);

  // 최초 리워드 카운트업 — isWin/totalRewardCoins 가 정해지면 1회만 실행
  useEffect(() => {
    if (isWin && totalRewardCoins > 0) runCountAnimation(0, totalRewardCoins);
  }, [isWin, totalRewardCoins, runCountAnimation]);

  // 광고 프리로드 — 다음 노출 기회를 위해 방어적으로 한 번 더
  useEffect(() => {
    InterstitialService.prepare();
    if (isWin) RewardedService.prepare();
  }, [isWin]);

  useFocusEffect(useCallback(() => {
    const onBackPress = () => true;
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []));

  const handleWatchDoubleAd = () => {
    if (!RewardedService.isReady()) return;
    RewardedService.show({
      onEarned: async () => {
        setIsRewarded(true);
        await ProgressService.updateCoins(totalRewardCoins);
        AnalyticsService.logEvent('ad_reward', { stageId, rewardCoins: totalRewardCoins });
        runCountAnimation(totalRewardCoins, totalRewardCoins * 2);
        Vibration.vibrate(100);
      },
    });
  };

  const handleTransition = (type: 'next' | 'retry') => {
    if (!isWin && type === 'retry') {
      AnalyticsService.logEvent('game_restart', { stageId });
    }

    const nextStage = type === 'next' ? stageId + 1 : stageId;
    const goNext = () => navigation.replace('Game', { stageId: nextStage });

    // 광고는 1/2 확률로 노출. 로드 안 됐거나 운 안 좋으면 즉시 다음 스테이지로.
    if (Math.random() < 1 / 2 && InterstitialService.isReady()) {
      InterstitialService.show(goNext);
    } else {
      goNext();
    }
  };

  const topPercent = useMemo(() => {
    if (ranking) return Math.max(1, Math.round(ranking.topPercent));
    if (!isWin) return 100;
    if (!stats) return 50;
    const ratio = stats.time / stats.limit;
    return Math.max(1, Math.floor(ratio * 40 + (30 - stageId * 0.5) + Math.random() * 5));
  }, [isWin, stageId, stats, ranking]);

  const themeColor = isWin ? '#58CC02' : '#FF4B4B';
  const depthColor = isWin ? '#46A302' : '#D33131';

  return (
    <ImageBackground source={TILE_ASSETS['background']} style={styles.background} resizeMode="cover">
      <View style={styles.overlay}>
        <View style={[styles.duoModalDepth, { backgroundColor: depthColor }]}>
          <View style={[styles.duoModalInner, { borderColor: depthColor }]}>
            <Text style={[styles.title, { color: themeColor }]}>{isWin ? 'STAGE CLEAR!' : 'GAME OVER'}</Text>
            
            {isWin && (
              <View style={styles.statsContainer}>
                {isGlobalFirst && (
                  <View style={styles.firstClearBadge}>
                    <Text style={styles.firstClearText}>🏆 WORLD FIRST CLEAR!</Text>
                  </View>
                )}
                <Text style={styles.percentText}>Top {topPercent}% Player</Text>
                <Text style={styles.timeDescription}>
                  Clear Time: {stats?.time}s
                  {ranking ? `  ·  #${ranking.clearOrdinal} of ${ranking.totalClears}` : ''}
                </Text>
                <View style={styles.rewardBox}>
                  <Text style={styles.rewardLabel}>REWARD</Text>
                  <View style={styles.coinReward}>
                     <Text style={styles.coinIcon}>🪙</Text>
                     <Text style={styles.rewardValue}>{displayReward}</Text>
                  </View>
                  {isGlobalFirst && (ranking?.bonusCoins ?? 0) > 0 && (
                    <Text style={styles.firstClearBonusText}>
                      + {ranking?.bonusCoins} FIRST CLEAR BONUS
                    </Text>
                  )}
                  <View style={styles.buttonFixedWrapper}>
                    {!isRewarded && (
                      <Pressable 
                        style={({ pressed }) => [styles.doubleBtn, !isRewardedLoaded && styles.doubleBtnDisabled, isRewardedLoaded && pressed && styles.duoBtnPressed]} 
                        onPress={handleWatchDoubleAd}
                        disabled={!isRewardedLoaded}
                      >
                        <View style={[styles.doubleBtnInner, !isRewardedLoaded && styles.doubleBtnInnerDisabled]}>
                           {isRewardedLoaded ? <Text style={styles.doubleBtnText}>📺 GET 2X COINS</Text> : <ActivityIndicator size="small" color="#adb5bd" />}
                        </View>
                      </Pressable>
                    )}
                    {isRewarded && <View style={styles.rewardedBadge}><Text style={styles.rewardedBadgeText}>✨ 2X APPLIED! ✨</Text></View>}
                  </View>
                </View>
              </View>
            )}

            {!isWin && <Text style={styles.description}>Don't give up!{"\n"}Try again to beat the stage.</Text>}

            <View style={styles.buttonContainer}>
              <View style={styles.buttonFixedWrapperHalf}>
                <Pressable style={({ pressed }) => [styles.sideBtn, styles.homeBtn, pressed && styles.duoBtnPressed]} onPress={() => navigation.navigate('Home')}>
                  <View style={styles.homeBtnInner}><Text style={styles.homeBtnText}>HOME</Text></View>
                </Pressable>
              </View>
              <View style={styles.buttonFixedWrapperHalf}>
                <Pressable 
                  style={({ pressed }) => [styles.sideBtn, isWin ? styles.nextBtn : styles.retryBtn, pressed && styles.duoBtnPressed]} 
                  onPress={() => handleTransition(isWin ? 'next' : 'retry')}
                >
                  <View style={isWin ? styles.nextBtnInner : styles.retryBtnInner}>
                    <Text style={styles.primaryBtnText}>{isWin ? 'NEXT' : 'RETRY'}</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  duoModalDepth: { width: '100%', borderRadius: 32, paddingBottom: 10 },
  duoModalInner: { backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 2 },
  title: { fontSize: 34, fontFamily: 'Fredoka-Bold', marginBottom: 15 },
  statsContainer: { alignItems: 'center', marginBottom: 20, width: '100%' },
  percentText: { fontSize: 24, fontFamily: 'Fredoka-Bold', color: '#1CB0F6', marginBottom: 5 },
  timeDescription: { fontSize: 15, color: '#868e96', marginBottom: 20, fontFamily: 'Nunito-Bold' },
  rewardBox: { backgroundColor: '#F7F7F7', width: '100%', padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: '#E5E5E5', marginBottom: 15 },
  firstClearBadge: { backgroundColor: '#FFE066', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginBottom: 10, borderWidth: 2, borderColor: '#FFB400' },
  firstClearText: { fontFamily: 'Fredoka-Bold', fontSize: 14, color: '#7A4D00', letterSpacing: 0.5 },
  rewardLabel: { fontSize: 12, fontFamily: 'Nunito-Black', color: '#adb5bd', marginBottom: 5 },
  coinReward: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  coinIcon: { fontSize: 26, marginRight: 10 },
  rewardValue: { fontSize: 36, fontFamily: 'Fredoka-Bold', color: '#FFD700', minWidth: 60, textAlign: 'center' },
  firstClearBonusText: { fontSize: 18, fontFamily: 'Fredoka-Bold', color: '#FFB400', marginTop: 2, marginBottom: 8, letterSpacing: 0.3 },
  buttonFixedWrapper: { width: '100%', height: 60, justifyContent: 'center' },
  buttonFixedWrapperHalf: { flex: 1, height: 66, justifyContent: 'center' },
  doubleBtn: { width: '100%', height: 54, backgroundColor: '#D7A000', borderRadius: 18, paddingBottom: 5 },
  doubleBtnInner: { flex: 1, backgroundColor: '#FFD700', borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  doubleBtnDisabled: { backgroundColor: '#E5E5E5', paddingBottom: 0 },
  doubleBtnInnerDisabled: { backgroundColor: '#F0F0F0', borderColor: '#E5E5E5' },
  doubleBtnText: { color: '#333', fontFamily: 'Fredoka-Bold', fontSize: 15 },
  rewardedBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, alignSelf: 'center' },
  rewardedBadgeText: { color: '#1CB0F6', fontFamily: 'Nunito-Black', fontSize: 13 },
  description: { fontSize: 20, fontFamily: 'Nunito-Bold', color: '#4B4B4B', textAlign: 'center', marginBottom: 35, lineHeight: 28 },
  buttonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 10 },
  sideBtn: { height: 60, borderRadius: 20, marginHorizontal: 6, paddingBottom: 6 },
  duoBtnPressed: { paddingBottom: 0, marginTop: 6 },
  homeBtn: { backgroundColor: '#D7D7D7' },
  homeBtnInner: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E5E5' },
  homeBtnText: { color: '#AFAFAF', fontFamily: 'Fredoka-Bold', fontSize: 18 },
  nextBtn: { backgroundColor: '#46A302' },
  nextBtnInner: { flex: 1, backgroundColor: '#58CC02', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  retryBtn: { backgroundColor: '#D33131' },
  retryBtnInner: { flex: 1, backgroundColor: '#FF4B4B', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  primaryBtnText: { color: '#FFF', fontFamily: 'Fredoka-Bold', fontSize: 20 },
});
