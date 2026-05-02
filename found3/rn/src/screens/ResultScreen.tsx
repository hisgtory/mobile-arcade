import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Image, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { TILE_ASSETS } from '@arcade/lib-found3-native/src/assets';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { result, stageId, stats, rewardCoins } = route.params;
  const isWin = result === 'win';

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const topPercent = useMemo(() => {
    if (!isWin) return 100;
    if (!stats) return Math.max(1, Math.floor(100 - (stageId * 5) - Math.random() * 10));
    const ratio = stats.time / stats.limit;
    const basePercent = ratio * 40; 
    const stageBonus = Math.max(0, 30 - stageId * 2); 
    const randomFactor = Math.random() * 5;
    return Math.max(1, Math.floor(basePercent + stageBonus + randomFactor));
  }, [isWin, stageId, stats]);

  return (
    <ImageBackground source={TILE_ASSETS['background']} style={styles.container} resizeMode="cover">
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
                   <Text style={styles.rewardValue}>+{rewardCoins}</Text>
                </View>
              </View>
            </View>
          )}

          {!isWin && (
            <Text style={styles.description}>Don't give up! Try again to beat the stage.</Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.secondaryButtonText}>HOME</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, isWin ? styles.primaryButtonWin : styles.primaryButtonLose]}
              onPress={() => {
                const nextStage = isWin ? stageId + 1 : stageId;
                navigation.replace('Game', { stageId: nextStage });
              }}
            >
              <Text style={styles.primaryButtonText}>
                {isWin ? 'NEXT STAGE' : 'RETRY'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  card: { backgroundColor: 'rgba(255,255,255,0.95)', width: '100%', borderRadius: 45, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 12 },
  winCard: { borderColor: '#4DABF7', borderWidth: 3 },
  loseCard: { borderColor: '#FF6B6B', borderWidth: 3 },
  title: { fontSize: 32, fontWeight: '900', color: '#333', marginBottom: 20 },
  statsContainer: { alignItems: 'center', marginBottom: 25, width: '100%' },
  percentText: { fontSize: 24, fontWeight: '800', color: '#4DABF7', marginBottom: 5 },
  timeDescription: { fontSize: 16, color: '#868e96', marginBottom: 20, fontWeight: '600' },
  rewardBox: { backgroundColor: '#F8F9FA', width: '100%', padding: 20, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF' },
  rewardLabel: { fontSize: 12, fontWeight: 'bold', color: '#adb5bd', marginBottom: 5 },
  coinReward: { flexDirection: 'row', alignItems: 'center' },
  coinIcon: { fontSize: 24, marginRight: 8 },
  rewardValue: { fontSize: 28, fontWeight: '900', color: '#FFD700' },
  description: { fontSize: 18, color: '#495057', textAlign: 'center', lineHeight: 24, marginBottom: 35, fontWeight: '600' },
  buttonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  button: { flex: 1, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  primaryButtonWin: { backgroundColor: '#4DABF7' },
  primaryButtonLose: { backgroundColor: '#FF6B6B' },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#F1F3F5' },
  secondaryButtonText: { color: '#495057', fontSize: 18, fontWeight: 'bold' },
});
