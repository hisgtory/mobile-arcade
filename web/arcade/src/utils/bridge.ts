/**
 * Lightweight bridge for RN communication.
 * Sends haptic events, stage-clear, and game-over messages.
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

export function haptic(event: string): void {
  sendToRN('HAPTIC', { style: event });
}

export function navigateToArcade(): void {
  if (isRN) {
    sendToRN('NAVIGATE', { target: 'arcade' });
  } else {
    window.location.href = '/';
  }
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

export function haptic(event: string): void {
  sendToRN('HAPTIC', { style: event });
}
