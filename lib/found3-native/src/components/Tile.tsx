import React from 'react';
import { StyleSheet, Image, TouchableOpacity, View } from 'react-native';
import { TileData, SlotItem, TILE_COLORS, TILE_IMAGES } from '../types';
import { TILE_ASSETS } from '../assets';

interface TileProps {
  tile: TileData | SlotItem;
  size: number;
  gap?: number;
  boardPad?: number;
  onPress?: (tile: any) => void;
  disabled?: boolean;
}

export const Tile: React.FC<TileProps> = ({ 
  tile, 
  size, 
  gap = 0, 
  boardPad = 0, 
  onPress, 
  disabled 
}) => {
  if (!tile) return null;

  // TileData인지 SlotItem인지 판별하여 값 할당
  const isTileData = 'col' in tile;
  const isBlocked = isTileData ? !(tile as TileData).isSelectable : false;
  const col = isTileData ? (tile as TileData).col : 0;
  const row = isTileData ? (tile as TileData).row : 0;
  const layer = isTileData ? (tile as TileData).layer : 0;

  const left = boardPad + col * (size + gap);
  const top = row * (size + gap);
  
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container
      activeOpacity={0.7}
      onPress={() => onPress?.(tile)}
      disabled={disabled || isBlocked}
      style={[
        styles.tile,
        {
          backgroundColor: TILE_COLORS[tile.type] || '#fff',
          position: onPress ? 'absolute' : 'relative',
          left: onPress ? left : undefined,
          top: onPress ? top : undefined,
          width: size,
          height: size,
          opacity: isBlocked ? 0.5 : 1,
          zIndex: Math.floor(layer * 100 + (Number(tile.id.split('_')[1]) || 0)),
          elevation: Math.floor(layer * 10 + 1),
        },
      ]}
    >
      <View style={styles.inner}>
        <Image 
          source={TILE_ASSETS[TILE_IMAGES[tile.type]]} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      {isBlocked && <View style={styles.overlay} />}
    </Container>
  );
};

const styles = StyleSheet.create({
  tile: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
  },
});
