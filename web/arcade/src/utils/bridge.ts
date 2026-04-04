/**
 * Lightweight bridge for sending stage-clear/game-over messages to RN.
 * Shared across all games in web/arcade.
 */

const isRN =
  typeof window !== 'undefined' &&
  typeof window.ReactNativeWebView !== 'undefined';

let msgCounter = 0;

function sendToRN(type: string, payload: Record<string, unknown>): void {
  if (!isRN) return;
  const msg = {
    type,
    payload,
    msgId: `ws-${Date.now()}-${++msgCounter}`,
    timestamp: Date.now(),
  };
  window.ReactNativeWebView!.postMessage(JSON.stringify(msg));
}

export function stageComplete(data: {
  stage: number;
  score: number;
  moves?: number;
  elapsedMs?: number;
  cleared: boolean;
}): void {
  sendToRN(data.cleared ? 'STAGE_CLEAR' : 'GAME_OVER', data);
}

export type HapticStyle = 'light' | 'medium' | 'heavy';

export function haptic(style: HapticStyle = 'medium'): void {
  sendToRN('HAPTIC', { style });
}
