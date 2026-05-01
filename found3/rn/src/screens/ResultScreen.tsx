import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { TILE_ASSETS } from '@arcade/lib-found3-native/src/assets';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { result, stageId, stats } = route.params;
  const isWin = result === 'win';

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
              <Text style={styles.description}>You completed it in {stats?.time} seconds!</Text>
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
  card: { backgroundColor: 'rgba(255,255,255,0.95)', width: '100%', borderRadius: 45, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 12 },
  winCard: { borderColor: '#4DABF7', borderWidth: 3 },
  loseCard: { borderColor: '#FF6B6B', borderWidth: 3 },
  title: { fontSize: 36, fontWeight: '900', color: '#333', marginBottom: 25 },
  statsContainer: { alignItems: 'center', marginBottom: 30 },
  percentText: { fontSize: 26, fontWeight: '800', color: '#4DABF7', marginBottom: 10 },
  description: { fontSize: 18, color: '#495057', textAlign: 'center', lineHeight: 24, marginBottom: 35, fontWeight: '600' },
  buttonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  button: { flex: 1, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  primaryButtonWin: { backgroundColor: '#4DABF7' },
  primaryButtonLose: { backgroundColor: '#FF6B6B' },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#F1F3F5' },
  secondaryButtonText: { color: '#495057', fontSize: 18, fontWeight: 'bold' },
});
