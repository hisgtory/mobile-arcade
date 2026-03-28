import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FeaturedBanner } from '../components/FeaturedBanner';
import { GameCard } from '../components/GameCard';
import {
  GAMES,
  CATEGORIES,
  getFeaturedGame,
  getNewGames,
  getGamesByCategory,
} from '../data/games';
import type { GameInfo, GameCategory } from '../data/games';
import type { RootStackParamList } from '../App';

interface HomeScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all'>('all');

  const featured = getFeaturedGame();
  const newGames = getNewGames();
  const filteredGames = getGamesByCategory(selectedCategory);

  const handlePlay = useCallback(
    (game: GameInfo) => {
      navigation.navigate('Game', {
        gameId: game.id,
        gameName: game.name,
        webPath: game.webPath,
      });
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arcade</Text>
        <Text style={styles.headerSubtitle}>{GAMES.length} games</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Banner */}
        {featured && <FeaturedBanner game={featured} onPlay={handlePlay} />}

        {/* New Games */}
        {newGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New Games</Text>
            <FlatList
              data={newGames}
              keyExtractor={(g) => g.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <GameCard game={item} onPress={handlePlay} size="small" />
              )}
            />
          </View>
        )}

        {/* All Games */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Games</Text>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                style={[
                  styles.categoryTab,
                  selectedCategory === cat.key && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === cat.key && styles.categoryTabTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Game Grid */}
          <View style={styles.gameGrid}>
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} onPress={handlePlay} />
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 24,
    paddingBottom: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryTabs: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryTabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
});
