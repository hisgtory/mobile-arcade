import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Image, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../App';
import { TILE_ASSETS } from '@arcade/lib-found3-native/src/assets';
import { ProgressService } from '@arcade/lib-found3-native/src/logic/progress';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [currentStage, setCurrentStage] = React.useState(1);

  useFocusEffect(
    React.useCallback(() => {
      ProgressService.loadProgress().then(p => {
        setCurrentStage(p.highestStage);
      });
    }, [])
  );

  return (
    <ImageBackground 
      source={TILE_ASSETS['background']} 
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView 
        style={styles.safeArea} 
        edges={Platform.OS === 'ios' ? ['top', 'bottom', 'left', 'right'] : ['bottom', 'left', 'right']}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.title}>FOUND 3</Text>
            <Text style={styles.subtitle}>Fruit Explorer</Text>
          </View>

          <View style={styles.stageCard}>
            <Text style={styles.stageLabel}>CURRENT STAGE</Text>
            <Text style={styles.stageValue}>{currentStage}</Text>
            
            <View style={styles.previewContainer}>
               <Image source={TILE_ASSETS['apple']} style={styles.previewIcon} />
               <Image source={TILE_ASSETS['orange']} style={styles.previewIcon} />
               <Image source={TILE_ASSETS['grape']} style={styles.previewIcon} />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => navigation.navigate('Game', { stageId: currentStage })}
          >
            <Text style={styles.playButtonText}>PLAY</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  logoContainer: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 56, fontWeight: '900', color: '#333', letterSpacing: -1 },
  subtitle: { fontSize: 20, color: '#adb5bd', fontWeight: '600', marginTop: -5 },
  stageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: '100%',
    padding: 30,
    borderRadius: 40,
    alignItems: 'center',
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
  stageLabel: { fontSize: 14, fontWeight: 'bold', color: '#adb5bd', marginBottom: 10 },
  stageValue: { fontSize: 72, fontWeight: '900', color: '#4DABF7' },
  previewContainer: { flexDirection: 'row', marginTop: 20 },
  previewIcon: { width: 44, height: 44, marginHorizontal: 8 },
  playButton: {
    backgroundColor: '#FF6B6B',
    width: '100%',
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
});
