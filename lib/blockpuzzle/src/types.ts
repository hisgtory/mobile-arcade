/**
 * Block Puzzle type definitions
 */

export const BOARD_ROWS = 8;
export const BOARD_COLS = 8;
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 680;

// ─── Piece ───────────────────────────────────────────────

/** A piece shape as a boolean grid (true = filled cell) */
export type PieceShape = boolean[][];

export interface Piece {
  shape: PieceShape;
  color: number;
}

// ─── Piece Catalog ───────────────────────────────────────

export const PIECE_CATALOG: PieceShape[] = [
  // 1×1
  [[true]],

  // 1×2, 2×1
  [[true, true]],
  [[true], [true]],

  // 1×3, 3×1
  [[true, true, true]],
  [[true], [true], [true]],

  // 1×4, 4×1
  [[true, true, true, true]],
  [[true], [true], [true], [true]],

  // 1×5, 5×1
  [[true, true, true, true, true]],
  [[true], [true], [true], [true], [true]],

  // 2×2
  [
    [true, true],
    [true, true],
  ],

  // 3×3
  [
    [true, true, true],
    [true, true, true],
    [true, true, true],
  ],

  // L shapes
  [
    [true, false],
    [true, false],
    [true, true],
  ],
  [
    [false, true],
    [false, true],
    [true, true],
  ],
  [
    [true, true],
    [true, false],
    [true, false],
  ],
  [
    [true, true],
    [false, true],
    [false, true],
  ],

  // T shapes
  [
    [true, true, true],
    [false, true, false],
  ],
  [
    [true, false],
    [true, true],
    [true, false],
  ],
  [
    [false, true, false],
    [true, true, true],
  ],
  [
    [false, true],
    [true, true],
    [false, true],
  ],

  // S / Z
  [
    [false, true, true],
    [true, true, false],
  ],
  [
    [true, true, false],
    [false, true, true],
  ],
];

// ─── Colors ──────────────────────────────────────────────

export const JEWEL_COLORS: number[] = [
  0xe74c3c, // ruby red
  0x3498db, // sapphire blue
  0x2ecc71, // emerald green
  0xf39c12, // amber
  0x9b59b6, // amethyst
  0x1abc9c, // turquoise
  0xe67e22, // tangerine
  0xf1c40f, // topaz yellow
];

// ─── Game ────────────────────────────────────────────────

export type GamePhase = 'playing' | 'over';

export interface GameConfig {
  onGameOver?: () => void;
}
