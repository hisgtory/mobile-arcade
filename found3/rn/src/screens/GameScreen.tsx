import React from 'react';
import { StyleSheet, View, Platform, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { GameBoard } from '@arcade/lib-found3-native';
import { ProgressService } from '@arcade/lib-found3-native/src/logic/progress';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ route, navigation }: Props) {
  const { stageId } = route.params;

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  return (
    <View style={styles.container}>
      <SafeAreaView 
        style={styles.safeArea}
        edges={Platform.OS === 'ios' ? ['top', 'bottom', 'left', 'right'] : ['bottom', 'left', 'right']}
      >
        <GameBoard 
          stageId={stageId} 
          onGameEnd={async (result, stats) => {
            let reward = 0;
            if (result === 'win' && stats) {
              const res = await ProgressService.saveProgress(stageId, stats.time);
              reward = res?.rewardCoins ?? 0;
            }
            
            setTimeout(() => {
              navigation.replace('Result', { 
                result, 
                stageId,
                score: 0,
                stats,
                rewardCoins: reward
              });
            }, 500);
          }} 
          onExit={() => navigation.navigate('Home')}
          onRestart={() => navigation.replace('Game', { stageId })}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
});
