import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameProgress, ItemCounts, DEFAULT_ITEM_COUNTS } from '../types';

const STORAGE_KEY = '@found3_progress';

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
          coins: parsed.coins ?? 100 // 기본 100코인 지급
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
      
      // 스테이지 클리어 시 50코인 보너스
      const newProgress: GameProgress = {
        ...current,
        highestStage: nextStage,
        bestTimes: { ...current.bestTimes, [stageId]: nextBest },
        coins: current.coins + 50
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      return newProgress;
    } catch (e) {
      console.error('Failed to save progress', e);
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
