import React, { useEffect, useCallback } from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import mobileAds from 'react-native-google-mobile-ads';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_700Bold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { AudioService, InitializationService, InterstitialService, RewardedService } from '@arcade/lib-juicyfruits-native';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';

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
  const [fontsLoaded] = useFonts({
    'Fredoka-Bold': Fredoka_700Bold,
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-Black': Nunito_900Black,
  });

  useEffect(() => {
    // 앱 초기화 서비스 실행 (익명 ID 생성 및 설정 로드)
    InitializationService.initialize().then(() => {
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
      <NavigationContainer>
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

registerRootComponent(App);
export default App;
