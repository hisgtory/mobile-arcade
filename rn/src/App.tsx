import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { getGameById } from './data/games';

export type RootStackParamList = {
  Home: undefined;
  Game: {
    gameId: string;
    gameName: string;
    webPath: string;
    hasStages?: boolean;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Home');
  const [initialGameParams, setInitialGameParams] = useState<RootStackParamList['Game'] | undefined>();

  useEffect(() => {
    AsyncStorage.getItem('@arcade/lastPlayedGame').then((gameId) => {
      if (gameId) {
        const game = getGameById(gameId);
        if (game) {
          setInitialRoute('Game');
          setInitialGameParams({
            gameId: game.id,
            gameName: game.name,
            webPath: game.webPath,
            hasStages: !!game.stageCount,
          });
        }
      }
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <ActivityIndicator size="large" color="#9CA3AF" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            initialParams={initialRoute === 'Game' ? initialGameParams : undefined}
            options={{ gestureEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

registerRootComponent(App);
export default App;
