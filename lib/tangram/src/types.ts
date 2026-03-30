// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Triangle Grid ───────────────────────────────────────
/**
 * Triangle grid coordinate system:
 * - row/col identify a cell in the grid
 * - Each cell is a triangle. isUp = (row + col) % 2 === 0 → upward △, else downward ▽
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
  /** Base cells (rotation index 0). Use getRotatedCells() for current rotation. */
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

// ─── Rotation Variants ───────────────────────────────────
/**
 * Returns all rotation variants for a given set of cells.
 * Each variant is a valid connected piece shape rotated ~60° from the previous.
 */
export function getRotationVariants(cells: TriCell[]): TriCell[][] {
  if (cells.length <= 1) return [cells.map((c) => ({ ...c }))];

  const isHorizontal = cells.every((c) => c.row === cells[0].row);

  if (cells.length === 2 && isHorizontal) {
    return [
      [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      [{ row: 0, col: 0 }, { row: 1, col: 0 }],
    ];
  }

  if (cells.length === 3 && isHorizontal) {
    return [
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }],
      [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
    ];
  }

  if (cells.length === 4 && isHorizontal) {
    return [
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }],
    ];
  }

  // Default: return original cells only
  return [cells.map((c) => ({ ...c }))];
}

/** Get the rotated cells for a piece at a given rotation index */
export function getRotatedCells(cells: TriCell[], rotation: number): TriCell[] {
  const variants = getRotationVariants(cells);
  const idx = ((rotation % variants.length) + variants.length) % variants.length;
  return variants[idx].map((c) => ({ ...c }));
}

// ─── Stage Definitions ───────────────────────────────────

export function getStageConfig(stageNum: number): StageConfig {
  const stages = getAllStages();
  if (stageNum >= 1 && stageNum <= stages.length) {
    return stages[stageNum - 1];
  }
  // Fallback: cycle through stages (guard negative values)
  const safeNum = Math.max(1, stageNum);
  const idx = ((safeNum - 1) % stages.length);
  const base = stages[idx];
  return { ...base, stage: stageNum };
}

export function getTotalStages(): number {
  return getAllStages().length;
}

/**
 * All stages are designed so that each piece, placed at a specific offset,
 * exactly covers part of the silhouette. Each stage is verified solvable:
 * the union of all pieces (each at their solution offset) equals the silhouette.
 *
 * Solution offsets are documented in comments for each stage.
 */
function getAllStages(): StageConfig[] {
  return [
    // ─── Stage 1: Simple diamond (2 cells, 1 piece) ────
    // Solution: piece 0 at offset (1,2) → fills (1,2),(1,3)
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
    // ─── Stage 2: Three in a row (3 cells, 2 pieces) ────
    // Solution: piece 0 at (1,2)→(1,2),(1,3); piece 1 at (1,4)→(1,4)
    {
      stage: 2,
      gridRows: 4,
      gridCols: 8,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[0] },
        { id: 1, cells: [{ row: 0, col: 0 }], color: PIECE_COLORS[1] },
      ],
    },
    // ─── Stage 3: Four in a row (4 cells, 2 pieces) ────
    // Solution: piece 0 at (1,2)→(1,2),(1,3); piece 1 at (1,4)→(1,4),(1,5)
    {
      stage: 3,
      gridRows: 4,
      gridCols: 8,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[0] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[2] },
      ],
    },
    // ─── Stage 4: Five cells (5 cells, 2 pieces) ────
    // Solution: piece 0 at (1,2)→(1,2),(1,3),(1,4); piece 1 at (1,5)→(1,5),(1,6)
    {
      stage: 4,
      gridRows: 4,
      gridCols: 10,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
        { row: 1, col: 5 }, { row: 1, col: 6 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[3] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[4] },
      ],
    },
    // ─── Stage 5: Two rows (6 cells, 2 pieces) ────
    // Solution: piece 0 at (1,2)→(1,2),(1,3),(1,4); piece 1 at (2,2)→(2,2),(2,3),(2,4)
    {
      stage: 5,
      gridRows: 5,
      gridCols: 8,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[5] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[6] },
      ],
    },
    // ─── Stage 6: T-shape (6 cells, 3 pieces) ────
    // Solution: piece 0 at (1,2)→(1,2),(1,3); piece 1 at (1,4)→(1,4),(1,5);
    //           piece 2 at (2,3)→(2,3),(2,4)
    {
      stage: 6,
      gridRows: 5,
      gridCols: 8,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
        { row: 2, col: 3 }, { row: 2, col: 4 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[0] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[1] },
        { id: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[7] },
      ],
    },
    // ─── Stage 7: Rectangle (8 cells, 3 pieces) ────
    // Solution: piece 0 at (1,2)→row 1 cols 2-5; piece 1 at (2,2)→(2,2),(2,3);
    //           piece 2 at (2,4)→(2,4),(2,5)
    {
      stage: 7,
      gridRows: 5,
      gridCols: 10,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }], color: PIECE_COLORS[1] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[2] },
        { id: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[3] },
      ],
    },
    // ─── Stage 8: Cross shape (8 cells, 3 pieces) ────
    // Solution: piece 0 at (1,3)→(1,3),(1,4); piece 1 at (2,2)→(2,2),(2,3),(2,4),(2,5);
    //           piece 2 at (3,3)→(3,3),(3,4)
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
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[4] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }], color: PIECE_COLORS[5] },
        { id: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[6] },
      ],
    },
    // ─── Stage 9: 3×3 block (9 cells, 3 pieces) ────
    // Solution: piece 0 at (1,2)→row 1 cols 2-4; piece 1 at (2,2)→row 2 cols 2-4;
    //           piece 2 at (3,2)→row 3 cols 2-4
    {
      stage: 9,
      gridRows: 6,
      gridCols: 8,
      silhouette: [
        { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
        { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[0] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[1] },
        { id: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], color: PIECE_COLORS[7] },
      ],
    },
    // ─── Stage 10: Arrow shape (10 cells, 4 pieces) ────
    // Solution: piece 0 at (1,3)→(1,3),(1,4); piece 1 at (2,2)→row 2 cols 2-5;
    //           piece 2 at (3,2)→(3,2),(3,3); piece 3 at (3,4)→(3,4),(3,5)
    {
      stage: 10,
      gridRows: 6,
      gridCols: 10,
      silhouette: [
        { row: 1, col: 3 }, { row: 1, col: 4 },
        { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
        { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
      ],
      pieces: [
        { id: 0, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[2] },
        { id: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }], color: PIECE_COLORS[3] },
        { id: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[4] },
        { id: 3, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], color: PIECE_COLORS[5] },
      ],
    },
  ];
}
