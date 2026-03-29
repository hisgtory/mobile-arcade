// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Triangle Grid ───────────────────────────────────────
/**
 * Triangle grid coordinate system:
 * - row/col identify a cell in the grid
 * - Each cell is a triangle. Even col = upward △, odd col = downward ▽
 *   (or vice-versa depending on row parity, but we use:
 *    isUp = (row + col) % 2 === 0)
 */
export interface TriCell {
  row: number;
  col: number;
}

/** Whether this cell is an upward-pointing triangle */
export function isUpTriangle(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}

// ─── Piece Colors ────────────────────────────────────────
export const PIECE_COLORS: readonly string[] = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
] as const;

// ─── Piece Definitions ──────────────────────────────────
export interface PieceDef {
  id: number;
  cells: TriCell[];
  color: string;
}

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  /** Grid dimensions (rows × cols of triangle cells) */
  gridRows: number;
  gridCols: number;
  /** Which cells form the target silhouette */
  silhouette: TriCell[];
  /** Pieces the player must place */
  pieces: PieceDef[];
}

// ─── Board State ─────────────────────────────────────────
export interface PlacedPiece {
  pieceId: number;
  cells: TriCell[];
  color: string;
}

export interface BoardState {
  gridRows: number;
  gridCols: number;
  silhouette: TriCell[];
  placedPieces: PlacedPiece[];
  /** Grid of piece IDs (-1 = empty silhouette, -2 = not silhouette, >= 0 = piece ID) */
  grid: number[][];
}

// ─── Game Config ─────────────────────────────────────────
export interface GameConfig {
  stage?: number;
}

// ─── Stage Definitions ───────────────────────────────────
export function getStageConfig(stageNum: number): StageConfig {
  const stages = getAllStages();
  if (stageNum >= 1 && stageNum <= stages.length) {
    return stages[stageNum - 1];
  }
  // Fallback: cycle through stages
  const idx = ((stageNum - 1) % stages.length);
  const base = stages[idx];
  return { ...base, stage: stageNum };
}

export function getTotalStages(): number {
  return getAllStages().length;
}

function getAllStages(): StageConfig[] {
  return [
    // ─── Stage 1: Simple diamond (2 triangles) ────
    {
      stage: 1,
      gridRows: 4,
      gridCols: 6,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[0] },
      ],
    },
    // ─── Stage 2: Three triangles in a row ────
    {
      stage: 2,
      gridRows: 4,
      gridCols: 6,
      silhouette: [
        { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[0] },
        { id: 1, cells: [{ row: 0, col: 0 }], color: PIECE_COLORS[1] },
      ],
    },
    // ─── Stage 3: Hexagon shape (6 triangles) ────
    {
      stage: 3,
      gridRows: 4,
      gridCols: 8,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[0] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[1] },
      ],
    },
    // ─── Stage 4: L-shape (4 triangles) ────
    {
      stage: 4,
      gridRows: 4,
      gridCols: 8,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 },
        { row: 2, col: 2 }, { row: 2, col: 3 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[2] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[3] },
      ],
    },
    // ─── Stage 5: Arrow shape (5 triangles) ────
    {
      stage: 5,
      gridRows: 6,
      gridCols: 8,
      silhouette: [
        { row: 1, col: 3 },
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
        { row: 3, col: 3 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[4] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[5] },
      ],
    },
    // ─── Stage 6: Big diamond (4 triangles, 2x2 block) ────
    {
      stage: 6,
      gridRows: 6,
      gridCols: 8,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
        { row: 2, col: 2 }, { row: 2, col: 3 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[0] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[6] },
      ],
    },
    // ─── Stage 7: Wide shape (7 triangles) ────
    {
      stage: 7,
      gridRows: 6,
      gridCols: 10,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
        { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }], color: PIECE_COLORS[1] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[2] },
      ],
    },
    // ─── Stage 8: Cross shape (8 triangles) ────
    {
      stage: 8,
      gridRows: 6,
      gridCols: 10,
      silhouette: [
        { row: 1, col: 3 }, { row: 1, col: 4 },
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
        { row: 3, col: 3 }, { row: 3, col: 4 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[3] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[4] },
        { id: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[5] },
      ],
    },
    // ─── Stage 9: Large shape (9 triangles) ────
    {
      stage: 9,
      gridRows: 6,
      gridCols: 10,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
        { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[0] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[1] },
        { id: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[6] },
      ],
    },
    // ─── Stage 10: Complex shape (10 triangles) ────
    {
      stage: 10,
      gridRows: 8,
      gridCols: 10,
      silhouette: [
        { row: 1, col: 3 }, { row: 1, col: 4 },
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
        { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[2] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[3] },
        { id: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[4] },
        { id: 3, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[5] },
      ],
    },
  ];
}
