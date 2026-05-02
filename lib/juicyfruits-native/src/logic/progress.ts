import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameProgress, ItemCounts, DEFAULT_ITEM_COUNTS } from '../types';

const STORAGE_KEY = '@juicyfruits_progress';

export const ProgressService = {
  loadProgress: async (): Promise<GameProgress> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          highestStage: parsed.highestStage ?? 1,
          bestTimes: parsed.bestTimes ?? {},
          itemCounts: parsed.itemCounts ?? { ...DEFAULT_ITEM_COUNTS },
          coins: parsed.coins ?? 100 
        };
      }
      return { 
        highestStage: 1, 
        bestTimes: {}, 
        itemCounts: { ...DEFAULT_ITEM_COUNTS },
        coins: 100
      };
    } catch (e) {
      return { highestStage: 1, bestTimes: {}, itemCounts: { ...DEFAULT_ITEM_COUNTS }, coins: 100 };
    }
  },

  /**
   * 새로운 진행도를 저장하고 순차 검증 로직 기반의 보상을 반환합니다.
   */
  saveProgress: async (stageId: number, timeUsed: number) => {
    try {
      const current = await ProgressService.loadProgress();
      const nextStage = Math.max(current.highestStage, stageId + 1);
      const prevBest = current.bestTimes[stageId];
      const nextBest = prevBest ? Math.min(prevBest, timeUsed) : timeUsed;
      
      /**
       * [순차 검증형 보상 로직]
       * - 시작: 5골드
       * - 각 단계 성공 확률: 73.6% (0.736)
       * - 15단계를 모두 통과하여 20골드에 도달할 확률: 0.736^15 ≒ 0.01 (1/100)
       */
      let rewardCoins = 5;
      const passProbability = 0.736;
      
      while (rewardCoins < 20) {
        if (Math.random() < passProbability) {
          rewardCoins++;
        } else {
          break; // 검증 실패 시 현재 값에서 멈춤
        }
      }
      
      const newProgress: GameProgress = {
        ...current,
        highestStage: nextStage,
        bestTimes: { ...current.bestTimes, [stageId]: nextBest },
        coins: current.coins + rewardCoins
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      return { newProgress, rewardCoins };
    } catch (e) {
      console.error('Failed to save progress', e);
      return null;
    }
  },

  updateItemCounts: async (newCounts: ItemCounts) => {
    try {
      const current = await ProgressService.loadProgress();
      const newProgress: GameProgress = { ...current, itemCounts: newCounts };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    } catch (e) {
      console.error('Failed to update item counts', e);
    }
  },

  updateCoins: async (delta: number) => {
    try {
      const current = await ProgressService.loadProgress();
      const newProgress: GameProgress = { ...current, coins: Math.max(0, current.coins + delta) };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      return newProgress.coins;
    } catch (e) {
      console.error('Failed to update coins', e);
      return 0;
    }
  },

  setHighestStage: async (stage: number) => {
    try {
      const current = await ProgressService.loadProgress();
      const newProgress: GameProgress = { ...current, highestStage: stage };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      return newProgress;
    } catch (e) {
      console.error('Failed to set highest stage', e);
    }
  }
};
