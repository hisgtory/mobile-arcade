/**
 * Bridge protocol type definitions
 *
 * Message format, state schemas, and type constants for Web ↔ RN communication.
 */

// ─── Message Types ──────────────────────────────────────────

/** Web → RN request message types */
export type BridgeRequestType =
  | 'STATE_SAVE'
  | 'STATE_LOAD'
  | 'LEADERBOARD_SAVE'
  | 'LEADERBOARD_LOAD'
  | 'AD_REQUEST'
  | 'HAPTIC'
  | 'ITEM_USED'
  | 'STAGE_CLEAR'
  | 'GAME_OVER';

/** RN → Web response message types */
export type BridgeResponseType =
  | 'ACK'
  | 'STATE_LOADED'
  | 'LEADERBOARD_LOADED'
  | 'AD_COMPLETE';

/** Request-to-response type mapping */
export const RESPONSE_TYPE_MAP: Record<BridgeRequestType, BridgeResponseType> = {
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

// ─── Message Formats ────────────────────────────────────────

/** Web → RN message */
export interface BridgeMessage {
  type: BridgeRequestType;
  payload: any;
  msgId: string;
  timestamp: number;
}

/** RN → Web response */
export interface BridgeResponse {
  type: BridgeResponseType;
  msgId: string;
  status: 'ack' | 'error';
  payload?: any;
  error?: string;
  timestamp: number;
}

// ─── State Schemas ──────────────────────────────────────────

/** Persisted game state (synced with RN AsyncStorage) */
export interface BridgeGameState {
  currentStage: number;
  coins: number;
  itemCounts: {
    shuffle: number;
    undo: number;
    magnet: number;
  };
  stagesCleared: number[];
  totalPlayTimeMs: number;
}

/** Leaderboard entry stored via bridge */
export interface BridgeLeaderboardEntry {
  stage: number;
  score: number;
  clearTimeMs: number;
  timestamp: number;
}

/** Default initial game state */
export const DEFAULT_BRIDGE_GAME_STATE: BridgeGameState = {
  currentStage: 1,
  coins: 0,
  itemCounts: { shuffle: 3, undo: 3, magnet: 3 },
  stagesCleared: [],
  totalPlayTimeMs: 0,
};

// ─── Haptic Styles ──────────────────────────────────────────

export type HapticStyle = 'light' | 'medium' | 'heavy' | (string & {});

// ─── BridgeClient Config ────────────────────────────────────

export interface BridgeClientConfig {
  /** Enable verbose debug logging */
  debug?: boolean;
  /** ACK timeout in ms (default: 3000) */
  ackTimeoutMs?: number;
  /** Max auto-retries on timeout (default: 1) */
  maxRetries?: number;
}

// ─── localStorage Keys ──────────────────────────────────────

export const STORAGE_KEY_STATE = '@found3/gameState';
export const STORAGE_KEY_LEADERBOARD = '@found3/leaderboard';
