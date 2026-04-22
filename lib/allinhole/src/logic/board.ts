/**
 * Board logic for All in Hole
 *
 * The board is a grid where:
 * - Balls slide in a direction until hitting a wall/obstacle/edge
 * - If a ball slides onto a hole, it falls in (sunk)
 * - Goal: sink all balls with limited moves
 */

import { CellType, type CellPos, type BallData, type Direction, type StageConfig } from '../types';

export type Grid = CellType[][];

/** Seeded pseudo-random generator (Park-Miller LCG) for reproducible puzzles */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    // Park-Miller LCG: multiplier=16807, modulus=2^31-1
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Create a new board layout with holes, walls, and balls */
export function createBoard(config: StageConfig): { grid: Grid; balls: BallData[] } {
  // TODO: validate solvability after generation (BFS/DFS check)
  const { rows, cols, ballCount, holeCount, wallCount, stage } = config;
  const rng = seededRandom(stage * 1000 + rows * 100 + cols);

  // Initialize empty grid
  const grid: Grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => CellType.EMPTY),
  );

  // Collect all cell positions (excluding edges for variety)
  const positions: CellPos[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({ row: r, col: c });
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let idx = 0;

  // Place holes
  const holeCells: CellPos[] = [];
  for (let i = 0; i < holeCount && idx < positions.length; i++, idx++) {
    const pos = positions[idx];
    grid[pos.row][pos.col] = CellType.HOLE;
    holeCells.push(pos);
  }

  // Place walls
  for (let i = 0; i < wallCount && idx < positions.length; i++, idx++) {
    const pos = positions[idx];
    grid[pos.row][pos.col] = CellType.WALL;
  }

  // Place balls on remaining empty cells
  const balls: BallData[] = [];
  let ballId = 0;
  for (let i = 0; i < ballCount && idx < positions.length; i++, idx++) {
    const pos = positions[idx];
    balls.push({
      id: ballId++,
      color: i % 8,
      row: pos.row,
      col: pos.col,
      sunk: false,
    });
  }

  return { grid, balls };
}

/** Get the direction vector for a swipe */
function getDirVector(dir: Direction): { dr: number; dc: number } {
  switch (dir) {
    case 'up': return { dr: -1, dc: 0 };
    case 'down': return { dr: 1, dc: 0 };
    case 'left': return { dr: 0, dc: -1 };
    case 'right': return { dr: 0, dc: 1 };
  }
}

/** Check if position is inside the grid */
function inBounds(row: number, col: number, rows: number, cols: number): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

/**
 * Slide all active balls in the given direction.
 * Returns an array of moves: { ballId, from, to, sunk }
 *
 * Each ball slides until it hits:
 * 1. Grid edge
 * 2. A wall cell
 * 3. Another ball (that has already stopped)
 *
 * If a ball passes over or lands on a HOLE, it falls in (sunk).
 */
export function slideAll(
  grid: Grid,
  balls: BallData[],
  dir: Direction,
): { ballId: number; from: CellPos; to: CellPos; sunk: boolean }[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const { dr, dc } = getDirVector(dir);

  // Sort balls in slide order so they don't pass through each other
  const activeBalls = balls.filter((b) => !b.sunk);
  const sorted = [...activeBalls].sort((a, b) => {
    if (dir === 'up') return a.row - b.row;
    if (dir === 'down') return b.row - a.row;
    if (dir === 'left') return a.col - b.col;
    return b.col - a.col; // right
  });

  // Track occupied positions (only active non-sunk balls that have stopped)
  const occupied = new Set<string>();
  for (const ball of balls) {
    if (!ball.sunk) {
      occupied.add(`${ball.row},${ball.col}`);
    }
  }

  const moves: { ballId: number; from: CellPos; to: CellPos; sunk: boolean }[] = [];

  for (const ball of sorted) {
    const from: CellPos = { row: ball.row, col: ball.col };
    occupied.delete(`${ball.row},${ball.col}`);

    let r = ball.row;
    let c = ball.col;
    let sunk = false;

    while (true) {
      const nr = r + dr;
      const nc = c + dc;

      // Check bounds
      if (!inBounds(nr, nc, rows, cols)) break;

      // Check wall
      if (grid[nr][nc] === CellType.WALL) break;

      // Check other stopped ball
      if (occupied.has(`${nr},${nc}`)) break;

      r = nr;
      c = nc;

      // Check if we landed on a hole
      if (grid[r][c] === CellType.HOLE) {
        sunk = true;
        break;
      }
    }

    // Only record a move if position changed or ball sunk
    if (r !== from.row || c !== from.col || sunk) {
      ball.row = r;
      ball.col = c;
      ball.sunk = sunk;

      if (!sunk) {
        occupied.add(`${r},${c}`);
      }

      moves.push({
        ballId: ball.id,
        from,
        to: { row: r, col: c },
        sunk,
      });
    } else {
      occupied.add(`${ball.row},${ball.col}`);
    }
  }

  return moves;
}

/** Check if all balls are sunk */
export function allSunk(balls: BallData[]): boolean {
  return balls.every((b) => b.sunk);
}

/** Count remaining active balls */
export function activeBallCount(balls: BallData[]): number {
  return balls.filter((b) => !b.sunk).length;
}
