import { Platform } from 'react-native';

// Dev server host — update this when your WiFi IP changes
const DEV_HOST_IP = '192.168.1.121';
const DEV_PORT = 5173;

export function getGameUrl(webPath: string, stageId?: number): string {
  const base = __DEV__
    ? `http://${DEV_HOST_IP}:${DEV_PORT}${webPath}`
    : `https://arcade.hisgtory.com${webPath}`;

  if (stageId !== undefined) {
    return `${base}/stage/${stageId}`;
  }
  return base;
}

// Check if running in development
declare const __DEV__: boolean;
