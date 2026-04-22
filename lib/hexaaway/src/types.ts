/**
 * HexaAway type definitions
 *
 * Hexagonal block puzzle — endless mode.
 * Axial coordinate system (q, r) with pointy-top hexagons.
 */

export enum GamePhase {
  PLAYING = 'playing',
  ANIMATING = 'animating',
  GAME_OVER = 'game_over',
}

export interface GameConfig {
  onGameOver?: () => void;
}

/** Axial hex coordinate */
export interface HexCoord {
  q: number;
  r: number;
}

/** A piece is a set of relative hex positions + color */
export interface PieceShape {
  cells: HexCoord[];
  color: number;
}

/** Board radius — valid cells: max(|q|, |r|, |q+r|) <= BOARD_RADIUS */
export const BOARD_RADIUS = 4;

// Tile colors — vibrant, distinct
export const TILE_COLORS: number[] = [
  0xfa6c41, // orange
  0x2563eb, // blue
  0x8b5cf6, // purple
  0x059669, // green
  0xf43f5e, // rose
  0xd97706, // amber
  0x06b6d4, // cyan
];

/**
 * Piece templates in axial coordinates (q, r).
 * Each template is an array of relative hex positions.
 */
export const PIECE_TEMPLATES: HexCoord[][] = [
  // Single
  [{ q: 0, r: 0 }],
  // Line-2 (horizontal)
  [{ q: 0, r: 0 }, { q: 1, r: 0 }],
  // Line-2 (diagonal ↘)
  [{ q: 0, r: 0 }, { q: 0, r: 1 }],
  // Line-2 (diagonal ↙)
  [{ q: 0, r: 0 }, { q: -1, r: 1 }],
  // Line-3 (horizontal)
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }],
  // Line-3 (diagonal ↘)
  [{ q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }],
  // Line-3 (diagonal ↙)
  [{ q: 0, r: 0 }, { q: -1, r: 1 }, { q: -2, r: 2 }],
  // Triangle ▽
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }],
  // Triangle △
  [{ q: 0, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }],
  // Line-4 (horizontal)
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }],
  // Line-4 (diagonal ↘)
  [{ q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }, { q: 0, r: 3 }],
  // Line-4 (diagonal ↙)
  [{ q: 0, r: 0 }, { q: -1, r: 1 }, { q: -2, r: 2 }, { q: -3, r: 3 }],
  // Hexagonal flower (7 cells — center + 6 neighbors)
  [
    { q: 0, r: 0 },
    { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
    { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 },
  ],
  // L-shape
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }],
  // Zigzag
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 2 }],
];

export function randomPiece(): PieceShape {
  const template = PIECE_TEMPLATES[Math.floor(Math.random() * PIECE_TEMPLATES.length)];
  const color = TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)];
  return { cells: template.map((c) => ({ ...c })), color };
}
