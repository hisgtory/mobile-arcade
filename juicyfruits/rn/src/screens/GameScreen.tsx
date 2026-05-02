import React from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { GameBoard, ProgressService } from '@arcade/lib-juicyfruits-native';
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
      {/* 
         ImageBackground가 전체 화면을 채울 수 있도록 
         여기서 SafeAreaView로 감싸지 않고 GameBoard 내부에서 padding으로 처리합니다.
      */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
