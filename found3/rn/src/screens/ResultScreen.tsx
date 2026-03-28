import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { StageCompleteData } from '../utils/bridge';

interface ResultScreenProps {
  result: StageCompleteData;
  onNextStage: () => void;
  onRetry: () => void;
  onHome: () => void;
}

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}:${rem.toString().padStart(2, '0')}`;
}

export function ResultScreen({ result, onNextStage, onRetry, onHome }: ResultScreenProps) {
  const cleared = result.cleared;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, cleared ? styles.titleClear : styles.titleOver]}>
          {cleared ? 'Stage Clear!' : 'Game Over'}
        </Text>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Stage</Text>
            <Text style={styles.statValue}>{result.stage}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{result.score.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(result.elapsedMs)}</Text>
          </View>
        </View>

        {/* Ad placeholder */}
        <View style={styles.adPlaceholder}>
          <Text style={styles.adText}>AD SPACE</Text>
        </View>

        <View style={styles.buttons}>
          {cleared ? (
            <Pressable style={[styles.button, styles.primaryButton]} onPress={onNextStage}>
              <Text style={styles.primaryButtonText}>Next Stage</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.button, styles.primaryButton]} onPress={onRetry}>
              <Text style={styles.primaryButtonText}>Retry</Text>
            </Pressable>
          )}

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={onHome}>
            <Text style={styles.secondaryButtonText}>Home</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '85%',
    gap: 24,
  },
  title: {
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
