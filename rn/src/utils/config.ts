import { Platform } from 'react-native';

// Dev server host: configurable via env, with platform-specific defaults
const ENV_DEV_HOST =
  process.env.EXPO_PUBLIC_DEV_HOST ?? process.env.DEV_HOST_IP ?? null;

// Bonjour hostname — stable across WiFi changes, works from real devices
const DEFAULT_DEV_HOST =
  Platform.OS === 'android'
    ? '10.0.2.2' // Android emulator → host machine localhost
    : 'SG-MacBook-Pro.local';

const DEV_HOST = ENV_DEV_HOST || DEFAULT_DEV_HOST;
const DEV_PORT = 5173;

export function getGameUrl(webPath: string, stageId?: number): string {
  const base = __DEV__
    ? `http://${DEV_HOST}:${DEV_PORT}${webPath}`
    : `https://arcade.hisgtory.com${webPath}`;

  if (stageId !== undefined) {
    return `${base}/stage/${stageId}`;
  }
  return base;
}

declare const __DEV__: boolean;
