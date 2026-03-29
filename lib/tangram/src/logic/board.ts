import type { TriCell, BoardState, StageConfig, PlacedPiece, PieceDef } from '../types';
import { isUpTriangle } from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  const { gridRows, gridCols, silhouette, pieces: _ } = config;

  // Build grid: -2 = not part of silhouette, -1 = empty silhouette cell
  const grid: number[][] = [];
  for (let r = 0; r < gridRows; r++) {
    grid[r] = [];
    for (let c = 0; c < gridCols; c++) {
      grid[r][c] = -2;
    }
  }

  // Mark silhouette cells
  for (const cell of silhouette) {
    if (cell.row >= 0 && cell.row < gridRows && cell.col >= 0 && cell.col < gridCols) {
      grid[cell.row][cell.col] = -1;
    }
  }

  return {
    gridRows,
    gridCols,
    silhouette: silhouette.map((c) => ({ ...c })),
    placedPieces: [],
    grid,
  };
}

// ─── Piece Placement ─────────────────────────────────────

/** Check if a piece can be placed at the given position offset */
export function canPlace(
  board: BoardState,
  piece: PieceDef,
  offsetRow: number,
  offsetCol: number,
): boolean {
  for (const cell of piece.cells) {
    const r = cell.row + offsetRow;
    const c = cell.col + offsetCol;

    // Out of bounds
    if (r < 0 || r >= board.gridRows || c < 0 || c >= board.gridCols) return false;

    // Not part of silhouette
    if (board.grid[r][c] === -2) return false;

    // Already occupied by another piece
    if (board.grid[r][c] >= 0) return false;

    // Triangle orientation must match:
    // The piece cell (in its local coord) has an orientation based on (cell.row + cell.col) % 2
    // The board cell at (r, c) has an orientation based on (r + c) % 2
    // They must match for proper tessellation
    const pieceUp = isUpTriangle(cell.row, cell.col);
    const boardUp = isUpTriangle(r, c);
    if (pieceUp !== boardUp) return false;
  }

  return true;
}

/** Place a piece on the board, returns new board state */
export function placePiece(
  board: BoardState,
  piece: PieceDef,
  offsetRow: number,
  offsetCol: number,
): BoardState {
  const newGrid = board.grid.map((row) => [...row]);
  const placedCells: TriCell[] = [];

  for (const cell of piece.cells) {
    const r = cell.row + offsetRow;
    const c = cell.col + offsetCol;
    newGrid[r][c] = piece.id;
    placedCells.push({ row: r, col: c });
  }

  const newPlaced: PlacedPiece = {
    pieceId: piece.id,
    cells: placedCells,
    color: piece.color,
  };

  return {
    ...board,
    grid: newGrid,
    placedPieces: [...board.placedPieces, newPlaced],
  };
}

/** Remove a piece from the board, returns new board state */
export function removePiece(board: BoardState, pieceId: number): BoardState {
  const newGrid = board.grid.map((row) => [...row]);

  // Clear cells belonging to this piece
  for (let r = 0; r < board.gridRows; r++) {
    for (let c = 0; c < board.gridCols; c++) {
      if (newGrid[r][c] === pieceId) {
        newGrid[r][c] = -1; // back to empty silhouette
      }
    }
  }

  return {
    ...board,
    grid: newGrid,
    placedPieces: board.placedPieces.filter((p) => p.pieceId !== pieceId),
  };
}

/** Remove all pieces from the board */
export function resetBoard(board: BoardState): BoardState {
  const newGrid = board.grid.map((row) =>
    row.map((cell) => (cell >= 0 ? -1 : cell)),
  );

  return {
    ...board,
    grid: newGrid,
    placedPieces: [],
  };
}

// ─── Win Check ───────────────────────────────────────────

/** Check if all silhouette cells are filled */
export function isWon(board: BoardState): boolean {
  for (const cell of board.silhouette) {
    if (board.grid[cell.row][cell.col] < 0) return false;
  }
  return true;
}

// ─── Grid → Pixel coordinate helpers ─────────────────────

/** 
 * Compute the pixel coordinates of a triangle cell's vertices.
 * triSize = side length of each triangle.
 * Returns 3 vertices of the triangle.
 */
export function getTriangleVertices(
  row: number,
  col: number,
  triSize: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number }[] {
  const h = (triSize * Math.sqrt(3)) / 2; // height of equilateral triangle
  const up = isUpTriangle(row, col);

  // x position: each column is half a triangle width apart
  const cx = offsetX + col * (triSize / 2) + triSize / 2;

  // y position: each row is one triangle height
  const cy = offsetY + row * h + h / 2;

  if (up) {
    // △ upward pointing
    return [
      { x: cx, y: cy - h / 2 },                 // top
      { x: cx - triSize / 2, y: cy + h / 2 },   // bottom-left
      { x: cx + triSize / 2, y: cy + h / 2 },   // bottom-right
    ];
  } else {
    // ▽ downward pointing
    return [
      { x: cx - triSize / 2, y: cy - h / 2 },   // top-left
      { x: cx + triSize / 2, y: cy - h / 2 },   // top-right
      { x: cx, y: cy + h / 2 },                  // bottom
    ];
  }
}

/** Get center of a triangle cell */
export function getTriangleCenter(
  row: number,
  col: number,
  triSize: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  const verts = getTriangleVertices(row, col, triSize, offsetX, offsetY);
  return {
    x: (verts[0].x + verts[1].x + verts[2].x) / 3,
    y: (verts[0].y + verts[1].y + verts[2].y) / 3,
  };
}

/** Find which grid cell contains a given pixel coordinate */
export function pixelToCell(
  px: number,
  py: number,
  gridRows: number,
  gridCols: number,
  triSize: number,
  offsetX: number,
  offsetY: number,
): TriCell | null {
  // Brute-force point-in-triangle check for all cells
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const verts = getTriangleVertices(r, c, triSize, offsetX, offsetY);
      if (pointInTriangle(px, py, verts[0], verts[1], verts[2])) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function pointInTriangle(
  px: number,
  py: number,
  v0: { x: number; y: number },
  v1: { x: number; y: number },
  v2: { x: number; y: number },
): boolean {
  const d1 = sign(px, py, v0.x, v0.y, v1.x, v1.y);
  const d2 = sign(px, py, v1.x, v1.y, v2.x, v2.y);
  const d3 = sign(px, py, v2.x, v2.y, v0.x, v0.y);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function sign(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
}
