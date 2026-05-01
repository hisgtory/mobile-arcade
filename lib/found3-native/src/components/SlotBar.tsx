import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { SlotItem } from '../types';
import { Tile } from './Tile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlotBarProps {
  slots: SlotItem[];
  maxSlot: number;
}

export const SlotBar: React.FC<SlotBarProps> = ({ slots, maxSlot }) => {
  // 화면 너비에 맞춰 슬롯 한 칸의 최대 크기를 동적으로 계산
  // (화면 너비 - 컨테이너 마진 30 - 내부 패딩) / 최대 슬롯 수
  const containerPadding = 12;
  const horizontalMargin = 30;
  const availableWidth = SCREEN_WIDTH - horizontalMargin - (containerPadding * 2);
  
  // 슬롯 개수가 늘어나면 칸 사이즈를 줄임 (최대 46, 최소 30)
  const calculatedSlotSize = Math.min(46, Math.floor(availableWidth / maxSlot) - 4);
  const GAP = Math.min(8, Math.floor(calculatedSlotSize * 0.15));
  const TILE_SIZE = calculatedSlotSize - 4;

  return (
    <View style={[styles.container, { padding: containerPadding }]}>
      <View style={styles.slotGrid}>
        {Array.from({ length: maxSlot }).map((_, index) => {
          const item = slots[index];
          return (
            <View 
              key={index} 
              style={[
                styles.slotItem, 
                { 
                  width: calculatedSlotSize, 
                  height: calculatedSlotSize, 
                  marginHorizontal: 2 
                }
              ]}
            >
              {item && (
                <Tile 
                  tile={item}
                  size={TILE_SIZE} 
                />
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
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    alignSelf: 'center',
  },
  slotGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
