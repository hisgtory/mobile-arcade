import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { GameInfo } from '../data/games';

interface GameCardProps {
  game: GameInfo;
  onPress: (game: GameInfo) => void;
  size?: 'small' | 'normal';
}

export function GameCard({ game, onPress, size = 'normal' }: GameCardProps) {
  const isSmall = size === 'small';

  return (
    <Pressable
      style={[styles.container, isSmall && styles.containerSmall]}
      onPress={() => onPress(game)}
    >
      <View style={[styles.iconBox, { backgroundColor: game.color + '18' }]}>
        <Text style={[styles.icon, isSmall && styles.iconSmall]}>{game.icon}</Text>
      </View>
      <Text style={[styles.name, isSmall && styles.nameSmall]} numberOfLines={1}>
        {game.name}
      </Text>
      <Text style={styles.category}>{game.category}</Text>
      {game.isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  containerSmall: {
    width: 100,
    padding: 10,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  iconSmall: {
    fontSize: 24,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  nameSmall: {
    fontSize: 12,
  },
  category: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#F43F5E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
