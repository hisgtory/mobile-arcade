/**
 * Puzzle3Go (퍼즐쓰리고) — 화투 매치-3 퍼즐 타입 정의
 */

export type TileType = number;

export interface CellPos {
  row: number;
  col: number;
}

export interface TileData {
  type: TileType;
  row: number;
  col: number;
  /** Special tile created by 4+ matches */
  special?: 'line_h' | 'line_v' | 'bomb';
}

export interface MatchResult {
  cells: CellPos[];
  /** If 4+, indicates special tile to create */
  special?: 'line_h' | 'line_v' | 'bomb';
}

export interface SwapResult {
  valid: boolean;
  matches: MatchResult[];
  score: number;
  combo: number;
}

export interface StageConfig {
  stage: number;
  /** Number of distinct tile types (6-10) */
  typeCount: number;
  /** Grid rows */
  rows: number;
  /** Grid cols */
  cols: number;
  /** Max moves allowed */
  maxMoves: number;
  /** Target score to clear */
  targetScore: number;
}

export interface GameConfig {
  stage?: number;
  assetBaseUrl?: string;
  onClear?: () => void;
  onGameOver?: () => void;
}

export enum GamePhase {
  IDLE = 'idle',
  PLAYING = 'playing',
  ANIMATING = 'animating',
  CLEAR = 'clear',
  GAME_OVER = 'game_over',
}

/**
 * 화투 패 (Hwatu cards) — 12개월 + 특수 패
 * Each month has its own emoji/symbol for tile representation.
 */
export const HWATU_TILES: string[] = [
  '🌸',  // 1월 - 송학 (매화/벚꽃)
  '🐦',  // 2월 - 매조 (새)
  '🌿',  // 3월 - 벚꽃 (풀/허브)
  '🦅',  // 4월 - 등나무 (독수리)
  '🎋',  // 5월 - 난초 (대나무)
  '🦋',  // 6월 - 목단 (나비)
  '🐗',  // 7월 - 홍싸리 (멧돼지)
  '🌕',  // 8월 - 공산 (보름달)
  '🍶',  // 9월 - 국진 (술잔)
  '🦌',  // 10월 - 단풍 (사슴)
];
