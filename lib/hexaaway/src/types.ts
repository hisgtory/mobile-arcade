/**
 * Hexa Away – type definitions
 *
 * Hexagonal block puzzle on an axial-coordinate hex grid.
 * Board is a regular hexagon of radius BOARD_RADIUS.
 */

// ─── Constants ───────────────────────────────────────────
export const BOARD_RADIUS = 4; // cells from center → 37 total cells
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Axial coordinate ────────────────────────────────────
export interface Hex {
  q: number;
  r: number;
}

// ─── Game phase ──────────────────────────────────────────
export enum GamePhase {
  PLAYING = 'playing',
  ANIMATING = 'animating',
  GAME_OVER = 'game_over',
}

// ─── Config ──────────────────────────────────────────────
export interface GameConfig {
  onGameOver?: () => void;
}

// ─── Piece ───────────────────────────────────────────────
export interface PieceShape {
  cells: Hex[];
  color: number; // hex colour
}

// ─── Block colours — vibrant, distinct ───────────────────
export const BLOCK_COLORS: number[] = [
  0xfa6c41, // orange
  0x2563eb, // blue
  0x8b5cf6, // purple
  0x059669, // green
  0xf43f5e, // rose
  0xd97706, // amber
  0x06b6d4, // cyan
];

// ─── Piece shapes (axial offsets from origin) ────────────
export const PIECE_SHAPES: Hex[][] = [
  // ── 1-cell ──
  [{ q: 0, r: 0 }],

  // ── 2-cell lines ──
  [{ q: 0, r: 0 }, { q: 1, r: 0 }],
  [{ q: 0, r: 0 }, { q: 0, r: 1 }],
  [{ q: 0, r: 0 }, { q: -1, r: 1 }],

  // ── 3-cell lines ──
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }],
  [{ q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }],
  [{ q: 0, r: 0 }, { q: 1, r: -1 }, { q: 2, r: -2 }],

  // ── Triangles (3-cell) ──
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 1, r: -1 }],

  // ── Angle / L shapes (3-cell) ──
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 1, r: 1 }],
  [{ q: 0, r: 0 }, { q: -1, r: 1 }, { q: -1, r: 2 }],
  [{ q: 0, r: 0 }, { q: 0, r: 1 }, { q: 1, r: 0 }],

  // ── 4-cell line ──
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }],

  // ── Rhombus (4-cell) ──
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: 1, r: 1 }],

  // ── T-shape (4-cell) ──
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 1, r: 1 }],

  // ── Flower (7-cell: center + 6 neighbours) ──
  [
    { q: 0, r: 0 },
    { q: 1, r: 0 }, { q: -1, r: 0 },
    { q: 0, r: 1 }, { q: 0, r: -1 },
    { q: 1, r: -1 }, { q: -1, r: 1 },
  ],
];

export function randomPiece(): PieceShape {
  const shape = PIECE_SHAPES[Math.floor(Math.random() * PIECE_SHAPES.length)];
  const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  return { cells: shape.map((c) => ({ ...c })), color };
}

// ─── Hex math helpers ────────────────────────────────────

/** Key for Map / Set usage */
export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/** Third cube-coordinate */
export function hexS(q: number, r: number): number {
  return -q - r;
}

/** Is (q,r) inside a hex board of given radius? */
export function hexInBoard(q: number, r: number, radius: number): boolean {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= radius;
}

/**
 * Flat-top hex → pixel.
 * Returns the centre pixel of the hex at (q, r).
 */
export function hexToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * (3 / 2) * q;
  const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x, y };
}
