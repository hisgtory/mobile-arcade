import { GRID_COLS, GRID_ROWS, type Vehicle, type BoardState, type StageConfig } from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  return {
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    vehicles: config.vehicles.map((v) => ({ ...v })),
  };
}

// ─── Cell Helpers ────────────────────────────────────────

export function getVehicleCells(vehicle: Vehicle): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < vehicle.length; i++) {
    if (vehicle.direction === 'left' || vehicle.direction === 'right') {
      // Horizontal vehicle
      cells.push({ row: vehicle.row, col: vehicle.col + i });
    } else {
      // Vertical vehicle
      cells.push({ row: vehicle.row + i, col: vehicle.col });
    }
  }
  return cells;
}

/** Build a grid occupancy map (cell → vehicleId) */
function buildOccupancy(board: BoardState): Map<string, string> {
  const map = new Map<string, string>();
  for (const v of board.vehicles) {
    for (const cell of getVehicleCells(v)) {
      map.set(`${cell.row},${cell.col}`, v.id);
    }
  }
  return map;
}

// ─── Path & Exit Logic ──────────────────────────────────

/**
 * Check if the path from a vehicle to the grid edge in its direction
 * is clear of other vehicles.
 */
export function isPathClear(board: BoardState, vehicleId: string): boolean {
  const vehicle = board.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return false;

  const occupancy = buildOccupancy(board);
  const cells = getVehicleCells(vehicle);

  switch (vehicle.direction) {
    case 'right': {
      // Check from rightmost cell to right edge
      const rightmost = Math.max(...cells.map((c) => c.col));
      const row = vehicle.row;
      for (let col = rightmost + 1; col < board.gridCols; col++) {
        const occupant = occupancy.get(`${row},${col}`);
        if (occupant && occupant !== vehicleId) return false;
      }
      return true;
    }
    case 'left': {
      // Check from leftmost cell to left edge
      const leftmost = Math.min(...cells.map((c) => c.col));
      const row = vehicle.row;
      for (let col = leftmost - 1; col >= 0; col--) {
        const occupant = occupancy.get(`${row},${col}`);
        if (occupant && occupant !== vehicleId) return false;
      }
      return true;
    }
    case 'down': {
      // Check from bottommost cell to bottom edge
      const bottommost = Math.max(...cells.map((c) => c.row));
      const col = vehicle.col;
      for (let row = bottommost + 1; row < board.gridRows; row++) {
        const occupant = occupancy.get(`${row},${col}`);
        if (occupant && occupant !== vehicleId) return false;
      }
      return true;
    }
    case 'up': {
      // Check from topmost cell to top edge
      const topmost = Math.min(...cells.map((c) => c.row));
      const col = vehicle.col;
      for (let row = topmost - 1; row >= 0; row--) {
        const occupant = occupancy.get(`${row},${col}`);
        if (occupant && occupant !== vehicleId) return false;
      }
      return true;
    }
  }
}

export function canExit(board: BoardState, vehicleId: string): boolean {
  return isPathClear(board, vehicleId);
}

// ─── Board Mutation ──────────────────────────────────────

export function removeVehicle(board: BoardState, vehicleId: string): BoardState {
  return {
    ...board,
    vehicles: board.vehicles.filter((v) => v.id !== vehicleId),
  };
}

// ─── Win Check ───────────────────────────────────────────

export function isWon(board: BoardState): boolean {
  return board.vehicles.length === 0;
}

// ─── Solvability Check ──────────────────────────────────

/**
 * BFS-based solver: tries all orderings of removing vehicles that canExit.
 * Returns true if there's a valid sequence to remove all vehicles.
 */
export function isSolvable(board: BoardState): boolean {
  const queue: BoardState[] = [board];
  const visited = new Set<string>();
  visited.add(boardKey(board));

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (isWon(current)) return true;

    for (const vehicle of current.vehicles) {
      if (canExit(current, vehicle.id)) {
        const next = removeVehicle(current, vehicle.id);
        const key = boardKey(next);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(next);
        }
      }
    }
  }

  return false;
}

/** Board state key for BFS visited set. Includes position info for extensibility. */
function boardKey(board: BoardState): string {
  return board.vehicles
    .map((v) => `${v.id}:${v.row},${v.col}`)
    .sort()
    .join('|');
}
