import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import mobileAds from 'react-native-google-mobile-ads';
import { AudioService } from '@arcade/lib-juicyfruits-native';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: { stageId: number };
  Result: { 
    result: 'win' | 'lose'; 
    stageId: number;
    score: number;
    stats?: { time: number, limit: number };
    rewardCoins?: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  useEffect(() => {
    // 0. 애드몹 SDK 초기화
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('[AdMob] SDK Initialized', adapterStatuses);
      });

    // 1. 안드로이드 시스템 네비게이션 바 처리
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('sticky-immersive');
    }

    // 2. BGM 시작 (6곡 순환 재생)
    AudioService.startBGM();

    return () => {
      // 앱 종료 시 BGM 정지 및 리소스 해제
      AudioService.stopBGM();
    };
  }, []);

  return (
    <SafeAreaProvider>
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
