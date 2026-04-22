import type { Car, BoardState, Direction, StageConfig } from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  const cars: Car[] = config.cars.map((c) => ({ ...c, exited: false }));
  const board = { cars, cols: config.cols, rows: config.rows };

  // Development validation: check for overlapping cars
  const occupancy = new Map<string, number>();
  for (const car of cars) {
    const cells = getCarCells(car);
    for (const [r, c] of cells) {
      const key = `${r},${c}`;
      if (occupancy.has(key)) {
        console.warn(`Stage ${config.stage}: Car ${car.id} overlaps with Car ${occupancy.get(key)} at (${r},${c})`);
      }
      occupancy.set(key, car.id);
    }
  }

  return board;
}

// ─── Occupancy Grid ──────────────────────────────────────

/** Build a 2D grid mapping (row, col) → carId or 0 */
export function buildOccupancy(board: BoardState): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < board.rows; r++) {
    grid.push(new Array(board.cols).fill(0));
  }
  for (const car of board.cars) {
    if (car.exited) continue;
    const cells = getCarCells(car);
    for (const [r, c] of cells) {
      if (r >= 0 && r < board.rows && c >= 0 && c < board.cols) {
        grid[r][c] = car.id;
      }
    }
  }
  return grid;
}

/** Get all cells occupied by a car */
export function getCarCells(car: Car): [number, number][] {
  const cells: [number, number][] = [];
  const isHorizontal = car.direction === 'left' || car.direction === 'right';
  for (let i = 0; i < car.length; i++) {
    if (isHorizontal) {
      cells.push([car.row, car.col + i]);
    } else {
      cells.push([car.row + i, car.col]);
    }
  }
  return cells;
}

// ─── Movement Logic ──────────────────────────────────────

/** Check if a car can move (path is clear to exit or needs to wait) */
export function canCarMove(board: BoardState, carId: number): boolean {
  const car = board.cars.find((c) => c.id === carId);
  if (!car || car.exited) return false;

  const grid = buildOccupancy(board);
  const path = getExitPath(car, board);

  // Check if all cells in the path are free (not occupied by another car)
  for (const [r, c] of path) {
    if (r >= 0 && r < board.rows && c >= 0 && c < board.cols) {
      if (grid[r][c] !== 0 && grid[r][c] !== carId) {
        return false; // Blocked by another car
      }
    }
  }
  return true;
}

/** Get the cells the car needs to pass through to exit the board */
export function getExitPath(car: Car, board: BoardState): [number, number][] {
  const path: [number, number][] = [];

  switch (car.direction) {
    case 'right': {
      // Move right: from rightmost cell+1 to right edge
      const startCol = car.col + car.length;
      for (let c = startCol; c < board.cols; c++) {
        path.push([car.row, c]);
      }
      break;
    }
    case 'left': {
      // Move left: from leftmost cell-1 to left edge
      for (let c = car.col - 1; c >= 0; c--) {
        path.push([car.row, c]);
      }
      break;
    }
    case 'down': {
      // Move down: from bottommost cell+1 to bottom edge
      const startRow = car.row + car.length;
      for (let r = startRow; r < board.rows; r++) {
        path.push([r, car.col]);
      }
      break;
    }
    case 'up': {
      // Move up: from topmost cell-1 to top edge
      for (let r = car.row - 1; r >= 0; r--) {
        path.push([r, car.col]);
      }
      break;
    }
  }

  return path;
}

/** Get the exit position (where the car drives off-screen) */
export function getExitTarget(car: Car, board: BoardState): { row: number; col: number } {
  switch (car.direction) {
    case 'right':
      return { row: car.row, col: board.cols };
    case 'left':
      return { row: car.row, col: -car.length };
    case 'down':
      return { row: board.rows, col: car.col };
    case 'up':
      return { row: -car.length, col: car.col };
  }
}

// ─── Execute Move ────────────────────────────────────────

/** Move a car: marks it as exited. Returns new board state */
export function executeMove(board: BoardState, carId: number): BoardState {
  const newCars = board.cars.map((c) => {
    if (c.id === carId) return { ...c, exited: true };
    return { ...c };
  });
  return { ...board, cars: newCars };
}

// ─── Win Check ───────────────────────────────────────────

export function isWon(board: BoardState): boolean {
  return board.cars.every((c) => c.exited);
}

/** Count remaining (non-exited) cars */
export function remainingCars(board: BoardState): number {
  return board.cars.filter((c) => !c.exited).length;
}
