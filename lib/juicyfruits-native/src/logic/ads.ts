import { Platform } from 'react-native';
import {
  InterstitialAd,
  RewardedAd,
  TestIds,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

/**
 * 광고 단위 ID 관리
 * 로컬 개발 환경(__DEV__)에서는 안전을 위해 항상 TestIds를 사용합니다.
 */
export const AD_UNIT_IDS = {
  BANNER: __DEV__
    ? TestIds.BANNER
    : Platform.select({
        android: 'ca-app-pub-6129946475801358/8287120522',
        ios: 'ca-app-pub-6129946475801358/3275390436',
      }) || TestIds.BANNER,

  INTERSTITIAL: __DEV__
    ? TestIds.INTERSTITIAL
    : Platform.select({
        android: 'ca-app-pub-6129946475801358/6229601695',
        ios: 'ca-app-pub-6129946475801358/6303729675',
      }) || TestIds.INTERSTITIAL,

  REWARDED: __DEV__
    ? TestIds.REWARDED
    : Platform.select({
        android: 'ca-app-pub-6129946475801358/1209516797',
        ios: TestIds.REWARDED,
      }) || TestIds.REWARDED,
};

const AD_REQUEST_OPTIONS = {
  keywords: ['games', 'puzzle', 'fruits'],
  requestNonPersonalizedAdsOnly: true,
};

// === 인터스티셜 싱글톤 서비스 ===
// 화면 전체에서 단일 인스턴스 공유. 앱 시작 시 prepare() 호출 → 항상 ready 상태 유지.
const interstitialAd = InterstitialAd.createForAdRequest(
  AD_UNIT_IDS.INTERSTITIAL,
  AD_REQUEST_OPTIONS
);

let interstitialReady = false;
let interstitialLoading = false;
let interstitialOnClosed: (() => void) | null = null;

interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
  interstitialReady = true;
  interstitialLoading = false;
});
interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
  interstitialReady = false;
  interstitialLoading = false;
});
interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
  interstitialReady = false;
  const cb = interstitialOnClosed;
  interstitialOnClosed = null;
  cb?.();
  // 다음 광고 즉시 프리로드
  InterstitialService.prepare();
});

export const InterstitialService = {
  prepare: () => {
    if (interstitialReady || interstitialLoading) return;
    interstitialLoading = true;
    interstitialAd.load();
  },
  isReady: () => interstitialReady,
  /**
   * 광고 노출. 로드 안 된 경우 onClosed 즉시 호출 (스킵).
   */
  show: (onClosed?: () => void) => {
    if (!interstitialReady) {
      InterstitialService.prepare();
      onClosed?.();
      return false;
    }
    interstitialOnClosed = onClosed ?? null;
    interstitialAd.show();
    return true;
  },
};

// === 보상형 광고 싱글톤 서비스 ===
const rewardedAd = RewardedAd.createForAdRequest(
  AD_UNIT_IDS.REWARDED,
  AD_REQUEST_OPTIONS
);

let rewardedReady = false;
let rewardedLoading = false;
let rewardedOnEarned: (() => void) | null = null;
let rewardedOnClosed: (() => void) | null = null;
const rewardedReadyListeners = new Set<() => void>();

const notifyRewardedReady = () => {
  rewardedReadyListeners.forEach((l) => l());
};

rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
  rewardedReady = true;
  rewardedLoading = false;
  notifyRewardedReady();
});
rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
  rewardedReady = false;
  rewardedLoading = false;
  notifyRewardedReady();
});
rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
  const cb = rewardedOnEarned;
  rewardedOnEarned = null;
  cb?.();
});
rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
  rewardedReady = false;
  notifyRewardedReady();
  const cb = rewardedOnClosed;
  rewardedOnClosed = null;
  cb?.();
  RewardedService.prepare();
});

export const RewardedService = {
  prepare: () => {
    if (rewardedReady || rewardedLoading) return;
    rewardedLoading = true;
    rewardedAd.load();
  },
  isReady: () => rewardedReady,
  subscribe: (listener: () => void) => {
    rewardedReadyListeners.add(listener);
    return () => {
      rewardedReadyListeners.delete(listener);
    };
  },
  show: (callbacks?: { onEarned?: () => void; onClosed?: () => void }) => {
    if (!rewardedReady) return false;
    rewardedOnEarned = callbacks?.onEarned ?? null;
    rewardedOnClosed = callbacks?.onClosed ?? null;
    rewardedAd.show();
    return true;
  },
};
