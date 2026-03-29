/**
 * BridgeClient — Web ↔ RN WebView bridge
 *
 * Sends messages to RN via postMessage and handles ACK flow with timeout/retry.
 * Falls back to localStorage when ReactNativeWebView is unavailable.
 */

import {
  BridgeMessage,
  BridgeResponse,
  BridgeRequestType,
  BridgeGameState,
  BridgeLeaderboardEntry,
  BridgeClientConfig,
  HapticStyle,
  RESPONSE_TYPE_MAP,
  STORAGE_KEY_STATE,
  STORAGE_KEY_LEADERBOARD,
} from './types';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(data: string): void };
    __bridgeReceive?: (response: BridgeResponse) => void;
  }
}

let msgCounter = 0;
function generateMsgId(): string {
  msgCounter++;
  return `msg_${Date.now()}_${msgCounter}`;
}

export class BridgeClient {
  private readonly isRN: boolean;
  private readonly debug: boolean;
  private readonly ackTimeoutMs: number;
  private readonly maxRetries: number;
  private pendingAcks = new Map<string, {
    resolve: (res: BridgeResponse) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
    type: BridgeRequestType;
    retries: number;
    message: BridgeMessage;
  }>();

  constructor(config?: BridgeClientConfig) {
    this.isRN = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';
    this.debug = config?.debug ?? false;
    this.ackTimeoutMs = config?.ackTimeoutMs ?? 3000;
    this.maxRetries = config?.maxRetries ?? 1;

    // Register global receiver for RN → Web messages
    if (typeof window !== 'undefined') {
      window.__bridgeReceive = (response: BridgeResponse) => {
        this._onReceive(response);
      };
    }
  }

  // ─── Public API ─────────────────────────────────────────────

  async send(type: BridgeRequestType, payload: any = {}): Promise<BridgeResponse> {
    const message: BridgeMessage = {
      type,
      payload,
      msgId: generateMsgId(),
      timestamp: Date.now(),
    };

    if (this.debug) {
      console.log(`[Bridge] >>> type=${type} msgId=${message.msgId} payload=${JSON.stringify(payload)}`);
    }

    if (this.isRN) {
      return this._sendToRN(message);
    }
    return this._sendFallback(message);
  }

  async saveState(state: BridgeGameState): Promise<void> {
    await this.send('STATE_SAVE', state);
  }

  async loadState(): Promise<BridgeGameState | null> {
    const res = await this.send('STATE_LOAD', {});
    return res.payload ?? null;
  }

  async saveLeaderboard(entry: BridgeLeaderboardEntry): Promise<void> {
    await this.send('LEADERBOARD_SAVE', entry);
  }

  async loadLeaderboard(limit?: number): Promise<BridgeLeaderboardEntry[]> {
    const res = await this.send('LEADERBOARD_LOAD', { limit });
    return res.payload ?? [];
  }

  async requestAd(): Promise<{ rewarded: boolean }> {
    const res = await this.send('AD_REQUEST', { adType: 'rewarded' });
    return res.payload ?? { rewarded: false };
  }

  haptic(style: HapticStyle, count = 1): void {
    this.send('HAPTIC', { style, count }).catch(() => {});
  }

  itemUsed(itemType: string, remainingCount: number): void {
    this.send('ITEM_USED', { itemType, remainingCount }).catch(() => {});
  }

  stageComplete(data: { stage: number; score: number; elapsedMs: number; cleared: boolean }): void {
    this.send(data.cleared ? 'STAGE_CLEAR' : 'GAME_OVER', data).catch(() => {});
  }

  destroy(): void {
    for (const [, pending] of this.pendingAcks) {
      clearTimeout(pending.timer);
    }
    this.pendingAcks.clear();
    if (typeof window !== 'undefined') {
      window.__bridgeReceive = undefined;
    }
  }

  // ─── RN Transport ──────────────────────────────────────────

  private _sendToRN(message: BridgeMessage): Promise<BridgeResponse> {
    return new Promise((resolve, reject) => {
      const doSend = (retries: number) => {
        console.log(`[Bridge] SEND: type=${message.type} msgId=${message.msgId}`);

        window.ReactNativeWebView!.postMessage(JSON.stringify(message));

        const timer = setTimeout(() => {
          const pending = this.pendingAcks.get(message.msgId);
          if (!pending) return;

          if (pending.retries < this.maxRetries) {
            console.log(`[Bridge] ACK timeout: msgId=${message.msgId} type=${message.type} (retry ${pending.retries + 1}/${this.maxRetries})`);
            this.pendingAcks.delete(message.msgId);
            doSend(pending.retries + 1);
          } else {
            console.error(`[Bridge] ACK timeout (final): msgId=${message.msgId} type=${message.type}`);
            this.pendingAcks.delete(message.msgId);
            reject(new Error(`ACK timeout for ${message.type} msgId=${message.msgId}`));
          }
        }, this.ackTimeoutMs);

        this.pendingAcks.set(message.msgId, {
          resolve,
          reject,
          timer,
          type: message.type,
          retries,
          message,
        });
      };

      doSend(0);
    });
  }

  private _onReceive(response: BridgeResponse): void {
    if (this.debug) {
      console.log(`[Bridge] <<< type=${response.type} msgId=${response.msgId} status=${response.status}`);
    }

    const pending = this.pendingAcks.get(response.msgId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pendingAcks.delete(response.msgId);

    if (response.status === 'error') {
      console.error(`[Bridge] Error: msgId=${response.msgId} error="${response.error}"`);
      pending.reject(new Error(response.error ?? 'Unknown bridge error'));
      return;
    }

    console.log(`[Bridge] ACK: msgId=${response.msgId}`);
    pending.resolve(response);
  }

  // ─── localStorage Fallback ─────────────────────────────────

  private async _sendFallback(message: BridgeMessage): Promise<BridgeResponse> {
    const expectedType = RESPONSE_TYPE_MAP[message.type];

    console.log(`[Bridge] SEND (fallback): type=${message.type} msgId=${message.msgId}`);

    let payload: any;

    switch (message.type) {
      case 'STATE_SAVE': {
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(message.payload));
        break;
      }
      case 'STATE_LOAD': {
        const raw = localStorage.getItem(STORAGE_KEY_STATE);
        payload = raw ? JSON.parse(raw) : null;
        break;
      }
      case 'LEADERBOARD_SAVE': {
        const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
        const entries: BridgeLeaderboardEntry[] = raw ? JSON.parse(raw) : [];
        entries.push(message.payload);
        entries.sort((a, b) => b.stage - a.stage || a.clearTimeMs - b.clearTimeMs);
        localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(entries.slice(0, 50)));
        break;
      }
      case 'LEADERBOARD_LOAD': {
        const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
        const all: BridgeLeaderboardEntry[] = raw ? JSON.parse(raw) : [];
        const limit = message.payload?.limit;
        payload = limit ? all.slice(0, limit) : all;
        break;
      }
      case 'AD_REQUEST': {
        payload = { rewarded: true };
        break;
      }
      case 'HAPTIC': {
        // no-op in browser
        break;
      }
      case 'ITEM_USED': {
        // no-op in browser fallback (RN tracks item usage)
        break;
      }
      case 'STAGE_CLEAR':
      case 'GAME_OVER': {
        // no-op in browser fallback (RN renders result screen)
        break;
      }
    }

    const response: BridgeResponse = {
      type: expectedType,
      msgId: message.msgId,
      status: 'ack',
      payload,
      timestamp: Date.now(),
    };

    console.log(`[Bridge] ACK (fallback): msgId=${message.msgId}`);
    return response;
  }
}
