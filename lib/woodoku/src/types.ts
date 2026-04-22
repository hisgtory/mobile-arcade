/**
 * Woodoku type definitions
 *
 * 9×9 grid with 3×3 sub-grid regions (like Sudoku layout).
 * Place blocks; clear full rows, columns, or 3×3 regions.
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

export const GRID_SIZE = 9;
export const REGION_SIZE = 3; // 3×3 sub-grid

// Wood-toned block colors — warm, earthy palette
export const BLOCK_COLORS: number[] = [
  0xc0784b, // warm wood
  0x8b5e3c, // dark walnut
  0xd4a373, // light oak
  0xa0522d, // sienna
  0x6b4226, // espresso
  0xe8c07a, // blonde wood
  0x9b7653, // teak
];

// All possible piece shapes (block-puzzle standard)
export const PIECE_SHAPES: { row: number; col: number }[][] = [
  // Single
  [{ row: 0, col: 0 }],
  // 1×2
  [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  // 1×3
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
  // 1×4
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
  // 1×5
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }],
  // 2×1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }],
  // 3×1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  // 4×1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }],
  // 5×1
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }, { row: 4, col: 0 }],
  // 2×2
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  // 3×3
  [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
  ],
  // L shape
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 2, col: 1 }],
  // Reverse L
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  // L right
  [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 1 }],
  // L bottom-right
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
  // T shape
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }],
  // S shape
  [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  // Z shape
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
  // Corner 2×2 (top-left missing)
  [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  // Corner 2×2 (top-right missing)
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  // Corner 2×2 (bottom-left missing)
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }],
  // Corner 2×2 (bottom-right missing)
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }],
];

export function randomPiece(): PieceShape {
  const shape = PIECE_SHAPES[Math.floor(Math.random() * PIECE_SHAPES.length)];
  const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  return { cells: shape.map((c) => ({ ...c })), color };
}
