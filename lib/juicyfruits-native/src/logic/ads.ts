import { Platform } from 'react-native';
import { InterstitialAd, RewardedAd, TestIds } from 'react-native-google-mobile-ads';

/**
 * 광고 단위 ID 관리
 * 로컬 개발 환경(__DEV__)에서는 안전을 위해 항상 TestIds를 사용합니다.
 * 실제 폰트/레이아웃 테스트 시 "Test Ad" 배너가 보여야 정상입니다.
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
        android: 'ca-app-pub-6129946475801358/8287120522', 
        ios: TestIds.INTERSTITIAL, 
      }) || TestIds.INTERSTITIAL,

  REWARDED: __DEV__
    ? TestIds.REWARDED
    : Platform.select({
        android: 'ca-app-pub-6129946475801358/1209516797', 
        ios: TestIds.REWARDED, 
      }) || TestIds.REWARDED,
};

/**
 * 전면 광고 인스턴스
 */
export const interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
  keywords: ['games', 'puzzle', 'fruits'],
});

/**
 * 보상형 광고 인스턴스
 */
export const rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED, {
  keywords: ['games', 'puzzle', 'fruits'],
});
