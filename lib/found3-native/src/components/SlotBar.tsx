import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { SlotItem, MAX_SLOT } from '../types';
import { Tile } from './Tile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlotBarProps {
  slots: SlotItem[];
  maxSlot: number;
}

export const SlotBar: React.FC<SlotBarProps> = ({ slots, maxSlot }) => {
  // 디자인 밸런스를 위한 고정 수치
  const CONTAINER_PADDING = 8;
  const SLOT_GAP = 6;
  const horizontalMargin = 40; // 화면 양 끝 여백
  
  // 가용 너비에서 패딩과 간격을 제외한 실제 슬롯 사이즈 계산
  const availableWidth = SCREEN_WIDTH - horizontalMargin - (CONTAINER_PADDING * 2) - (maxSlot * SLOT_GAP);
  const calculatedSlotSize = Math.min(46, Math.floor(availableWidth / maxSlot));
  const TILE_SIZE = calculatedSlotSize; // 타일은 슬롯을 꽉 채움 (카드 느낌)

  return (
    <View style={[styles.container, { padding: CONTAINER_PADDING }]}>
      <View style={styles.slotGrid}>
        {Array.from({ length: maxSlot }).map((_, index) => {
          const item = slots[index];
          const isExpandedSlot = index >= MAX_SLOT;
          
          return (
            <View 
              key={index} 
              style={[
                styles.slotItem, 
                { 
                  width: calculatedSlotSize, 
                  height: calculatedSlotSize, 
                  marginHorizontal: SLOT_GAP / 2,
                  backgroundColor: isExpandedSlot ? '#E3F2FD' : '#F8F9FA'
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
    borderRadius: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  slotGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotItem: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
