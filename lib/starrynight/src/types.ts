/**
 * Starry Night type definitions
 *
 * Block puzzle with a starry-night theme.
 * Same core mechanics as BlockRush: 10x10 grid, drag pieces, clear full rows/cols.
 */

export enum GamePhase {
  PLAYING = 'playing',
  ANIMATING = 'animating',
  GAME_OVER = 'game_over',
}

export interface GameConfig {
  onGameOver?: () => void;
}

/** A piece is a set of relative cell positions */
export interface PieceShape {
  cells: { row: number; col: number }[];
  color: number; // hex color
}

export const GRID_SIZE = 10;

// Starry Night block colors — cosmic palette
export const BLOCK_COLORS: number[] = [
  0xfbbf24, // golden star
  0x818cf8, // lavender
  0x38bdf8, // sky blue
  0xf472b6, // pink nebula
  0x34d399, // aurora green
  0xfb923c, // warm amber
  0xa78bfa, // violet
];

// All possible piece shapes (tetromino-inspired + extras)
export const PIECE_SHAPES: { row: number; col: number }[][] = [
  // Single
  [{ row: 0, col: 0 }],
  // 1x2
  [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  // 1x3
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
  // 1x4
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
  // 2x1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }],
  // 3x1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  // 4x1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }],
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
  // 3x3
  [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
  ],
  // 1x5
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }],
  // 5x1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }, { row: 4, col: 0 }],
];

export function randomPiece(): PieceShape {
  const shape = PIECE_SHAPES[Math.floor(Math.random() * PIECE_SHAPES.length)];
  const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  return { cells: shape.map((c) => ({ ...c })), color };
}
