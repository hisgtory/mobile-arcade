import {
  GRID_COLS,
  GRID_ROWS,
  type CarDef,
  type BoardState,
  type StageConfig,
  type ExitDef,
} from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  return {
    cars: config.cars.map((c) => ({ ...c })),
    exit: { ...config.exit },
    cols: GRID_COLS,
    rows: GRID_ROWS,
  };
}

// ─── Occupancy Grid ──────────────────────────────────────

/** Build a 2D grid where each cell = car ID or -1 */
export function buildOccupancy(cars: CarDef[], rows: number, cols: number): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(cols).fill(-1));
  }
  for (const car of cars) {
    for (let i = 0; i < car.length; i++) {
      const r = car.dir === 'V' ? car.row + i : car.row;
      const c = car.dir === 'H' ? car.col + i : car.col;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c] = car.id;
      }
    }
  }
  return grid;
}

// ─── Movement Range ──────────────────────────────────────

/** Calculate how far a car can move in its axis (negative = backward, positive = forward) */
export function getMovementRange(
  car: CarDef,
  cars: CarDef[],
  rows: number,
  cols: number,
): { min: number; max: number } {
  const grid = buildOccupancy(cars, rows, cols);

  if (car.dir === 'H') {
    // Move left
    let minCol = car.col;
    for (let c = car.col - 1; c >= 0; c--) {
      if (grid[car.row][c] !== -1 && grid[car.row][c] !== car.id) break;
      minCol = c;
    }
    // Move right
    let maxCol = car.col;
    const endCol = car.col + car.length - 1;
    for (let c = endCol + 1; c < cols; c++) {
      if (grid[car.row][c] !== -1 && grid[car.row][c] !== car.id) break;
      maxCol = car.col + (c - endCol);
    }
    return { min: minCol, max: maxCol };
  } else {
    // Move up
    let minRow = car.row;
    for (let r = car.row - 1; r >= 0; r--) {
      if (grid[r][car.col] !== -1 && grid[r][car.col] !== car.id) break;
      minRow = r;
    }
    // Move down
    let maxRow = car.row;
    const endRow = car.row + car.length - 1;
    for (let r = endRow + 1; r < rows; r++) {
      if (grid[r][car.col] !== -1 && grid[r][car.col] !== car.id) break;
      maxRow = car.row + (r - endRow);
    }
    return { min: minRow, max: maxRow };
  }
}

// ─── Move Car ────────────────────────────────────────────

/** Move a car to a new position (col for H, row for V). Returns new cars array. */
export function moveCar(cars: CarDef[], carId: number, newPos: number): CarDef[] {
  return cars.map((c) => {
    if (c.id !== carId) return c;
    if (c.dir === 'H') {
      return { ...c, col: newPos };
    } else {
      return { ...c, row: newPos };
    }
  });
}

// ─── Win Check ───────────────────────────────────────────

/** Check if the player car can exit (path to exit is clear after moving) */
export function isWon(cars: CarDef[], exit: ExitDef): boolean {
  const player = cars.find((c) => c.isPlayer);
  if (!player) return false;

  if (exit.side === 'right') {
    // Player must be horizontal and on the exit row
    if (player.dir !== 'H' || player.row !== exit.row) return false;
    // Player's right end must reach the exit col
    return player.col + player.length - 1 >= exit.col;
  }
  if (exit.side === 'bottom') {
    if (player.dir !== 'V' || player.col !== exit.col) return false;
    return player.row + player.length - 1 >= exit.row;
  }
  return false;
}

/** Check if moving player car to edge wins (path clear to exit) */
export function canPlayerExit(
  cars: CarDef[],
  exit: ExitDef,
  rows: number,
  cols: number,
): boolean {
  const player = cars.find((c) => c.isPlayer);
  if (!player) return false;
  const grid = buildOccupancy(cars, rows, cols);

  if (exit.side === 'right' && player.dir === 'H' && player.row === exit.row) {
    // Check if path from player's right end to exit is clear
    const endCol = player.col + player.length;
    for (let c = endCol; c <= exit.col; c++) {
      if (c < cols && grid[player.row][c] !== -1 && grid[player.row][c] !== player.id) {
        return false;
      }
    }
    return true;
  }

  if (exit.side === 'bottom' && player.dir === 'V' && player.col === exit.col) {
    const endRow = player.row + player.length;
    for (let r = endRow; r <= exit.row; r++) {
      if (r < rows && grid[r][player.col] !== -1 && grid[r][player.col] !== player.id) {
        return false;
      }
    }
    return true;
  }

  return false;
}
