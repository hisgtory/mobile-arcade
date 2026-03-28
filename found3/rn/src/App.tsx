import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { GameWebView } from './components/GameWebView';
import { TitleScreen } from './screens/TitleScreen';
import { ResultScreen } from './screens/ResultScreen';
import type { StageCompleteData } from './utils/bridge';

type Screen = 'title' | 'game' | 'result';

function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [webViewReady, setWebViewReady] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [gameResult, setGameResult] = useState<StageCompleteData | null>(null);

  const handleStageComplete = useCallback((data: StageCompleteData) => {
    setGameResult(data);
    setScreen('result');
  }, []);

  const handleNextStage = useCallback(() => {
    setCurrentStage((s) => s + 1);
    setWebViewReady(false);
    setScreen('game');
  }, []);

  const handleRetry = useCallback(() => {
    // Force WebView remount by toggling stage briefly
    const stage = currentStage;
    setCurrentStage(0);
    setWebViewReady(false);
    setTimeout(() => {
      setCurrentStage(stage);
      setScreen('game');
    }, 0);
  }, [currentStage]);

  const handleHome = useCallback(() => {
    setScreen('title');
  }, []);

  return (
    <>
      <StatusBar style={screen === 'game' ? 'light' : 'dark'} />

      {/* WebView always mounted — preloads in background */}
      <View style={{ flex: screen === 'game' ? 1 : 0, overflow: 'hidden' }}>
        <GameWebView
          stageId={currentStage}
          onReady={() => setWebViewReady(true)}
          onStageComplete={handleStageComplete}
        />
      </View>

      {screen === 'title' && (
        <TitleScreen
          onPlay={() => setScreen('game')}
          loading={!webViewReady}
        />
      )}

      {screen === 'result' && gameResult && (
        <ResultScreen
          result={gameResult}
          onNextStage={handleNextStage}
          onRetry={handleRetry}
          onHome={handleHome}
        />
      )}
    </>
  );
}

registerRootComponent(App);
export default App;
