import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TILE_ASSETS } from '../assets';

const BGM_LIST = ['bgm_1', 'bgm_2', 'bgm_3', 'bgm_4', 'bgm_5'];
const AUDIO_SETTINGS_KEY = '@found3_audio_settings';

export const AudioService = {
  soundInstance: null as Audio.Sound | null,
  currentTrackIdx: 0,
  volume: 0.5,
  isMuted: false,

  /**
   * 설정된 볼륨 및 음소거 상태를 로드합니다.
   */
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

  /**
   * 설정을 저장합니다.
   */
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

  /**
   * BGM 재생을 시작합니다.
   */
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

  /**
   * 다음 트랙을 재생합니다.
   */
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

  /**
   * 볼륨을 실시간으로 조절합니다 (0.0 ~ 1.0)
   */
  setVolume: async (value: number) => {
    AudioService.volume = value;
    if (AudioService.soundInstance) {
      await AudioService.soundInstance.setVolumeAsync(AudioService.isMuted ? 0 : value);
    }
    await AudioService.saveSettings();
  },

  /**
   * 음소거를 토글합니다.
   */
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
