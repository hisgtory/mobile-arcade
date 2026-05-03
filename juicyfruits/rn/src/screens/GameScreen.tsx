import React from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  GameBoard,
  ProgressService,
  reportClear,
  getUserId,
  ReportClearError,
  TileData,
} from '@arcade/lib-juicyfruits-native';
import { RootStackParamList } from '../App';

type GameEndStats = {
  time: number;
  limit: number;
  tiles?: TileData[];
  tilesSource?: 'server' | 'local';
};

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const FIRST_CLEAR_BONUS = 500;

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
      <GameBoard
        stageId={stageId}
        onGameEnd={async (result: 'win' | 'lose', stats?: GameEndStats) => {
          let reward = 0;
          let ranking: RootStackParamList['Result']['ranking'] = undefined;

          if (result === 'win' && stats) {
            const res = await ProgressService.saveProgress(stageId, stats.time);
            reward = res?.rewardCoins ?? 0;

            // 클리어 리포트: 서버 다운/네트워크 장애여도 게임 흐름은 안 막힘.
            try {
              const userId = await getUserId();
              const clear = await reportClear({
                stage: stageId,
                durationSec: stats.time,
                userId,
                tiles: stats.tilesSource === 'local' ? stats.tiles : undefined,
              });
              const bonus = clear.clearOrdinal === 1 ? FIRST_CLEAR_BONUS : 0;
              if (bonus > 0) {
                await ProgressService.updateCoins(bonus);
              }
              ranking = {
                topPercent: clear.topPercent,
                clearOrdinal: clear.clearOrdinal,
                totalClears: clear.totalClears,
                bonusCoins: bonus,
              };
            } catch (err) {
              if (__DEV__ && err instanceof ReportClearError) {
                console.warn('[reportClear] skipped:', err.code, err.message);
              }
            }
          }

          setTimeout(() => {
            navigation.replace('Result', {
              result,
              stageId,
              score: 0,
              stats,
              rewardCoins: reward,
              ranking,
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
