import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameWebView } from '../components/GameWebView';
import type { StageCompleteData } from '../utils/bridge';
import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

type Screen = 'loading' | 'playing' | 'result';

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}:${rem.toString().padStart(2, '0')}`;
}

export function GameScreen({ route, navigation }: Props) {
  const { gameId, gameName, webPath } = route.params;
  const insets = useSafeAreaInsets();

  const [screen, setScreen] = useState<Screen>('loading');
  const [currentStage, setCurrentStage] = useState(0);
  const [gameResult, setGameResult] = useState<StageCompleteData | null>(null);

  // Load saved stage from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(`@arcade/${gameId}/gameState`).then((raw) => {
      try {
        if (raw) {
          const state = JSON.parse(raw);
          setCurrentStage(typeof state?.currentStage === 'number' ? state.currentStage : 1);
        } else {
          setCurrentStage(1);
        }
      } catch {
        console.warn('Failed to parse stored game state for', gameId);
        AsyncStorage.removeItem(`@arcade/${gameId}/gameState`).catch(() => {});
        setCurrentStage(1);
      }
      setScreen('playing');
    });
  }, [gameId]);

  const handleStageComplete = useCallback((data: StageCompleteData) => {
    setGameResult(data);
    setScreen('result');
  }, []);

  const handleNextStage = useCallback(() => {
    setCurrentStage((s) => s + 1);
    setScreen('playing');
  }, []);

  const handleRetry = useCallback(() => {
    const stage = currentStage;
    setCurrentStage(0);
    setTimeout(() => {
      setCurrentStage(stage);
      setScreen('playing');
    }, 0);
  }, [currentStage]);

  const handleHome = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── Header (kocket style) ─── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.headerBackButton} onPress={handleHome}>
            <View style={styles.headerBackArrow}>
              <Text style={styles.headerBackIcon}>{'‹'}</Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {gameName}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* ─── Content ─── */}
      {screen === 'loading' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9CA3AF" />
        </View>
      )}

      {screen === 'playing' && currentStage > 0 && (
        <View style={{ flex: 1 }}>
          <GameWebView
            gameId={gameId}
            webPath={webPath}
            stageId={currentStage}
            onStageComplete={handleStageComplete}
          />
        </View>
      )}

      {screen === 'result' && gameResult && (
        <View style={styles.resultContainer}>
          <View style={styles.resultContent}>
            <Text
              style={[
                styles.resultTitle,
                gameResult.cleared ? styles.titleClear : styles.titleOver,
              ]}
            >
              {gameResult.cleared ? 'Stage Clear!' : 'Game Over'}
            </Text>

            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Stage</Text>
                <Text style={styles.statValue}>{gameResult.stage}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Score</Text>
                <Text style={styles.statValue}>
                  {(gameResult.score ?? 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>
                  {formatTime(gameResult.elapsedMs ?? 0)}
                </Text>
              </View>
            </View>

            {/* Ad placeholder */}
            <View style={styles.adPlaceholder}>
              <Text style={styles.adText}>AD SPACE</Text>
            </View>

            <View style={styles.buttons}>
              {gameResult.cleared ? (
                <Pressable
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleNextStage}
                >
                  <Text style={styles.primaryButtonText}>Next Stage</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleRetry}
                >
                  <Text style={styles.primaryButtonText}>Retry</Text>
                </Pressable>
              )}

              <Pressable style={[styles.button, styles.secondaryButton]} onPress={handleHome}>
                <Text style={styles.secondaryButtonText}>Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // ─── Header (kocket pattern) ───
  header: {
    width: '100%',
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  headerLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    height: '100%',
    justifyContent: 'center',
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    height: '100%',
    justifyContent: 'center',
  },
  headerBackButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackIcon: {
    fontSize: 24,
    fontWeight: '400',
    color: '#111827',
    marginTop: -1,
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#030712',
    maxWidth: '70%',
  },

  // ─── Loading ───
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Result ───
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    alignItems: 'center',
    width: '85%',
    gap: 24,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '800',
  },
  titleClear: {
    color: '#059669',
  },
  titleOver: {
    color: '#DC2626',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  adPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
