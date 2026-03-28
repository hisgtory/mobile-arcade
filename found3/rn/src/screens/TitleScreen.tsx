import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface TitleScreenProps {
  onPlay: () => void;
  loading: boolean;
}

export function TitleScreen({ onPlay, loading }: TitleScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Found 3</Text>
        <Text style={styles.subtitle}>Match 3 tiles to clear!</Text>

        <Pressable
          style={[styles.playButton, loading && styles.playButtonDisabled]}
          onPress={onPlay}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.playButtonText}>Loading...</Text>
            </View>
          ) : (
            <Text style={styles.playButtonText}>Play</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.footer}>CC BY 4.0 — hisgtory</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  playButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 180,
    alignItems: 'center',
  },
  playButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: '#9CA3AF',
  },
});
