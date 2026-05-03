import { Platform } from 'react-native';
import { InterstitialAd, RewardedAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';

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

/**
 * 전면 광고 인스턴스 (수동 관리용)
 */
export const createInterstitial = () => {
  return InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
    keywords: ['games', 'puzzle', 'fruits'],
  });
};

/**
 * 보상형 광고 인스턴스 (수동 관리용)
 */
export const createRewarded = () => {
  return RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED, {
    keywords: ['games', 'puzzle', 'fruits'],
  });
};

// 기본 인스턴스 (호환성 유지)
export const interstitial = createInterstitial();
export const rewarded = createRewarded();
