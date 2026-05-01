import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBoard } from '@arcade/lib-found3-native';
import { ProgressService } from '@arcade/lib-found3-native/src/logic/progress';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ route, navigation }: Props) {
  const { stageId } = route.params;

  return (
    <View style={styles.container}>
      <SafeAreaView 
        style={styles.safeArea}
        edges={Platform.OS === 'ios' ? ['top', 'bottom', 'left', 'right'] : ['bottom', 'left', 'right']}
      >
        <GameBoard 
          stageId={stageId} 
          onGameEnd={(result, stats) => {
            if (result === 'win' && stats) {
              ProgressService.saveProgress(stageId, stats.time);
            }
            
            setTimeout(() => {
              navigation.replace('Result', { 
                result, 
                stageId,
                score: 0,
                stats
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
});
