import React, { useEffect, useCallback, useRef } from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_700Bold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { AudioService, InitializationService, InterstitialService, RewardedService, getUserId } from '@arcade/lib-juicyfruits-native';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';

const sentryNavigationIntegration = Sentry.reactNavigationIntegration();

Sentry.init({
  dsn: 'https://08153af7b755411a25524e7725aff689@o4504756592836608.ingest.us.sentry.io/4511333234442240',
  debug: __DEV__,
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  integrations: [sentryNavigationIntegration],
});

SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  Home: undefined;
  Game: { stageId: number };
  Result: {
    result: 'win' | 'lose';
    stageId: number;
    score: number;
    stats?: { 
      time: number; 
      limit: number;
      tiles: any[];
      tilesSource: 'server' | 'local';
    };
    rewardCoins?: number;
    ranking?: {
      topPercent: number;
      clearOrdinal: number;
      totalClears: number;
      bonusCoins: number;
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [fontsLoaded] = useFonts({
    'Fredoka-Bold': Fredoka_700Bold,
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-Black': Nunito_900Black,
  });

  useEffect(() => {
    // 앱 초기화 서비스 실행 (익명 ID 생성 및 설정 로드)
    InitializationService.initialize().then(() => {
      // 익명 유저 ID 를 Sentry 이벤트에 attach — 유저별 에러 트래킹
      getUserId().then((id) => Sentry.setUser({ id })).catch(() => {});
      mobileAds().initialize().then(() => {
        // 광고 백그라운드 프리로드 — 사용자가 게임 시작 전에 미리 준비
        InterstitialService.prepare();
        RewardedService.prepare();
      });
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('sticky-immersive');
      }
      AudioService.startBGM();
    });

    return () => { AudioService.stopBGM(); };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar hidden={true} />
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          sentryNavigationIntegration.registerNavigationContainer(navigationRef);
        }}
      >
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            gestureEnabled: false
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const SentryWrappedApp = Sentry.wrap(App);
registerRootComponent(SentryWrappedApp);
export default Sentry.wrap(SentryWrappedApp);
