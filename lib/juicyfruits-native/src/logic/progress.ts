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

  saveProgress: async (stageId: number, timeUsed: number) => {
    try {
      const current = await ProgressService.loadProgress();
      const nextStage = Math.max(current.highestStage, stageId + 1);
      const prevBest = current.bestTimes[stageId];
      const nextBest = prevBest ? Math.min(prevBest, timeUsed) : timeUsed;
      
      // 랜덤 코인 보상 범위를 5 ~ 10으로 축소
      const rewardCoins = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
      
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
  }
};
