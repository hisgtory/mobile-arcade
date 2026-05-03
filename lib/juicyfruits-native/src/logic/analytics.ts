import { getUserId } from './userId';

export type GameEventType = 
  | 'app_launch'     // 앱 접속
  | 'stage_clear'    // 스테이지 클리어
  | 'stage_fail'     // 스테이지 실패
  | 'item_use'       // 아이템 사용
  | 'ad_reward'      // 광고 시청 보상 획득
  | 'shop_buy'       // 상점 아이템 구매
  | 'game_restart'   // 게임 재시작
  | 'audio_toggle'   // 오디오 온/오프
  | 'volume_change'; // 음량 조절

export interface GameEvent {
  type: GameEventType;
  stageId?: number;
  itemId?: string;
  timestamp: number;
  userId: string;
  metadata?: Record<string, any>;
}

/**
 * 게임 이벤트를 기록하는 서비스입니다.
 */
export const AnalyticsService = {
  logEvent: async (type: GameEventType, metadata?: Record<string, any>) => {
    try {
      const userId = await getUserId();
      const event: GameEvent = {
        type,
        stageId: metadata?.stageId,
        itemId: metadata?.itemId,
        timestamp: Date.now(),
        userId,
        metadata
      };

      console.log(`[Analytics] Event logged: ${type}`, event);

      /**
       * TODO: API 연동 필요
       * - 서버에 이벤트를 전송하는 로직을 여기에 구현해야 합니다.
       */
      
    } catch (e) {
      console.error('[Analytics] Failed to log event', e);
    }
  }
};
