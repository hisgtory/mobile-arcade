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
  // 화면 너비에 맞춰 슬롯 한 칸의 최대 크기를 동적으로 계산
  // 컨테이너 패딩을 0으로 설정하여 가용 너비 확보
  const horizontalMargin = 30;
  const availableWidth = SCREEN_WIDTH - horizontalMargin;
  
  const calculatedSlotSize = Math.min(46, Math.floor(availableWidth / maxSlot) - 2);
  const TILE_SIZE = calculatedSlotSize; // 타일이 슬롯 칸을 꽉 채우도록 함

  return (
    <View style={styles.container}>
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
                  marginHorizontal: 1, // 최소한의 구분선
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
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignSelf: 'center',
    padding: 0, // 패딩 완전 제거
    overflow: 'hidden', // 내부 요소가 라운드를 벗어나지 않게 처리
  },
  slotGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
