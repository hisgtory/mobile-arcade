import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@found3_progress';

export interface GameProgress {
  highestStage: number;
  bestTimes: Record<number, number>; // stageId: seconds
}

export const ProgressService = {
  /**
   * 로컬 및 게임 키트에서 데이터를 불러옵니다.
   */
  loadProgress: async (): Promise<GameProgress> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const localProgress = data ? JSON.parse(data) : { highestStage: 1, bestTimes: {} };
      
      // TODO: 여기서 Game Center / Google Play Games 데이터와 비교 후 최신본 선택
      // if (Platform.OS === 'ios') { /* GameCenter.getScore... */ }
      
      return localProgress;
    } catch (e) {
      return { highestStage: 1, bestTimes: {} };
    }
  },

  /**
   * 새로운 진행도를 저장하고 게임 키트에 제출합니다.
   */
  saveProgress: async (stageId: number, timeUsed: number) => {
    try {
      const current = await ProgressService.loadProgress();
      
      // 진행도 갱신
      const nextStage = Math.max(current.highestStage, stageId + 1);
      const prevBest = current.bestTimes[stageId];
      const nextBest = prevBest ? Math.min(prevBest, timeUsed) : timeUsed;

      const newProgress: GameProgress = {
        highestStage: nextStage,
        bestTimes: { ...current.bestTimes, [stageId]: nextBest }
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));

      // TODO: 게임 키트(리더보드/업적)에 기록 제출
      console.log(`[GameKit] Submitting Stage ${stageId}, Time: ${timeUsed}s`);
      if (Platform.OS === 'ios') {
        // GameCenter.reportScore(timeUsed, 'leaderboard_id');
      } else {
        // PlayGames.submitScore('leaderboard_id', timeUsed);
      }
      
      return newProgress;
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }
};
