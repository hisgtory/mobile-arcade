import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { GameInfo } from '../data/games';

interface FeaturedBannerProps {
  game: GameInfo;
  onPlay: (game: GameInfo) => void;
}

export function FeaturedBanner({ game, onPlay }: FeaturedBannerProps) {
  return (
    <Pressable style={[styles.container, { backgroundColor: game.color }]} onPress={() => onPlay(game)}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>FEATURED</Text>
      </View>
      <Text style={styles.icon}>{game.icon}</Text>
      <Text style={styles.name}>{game.name}</Text>
      <Text style={styles.description}>{game.description}</Text>
      <View style={styles.playButton}>
        <Text style={styles.playButtonText}>PLAY</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  icon: {
    fontSize: 48,
    marginTop: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  playButton: {
    marginTop: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1,
  },
});
