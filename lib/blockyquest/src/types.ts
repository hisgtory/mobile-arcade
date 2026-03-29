/**
 * Blocky Quest type definitions
 *
 * Block Blast variant with quest-based stages.
 * 8x8 grid. Drag block pieces to place. Clear full rows/cols.
 * Each stage has a target score within limited pieces.
 */

export const GRID_SIZE = 8;

export enum GamePhase {
  PLAYING = 'playing',
  ANIMATING = 'animating',
  CLEAR = 'clear',
  GAME_OVER = 'game_over',
}

export interface GameConfig {
  stage?: number;
  onClear?: () => void;
  onGameOver?: () => void;
}

export interface StageConfig {
  stage: number;
  /** Number of piece sets given (each set = 3 pieces) */
  pieceSets: number;
  /** Target score to clear the stage */
  targetScore: number;
  /** Available piece pool indices (harder stages get trickier pieces) */
  piecePoolSize: number;
}

/** A piece is a set of relative cell positions */
export interface PieceShape {
  cells: { row: number; col: number }[];
  color: number;
}

// Block colors — vibrant, distinct
export const BLOCK_COLORS: number[] = [
  0x3b82f6, // blue
  0xef4444, // red
  0x22c55e, // green
  0xf59e0b, // amber
  0x8b5cf6, // purple
  0xec4899, // pink
  0x06b6d4, // cyan
  0xf97316, // orange
];

// All possible piece shapes
export const PIECE_SHAPES: { row: number; col: number }[][] = [
  // Single
  [{ row: 0, col: 0 }],
  // 1x2
  [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  // 1x3
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
  // 2x1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }],
  // 3x1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  // 2x2
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  // L shape
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 2, col: 1 }],
  // Reverse L
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  // T shape
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }],
  // S shape
  [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  // Z shape
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
  // 1x4
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
  // 4x1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }],
  // 3x3
  [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
  ],
];

export function randomPiece(poolSize?: number): PieceShape {
  const pool = poolSize ? Math.min(poolSize, PIECE_SHAPES.length) : PIECE_SHAPES.length;
  const shape = PIECE_SHAPES[Math.floor(Math.random() * pool)];
  const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  return { cells: shape.map((c) => ({ ...c })), color };
}
