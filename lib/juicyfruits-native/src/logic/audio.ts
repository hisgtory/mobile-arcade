import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TILE_ASSETS } from '../assets';

const BGM_LIST = ['bgm_1', 'bgm_2', 'bgm_3', 'bgm_4', 'bgm_5', 'bgm_6'];
const AUDIO_SETTINGS_KEY = '@juicyfruits_audio_settings'; // 키값 변경

export const AudioService = {
  soundInstance: null as Audio.Sound | null,
  currentTrackIdx: 0,
  volume: 0.5,
  isMuted: false,

  loadSettings: async () => {
    try {
      const data = await AsyncStorage.getItem(AUDIO_SETTINGS_KEY);
      if (data) {
        const settings = JSON.parse(data);
        AudioService.volume = settings.volume ?? 0.5;
        AudioService.isMuted = settings.isMuted ?? false;
      }
    } catch (e) {
      console.error('Failed to load audio settings', e);
    }
  },

  saveSettings: async () => {
    try {
      await AsyncStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify({
        volume: AudioService.volume,
        isMuted: AudioService.isMuted
      }));
    } catch (e) {
      console.error('Failed to save audio settings', e);
    }
  },

  startBGM: async () => {
    if (AudioService.soundInstance) return;
    await AudioService.loadSettings();

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      await AudioService.playNextTrack();
    } catch (e) {
      console.error('Failed to start BGM', e);
    }
  },

  playNextTrack: async () => {
    try {
      if (AudioService.soundInstance) {
        await AudioService.soundInstance.unloadAsync();
      }

      const trackKey = BGM_LIST[AudioService.currentTrackIdx];
      const { sound } = await Audio.Sound.createAsync(
        TILE_ASSETS[trackKey],
        { 
          shouldPlay: !AudioService.isMuted, 
          volume: AudioService.volume 
        }
      );

      AudioService.soundInstance = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          AudioService.currentTrackIdx = (AudioService.currentTrackIdx + 1) % BGM_LIST.length;
          AudioService.playNextTrack();
        }
      });
    } catch (e) {
      console.error('Failed to play track', e);
    }
  },

  setVolume: async (value: number) => {
    AudioService.volume = value;
    if (AudioService.soundInstance) {
      await AudioService.soundInstance.setVolumeAsync(AudioService.isMuted ? 0 : value);
    }
    await AudioService.saveSettings();
  },

  toggleMute: async () => {
    AudioService.isMuted = !AudioService.isMuted;
    if (AudioService.soundInstance) {
      if (AudioService.isMuted) {
        await AudioService.soundInstance.pauseAsync();
      } else {
        await AudioService.soundInstance.playAsync();
        await AudioService.soundInstance.setVolumeAsync(AudioService.volume);
      }
    }
    await AudioService.saveSettings();
  },

  stopBGM: async () => {
    if (AudioService.soundInstance) {
      await AudioService.soundInstance.stopAsync();
      await AudioService.soundInstance.unloadAsync();
      AudioService.soundInstance = null;
    }
  }
};
