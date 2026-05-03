import { getUserId } from './userId';
import { ProgressService } from './progress';
import { AudioService } from './audio';

/**
 * 앱 실행 시 필요한 모든 초기화 작업을 수행합니다.
 * (User ID 생성, 진행도 로드, 오디오 설정 로드 등)
 */
export const InitializationService = {
  initialize: async () => {
    try {
      console.log('[Init] Starting app initialization...');
      
      // 1. 익명 사용자 ID 보장 (없으면 생성 및 저장)
      const userId = await getUserId();
      console.log(`[Init] User ID: ${userId}`);

      // 2. 게임 진행 데이터 로드
      await ProgressService.loadProgress();
      
      // 3. 오디오 설정 로드
      await AudioService.loadSettings();

      console.log('[Init] App initialization complete.');
      return { userId };
    } catch (e) {
      console.error('[Init] Initialization failed', e);
      throw e;
    }
  }
};
