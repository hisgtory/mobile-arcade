/**
 * BridgeHost — RN side of the WebView ↔ RN bridge protocol.
 *
 * Receives messages from WebView (onMessage), routes by type,
 * performs AsyncStorage CRUD, and sends ACK/data responses back
 * via injectJavaScript.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { RefObject } from 'react';
import type WebView from 'react-native-webview';

// ─── Types (mirrored from lib/found3/src/bridge/types.ts) ────

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

// ─── Storage Keys ────────────────────────────────────────────

const STORAGE_KEY_STATE = '@found3/gameState';
const STORAGE_KEY_LEADERBOARD = '@found3/leaderboard';

// ─── Response Type Mapping ───────────────────────────────────

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

// ─── BridgeHost ──────────────────────────────────────────────

export class BridgeHost {
  private webViewRef: RefObject<WebView>;
  private callbacks: BridgeHostCallbacks;

  constructor(webViewRef: RefObject<WebView>, callbacks: BridgeHostCallbacks = {}) {
    this.webViewRef = webViewRef;
    this.callbacks = callbacks;
  }

  updateCallbacks(callbacks: BridgeHostCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * WebView onMessage handler — parse incoming message and route to handler.
   * Pass this to <WebView onMessage={bridgeHost.handleMessage} />.
   */
  handleMessage = async (event: { nativeEvent: { data: string } }) => {
    let msg: BridgeMessage;

    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      console.error('[BridgeHost] JSON parse error:', event.nativeEvent.data);
      return;
    }

    console.log(`[BridgeHost] RECV: type=${msg.type} msgId=${msg.msgId}`);

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
      console.error(`[BridgeHost] Error handling ${msg.type}:`, errorMsg);
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
    await AsyncStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(msg.payload));
    this.sendResponse(msg.msgId, 'ACK', 'ack');
  }

  private async handleStateLoad(msg: BridgeMessage) {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STATE);
    const state = raw ? JSON.parse(raw) : null;
    this.sendResponse(msg.msgId, 'STATE_LOADED', 'ack', state);
  }

  private async handleLeaderboardSave(msg: BridgeMessage) {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LEADERBOARD);
    const entries: any[] = raw ? JSON.parse(raw) : [];
    entries.push(msg.payload);
    await AsyncStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(entries));
    this.sendResponse(msg.msgId, 'ACK', 'ack');
  }

  private async handleLeaderboardLoad(msg: BridgeMessage) {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LEADERBOARD);
    let entries: any[] = raw ? JSON.parse(raw) : [];
    const limit = msg.payload?.limit;
    if (typeof limit === 'number' && limit > 0) {
      entries = entries.slice(-limit);
    }
    this.sendResponse(msg.msgId, 'LEADERBOARD_LOADED', 'ack', entries);
  }

  private handleAdRequest(msg: BridgeMessage) {
    // Mock: immediately respond with rewarded=true (real ad SDK integration later)
    this.sendResponse(msg.msgId, 'AD_COMPLETE', 'ack', { rewarded: true });
  }

  private async handleItemUsed(msg: BridgeMessage) {
    const { itemType, remainingCount } = msg.payload;
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STATE);
    const state = raw ? JSON.parse(raw) : null;
    if (state && state.itemCounts) {
      state.itemCounts[itemType] = remainingCount;
      await AsyncStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
    }
    this.sendResponse(msg.msgId, 'ACK', 'ack');
    console.log(`[BridgeHost] ITEM_USED: ${itemType} → ${remainingCount}`);
  }

  private handleStageComplete(msg: BridgeMessage, cleared: boolean) {
    this.sendResponse(msg.msgId, 'ACK', 'ack');
    this.callbacks.onStageComplete?.({
      stage: msg.payload?.stage,
      score: msg.payload?.score,
      elapsedMs: msg.payload?.elapsedMs,
      cleared,
    });
    console.log(`[BridgeHost] ${cleared ? 'STAGE_CLEAR' : 'GAME_OVER'}: stage=${msg.payload?.stage} score=${msg.payload?.score}`);
  }

  private async handleHaptic(msg: BridgeMessage) {
    const style = msg.payload?.style ?? 'medium';
    const impactMap: Record<string, Haptics.ImpactFeedbackStyle> = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    await Haptics.impactAsync(impactMap[style] ?? Haptics.ImpactFeedbackStyle.Medium);
    this.sendResponse(msg.msgId, 'ACK', 'ack');
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

    console.log(`[BridgeHost] ${status === 'ack' ? 'ACK' : 'ERR'}: msgId=${msgId} type=${type}`);
  }
}
