import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { SlotItem, MAX_SLOT, TILE_COLORS, TILE_IMAGES } from '../types';
import { TILE_ASSETS } from '../assets';

interface SlotBarProps {
  slots: SlotItem[];
}

export const SlotBar: React.FC<SlotBarProps> = ({ slots }) => {
  return (
    <View style={styles.container}>
      <View style={styles.slotGrid}>
        {Array.from({ length: MAX_SLOT }).map((_, index) => {
          const item = slots[index];
          return (
            <View key={index} style={styles.slotItem}>
              {item && (
                <View
                  style={[
                    styles.tile,
                    { backgroundColor: TILE_COLORS[item.type] || '#fff' },
                  ]}
                >
                  <Image
                    source={TILE_ASSETS[TILE_IMAGES[item.type]]}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#E9ECEF', // 부드러운 연회색
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  slotGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 54,
  },
  slotItem: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    // 빈 슬롯 그림자 생략 또는 아주 연하게
  },
  tile: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: '75%',
    height: '75%',
  },
});
