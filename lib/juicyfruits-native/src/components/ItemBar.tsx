import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { TILE_ASSETS } from '../assets';

interface ItemBarProps {
  onUndo: () => void;
  onShuffle: () => void;
  onMagnet: () => void;
  itemCounts: {
    undo: number;
    shuffle: number;
    magnet: number;
  };
}

export const ItemBar: React.FC<ItemBarProps> = ({ 
  onUndo, 
  onShuffle, 
  onMagnet, 
  itemCounts 
}) => {
  return (
    <View style={styles.container}>
      {/* UNDO ITEM */}
      <View style={styles.itemWrapper}>
        <Pressable onPress={onUndo} style={styles.itemButton}>
          {({ pressed }) => (
            <View style={styles.iconCircle}>
              <Image 
                source={pressed ? TILE_ASSETS['item_undo_pressed'] : TILE_ASSETS['item_undo']} 
                style={styles.itemIcon} 
                resizeMode="cover" 
              />
            </View>
          )}
        </Pressable>
        <Text style={styles.itemLabel}>UNDO</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{itemCounts.undo}</Text></View>
      </View>

      {/* SHUFFLE ITEM */}
      <View style={styles.itemWrapper}>
        <Pressable onPress={onShuffle} style={styles.itemButton}>
          {({ pressed }) => (
            <View style={styles.iconCircle}>
              <Image 
                source={pressed ? TILE_ASSETS['item_shuffle_pressed'] : TILE_ASSETS['item_shuffle']} 
                style={styles.itemIcon} 
                resizeMode="cover" 
              />
            </View>
          )}
        </Pressable>
        <Text style={styles.itemLabel}>SHUFFLE</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{itemCounts.shuffle}</Text></View>
      </View>

      {/* MAGNET ITEM */}
      <View style={styles.itemWrapper}>
        <Pressable onPress={onMagnet} style={styles.itemButton}>
          {({ pressed }) => (
            <View style={styles.iconCircle}>
              <Image 
                source={TILE_ASSETS['ui_magnet']} 
                style={styles.itemIcon} 
                resizeMode="cover" 
              />
            </View>
          )}
        </Pressable>
        <Text style={styles.itemLabel}>MAGNET</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{itemCounts.magnet}</Text></View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
    marginBottom: 5,
  },
  itemWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  itemButton: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIcon: {
    width: '100%',
    height: '100%',
  },
  itemLabel: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Nunito-Black',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
  },
});
