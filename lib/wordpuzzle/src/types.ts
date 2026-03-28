export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 680;

export interface WordEntry {
  word: string;
  direction: 'h' | 'v';
  row: number;
  col: number;
}

export interface PuzzleData {
  id: number;
  gridRows: number;
  gridCols: number;
  words: WordEntry[];
  letters: string[];
}

export interface StageConfig {
  stage: number;
  puzzleId: number;
}

export interface GameConfig {
  stage?: number;
}

export interface GameResult {
  score: number;
  wordsFound: number;
  totalWords: number;
  cleared: boolean;
}
