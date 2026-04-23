import { Platform } from 'react-native';

// Dev server host — configure via rn/.env:
//   EXPO_PUBLIC_DEV_HOST=<your-machine-ip-or-hostname>
//
// Platform defaults (used when EXPO_PUBLIC_DEV_HOST is not set):
//   Android emulator : 10.0.2.2   (loopback alias → host machine localhost)
//   iOS simulator    : localhost   (simulator shares host machine network)
//   Real device      : no safe default — EXPO_PUBLIC_DEV_HOST must be set
const ENV_DEV_HOST =
  process.env.EXPO_PUBLIC_DEV_HOST ?? process.env.DEV_HOST_IP ?? null;

const PLATFORM_DEFAULT_DEV_HOST: string =
  Platform.OS === 'android'
    ? '10.0.2.2' // Android emulator → host machine localhost
    : 'localhost'; // iOS simulator → shares host network

const DEV_HOST: string = ENV_DEV_HOST ?? PLATFORM_DEFAULT_DEV_HOST;
const DEV_PORT = 5173;

if (__DEV__ && !ENV_DEV_HOST) {
  console.warn(
    `[config] EXPO_PUBLIC_DEV_HOST is not set. Using platform default "${DEV_HOST}". ` +
      'For real devices, set EXPO_PUBLIC_DEV_HOST=<your-machine-ip> in rn/.env',
  );
}

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
