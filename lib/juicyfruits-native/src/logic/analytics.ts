import { logEvent } from '../api/logEvent';
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
 *
 * 호출 규칙:
 *  - **fire-and-forget**: 호출자는 await하지 않습니다. 서버 응답을 기다리거나
 *    실패에 반응하지 않습니다. UI 흐름은 절대 분석 호출에 막히지 않아야 합니다.
 *  - PII (이름·이메일·전화번호 등)는 metadata에 절대 넣지 마세요.
 *    userId는 익명 nanoid 입니다.
 */
export const AnalyticsService = {
  logEvent: async (type: GameEventType, metadata?: Record<string, any>) => {
    try {
      const userId = await getUserId();
      const timestamp = Date.now();

      if (__DEV__) {
        console.log(`[Analytics] ${type}`, metadata ?? {});
      }

      // 와이어 바디는 평면화: { userId, event, payload, timestamp }.
      // 호출 사이트에서 넘긴 metadata 객체를 그대로 payload로 사용.
      logEvent({
        userId,
        event: type,
        payload: metadata ?? {},
        timestamp,
      });
      // 일부러 await 안 함 — 호출자에게 즉시 반환.
    } catch (e) {
      if (__DEV__) console.warn('[Analytics] log skipped:', e);
    }
  },
};

declare const __DEV__: boolean;
