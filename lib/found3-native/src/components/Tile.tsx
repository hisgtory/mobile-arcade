import React from 'react';
import { StyleSheet, Image, TouchableOpacity, View } from 'react-native';
import { TileData, TILE_COLORS, TILE_IMAGES } from '../types';
import { TILE_ASSETS } from '../assets';

interface TileProps {
  tile: TileData;
  size: number;
  gap: number;
  boardPad: number;
  onPress: (tile: TileData) => void;
  disabled?: boolean;
}

export const Tile: React.FC<TileProps> = ({ 
  tile, 
  size, 
  gap, 
  boardPad, 
  onPress, 
  disabled 
}) => {
  const isBlocked = !tile.isSelectable;
  const left = tile.col * (size + gap) + boardPad;
  const top = tile.row * (size + gap) + boardPad;
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(tile)}
      disabled={disabled || isBlocked}
      style={[
        styles.tile,
        {
          backgroundColor: TILE_COLORS[tile.type] || '#fff',
          left,
          top,
          width: size,
          height: size,
          opacity: isBlocked ? 0.5 : 1,
          zIndex: Math.floor((tile.layer || 0) * 100 + (tile.id || 0)),
          elevation: Math.floor((tile.layer || 0) * 10 + 1),
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    borderRadius: 14, // 더 둥근 모서리
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)', // 거의 보이지 않는 테두리
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    overflow: 'hidden', // 이미지 잘림 처리
    // 소프트한 그림자
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
    overflow: 'hidden', // 안전을 위해 내부도 추가
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
  },
});
