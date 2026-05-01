import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
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
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // 안드로이드 시스템 네비게이션 바를 완전히 숨기고 'sticky-immersive' 모드 적용
      // 사용자가 화면 끝을 스와이프해야만 나타나고 잠시 후 다시 사라집니다.
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('sticky-immersive');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar hidden={true} />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom'
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
