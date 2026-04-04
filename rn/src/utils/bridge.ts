/**
 * BridgeHost — RN side of the WebView <-> RN bridge protocol.
 *
 * Game-agnostic: storage keys are prefixed with gameId.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { RefObject } from 'react';
import type WebView from 'react-native-webview';

// ─── Types ──────────────────────────────────────────────────

type BridgeRequestType =
  | 'STATE_SAVE'
  | 'STATE_LOAD'
  | 'LEADERBOARD_SAVE'
  | 'LEADERBOARD_LOAD'
  | 'AD_REQUEST'
  | 'HAPTIC'
  | 'ITEM_USED'
  | 'STAGE_CLEAR'
  | 'GAME_OVER';

type BridgeResponseType =
  | 'ACK'
  | 'STATE_LOADED'
  | 'LEADERBOARD_LOADED'
  | 'AD_COMPLETE';

interface BridgeMessage {
  type: BridgeRequestType;
  payload: any;
  msgId: string;
  timestamp: number;
}

interface BridgeResponse {
  type: BridgeResponseType;
  msgId: string;
  status: 'ack' | 'error';
  payload?: any;
  error?: string;
  timestamp: number;
}

// ─── Callback Types ─────────────────────────────────────────

export interface StageCompleteData {
  stage: number;
  score: number;
  elapsedMs: number;
  cleared: boolean;
}

export interface BridgeHostCallbacks {
  onStageComplete?: (data: StageCompleteData) => void;
}

// ─── Response Type Mapping ──────────────────────────────────

const RESPONSE_TYPE_MAP: Record<BridgeRequestType, BridgeResponseType> = {
  STATE_SAVE: 'ACK',
  STATE_LOAD: 'STATE_LOADED',
  LEADERBOARD_SAVE: 'ACK',
  LEADERBOARD_LOAD: 'LEADERBOARD_LOADED',
  AD_REQUEST: 'AD_COMPLETE',
  HAPTIC: 'ACK',
  ITEM_USED: 'ACK',
  STAGE_CLEAR: 'ACK',
  GAME_OVER: 'ACK',
};

// ─── Haptic Patterns ────────────────────────────────────────

const HAPTIC_PATTERNS: Record<string, { style: string; count?: number }> = {
  'piece-placed': { style: 'light' },
  'line-cleared': { style: 'medium' },
  'block-tapped': { style: 'light' },
  'combo-cleared': { style: 'heavy' },
  'cell-tapped': { style: 'light' },
  'mistake-made': { style: 'heavy' },
  'puzzle-clear': { style: 'heavy' },
};

// ─── BridgeHost ─────────────────────────────────────────────

export class BridgeHost {
  private webViewRef: RefObject<WebView | null>;
  private callbacks: BridgeHostCallbacks;
  private gameId: string;

  constructor(
    webViewRef: RefObject<WebView | null>,
    gameId: string,
    callbacks: BridgeHostCallbacks = {},
  ) {
    this.webViewRef = webViewRef;
    this.gameId = gameId;
    this.callbacks = callbacks;
  }

  private storageKey(suffix: string): string {
    return `@arcade/${this.gameId}/${suffix}`;
  }

  updateCallbacks(callbacks: BridgeHostCallbacks) {
    this.callbacks = callbacks;
  }

  handleMessage = async (event: { nativeEvent: { data: string } }) => {
    let msg: BridgeMessage;

    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      console.error('[BridgeHost] JSON parse error:', event.nativeEvent.data);
      return;
    }

    console.log(`[BridgeHost:${this.gameId}] RECV: type=${msg.type} msgId=${msg.msgId}`);

    try {
      switch (msg.type) {
        case 'STATE_SAVE':
          await this.handleStateSave(msg);
          break;
        case 'STATE_LOAD':
          await this.handleStateLoad(msg);
          break;
        case 'LEADERBOARD_SAVE':
          await this.handleLeaderboardSave(msg);
          break;
        case 'LEADERBOARD_LOAD':
          await this.handleLeaderboardLoad(msg);
          break;
        case 'AD_REQUEST':
          this.handleAdRequest(msg);
          break;
        case 'HAPTIC':
          await this.handleHaptic(msg);
          break;
        case 'ITEM_USED':
          await this.handleItemUsed(msg);
          break;
        case 'STAGE_CLEAR':
          this.handleStageComplete(msg, true);
          break;
        case 'GAME_OVER':
          this.handleStageComplete(msg, false);
          break;
        default:
          this.sendResponse(msg.msgId, 'ACK', 'error', undefined, 'unknown_type');
          break;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'unknown_error';
      console.error(`[BridgeHost:${this.gameId}] Error handling ${msg.type}:`, errorMsg);
      this.sendResponse(
        msg.msgId,
        RESPONSE_TYPE_MAP[msg.type] ?? 'ACK',
        'error',
        undefined,
        errorMsg,
      );
    }
  };

  // ─── Handlers ────────────────────────────────────────────

  private async handleStateSave(msg: BridgeMessage) {
    await AsyncStorage.setItem(this.storageKey('gameState'), JSON.stringify(msg.payload));
    this.sendResponse(msg.msgId, 'ACK', 'ack');
  }

  private async handleStateLoad(msg: BridgeMessage) {
    const state = await this.safeReadJson(this.storageKey('gameState'));
    this.sendResponse(msg.msgId, 'STATE_LOADED', 'ack', state);
  }

  private async handleLeaderboardSave(msg: BridgeMessage) {
    const entries: any[] = (await this.safeReadJson(this.storageKey('leaderboard'))) ?? [];
    entries.push(msg.payload);
    await AsyncStorage.setItem(this.storageKey('leaderboard'), JSON.stringify(entries));
    this.sendResponse(msg.msgId, 'ACK', 'ack');
  }

  private async handleLeaderboardLoad(msg: BridgeMessage) {
    let entries: any[] = (await this.safeReadJson(this.storageKey('leaderboard'))) ?? [];
    const limit = msg.payload?.limit;
    if (typeof limit === 'number' && limit > 0) {
      entries = entries.slice(-limit);
    }
    this.sendResponse(msg.msgId, 'LEADERBOARD_LOADED', 'ack', entries);
  }

  private handleAdRequest(msg: BridgeMessage) {
    // Mock: immediately respond with rewarded=true (real ad SDK later)
    this.sendResponse(msg.msgId, 'AD_COMPLETE', 'ack', { rewarded: true });
  }

  private async handleItemUsed(msg: BridgeMessage) {
    const { itemType, remainingCount } = msg.payload;
    const state = await this.safeReadJson(this.storageKey('gameState'));
    if (state && state.itemCounts) {
      state.itemCounts[itemType] = remainingCount;
      await AsyncStorage.setItem(this.storageKey('gameState'), JSON.stringify(state));
    }
    this.sendResponse(msg.msgId, 'ACK', 'ack');
    console.log(`[BridgeHost:${this.gameId}] ITEM_USED: ${itemType} -> ${remainingCount}`);
  }

  private handleStageComplete(msg: BridgeMessage, cleared: boolean) {
    this.sendResponse(msg.msgId, 'ACK', 'ack');

    const p = msg.payload ?? {};
    const stage = Number(p.stage) || 0;
    const score = Number(p.score) || 0;
    const elapsedMs = Number(p.elapsedMs) || 0;

    this.callbacks.onStageComplete?.({ stage, score, elapsedMs, cleared });
  }

  private async handleHaptic(msg: BridgeMessage) {
    const event = msg.payload?.event;
    const fallbackStyle = msg.payload?.style ?? 'medium';
    const pattern = event ? HAPTIC_PATTERNS[event] : null;
    const style = pattern?.style ?? fallbackStyle;
    const impactMap: Record<string, Haptics.ImpactFeedbackStyle> = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    await Haptics.impactAsync(impactMap[style] ?? Haptics.ImpactFeedbackStyle.Medium);
    this.sendResponse(msg.msgId, 'ACK', 'ack');
  }

  // ─── Safe Storage Read ─────────────────────────────────

  private async safeReadJson(key: string): Promise<any> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      console.warn(`[BridgeHost:${this.gameId}] Corrupted storage at ${key}, clearing`);
      await AsyncStorage.removeItem(key).catch(() => {});
      return null;
    }
  }

  // ─── Response Sender ─────────────────────────────────────

  private sendResponse(
    msgId: string,
    type: BridgeResponseType,
    status: 'ack' | 'error',
    payload?: any,
    error?: string,
  ) {
    const response: BridgeResponse = {
      type,
      msgId,
      status,
      timestamp: Date.now(),
      ...(payload !== undefined && { payload }),
      ...(error !== undefined && { error }),
    };

    const json = JSON.stringify(response);
    const js = `window.__bridgeReceive(${json}); true;`;
    this.webViewRef.current?.injectJavaScript(js);

    console.log(`[BridgeHost:${this.gameId}] ${status === 'ack' ? 'ACK' : 'ERR'}: msgId=${msgId} type=${type}`);
  }
}
