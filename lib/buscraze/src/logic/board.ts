import type { Vehicle, BoardState, StageConfig, Direction } from '../types';
import { VEHICLE_COLORS } from '../types';

// ─── Grid Helpers ────────────────────────────────────────

function createGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(-1));
}

function placeVehicle(grid: number[][], v: Vehicle): boolean {
  const cells = getVehicleCells(v);
  for (const [r, c] of cells) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return false;
    if (grid[r][c] !== -1) return false;
  }
  for (const [r, c] of cells) {
    grid[r][c] = v.id;
  }
  return true;
}

export function getVehicleCells(v: Vehicle): [number, number][] {
  const cells: [number, number][] = [];
  for (let i = 0; i < v.length; i++) {
    if (v.direction === 'horizontal') {
      cells.push([v.row, v.col + i]);
    } else {
      cells.push([v.row + i, v.col]);
    }
  }
  return cells;
}

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  const { gridRows, gridCols, numBlockers, exitRow } = config;
  const maxAttempts = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid = createGrid(gridRows, gridCols);
    const vehicles: Vehicle[] = [];
    let nextId = 0;

    // Place the target bus (always horizontal, on exit row)
    const targetCol = Math.floor(Math.random() * (gridCols - 2));
    const targetBus: Vehicle = {
      id: nextId++,
      row: exitRow,
      col: targetCol,
      length: 2,
      direction: 'horizontal',
      color: VEHICLE_COLORS[0],
      isTarget: true,
    };
    if (!placeVehicle(grid, targetBus)) continue;
    vehicles.push(targetBus);

    // Place blocker vehicles
    let placed = 0;
    let blockerAttempts = 0;
    while (placed < numBlockers && blockerAttempts < 200) {
      blockerAttempts++;
      const direction: Direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const length = Math.random() < 0.6 ? 2 : 3;
      const maxRow = direction === 'horizontal' ? gridRows - 1 : gridRows - length;
      const maxCol = direction === 'horizontal' ? gridCols - length : gridCols - 1;
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));

      const colorIdx = (nextId % (VEHICLE_COLORS.length - 1)) + 1;
      const blocker: Vehicle = {
        id: nextId,
        row,
        col,
        length,
        direction,
        color: VEHICLE_COLORS[colorIdx],
        isTarget: false,
      };

      // Test placement
      const testGrid = grid.map(r => [...r]);
      const cells = getVehicleCells(blocker);
      let canPlace = true;
      for (const [r, c] of cells) {
        if (r < 0 || r >= gridRows || c < 0 || c >= gridCols || testGrid[r][c] !== -1) {
          canPlace = false;
          break;
        }
      }
      if (canPlace) {
        placeVehicle(grid, blocker);
        vehicles.push(blocker);
        nextId++;
        placed++;
      }
    }

    const board: BoardState = { gridRows, gridCols, vehicles, exitRow, exitCol: gridCols };

    // Check if the puzzle is solvable
    if (isSolvable(board)) {
      return board;
    }
  }

  // Fallback: simple puzzle guaranteed solvable
  return createFallbackBoard(config);
}

function createFallbackBoard(config: StageConfig): BoardState {
  const { gridRows, gridCols, exitRow } = config;
  const vehicles: Vehicle[] = [
    { id: 0, row: exitRow, col: 0, length: 2, direction: 'horizontal', color: VEHICLE_COLORS[0], isTarget: true },
    { id: 1, row: exitRow - 1, col: 3, length: 2, direction: 'vertical', color: VEHICLE_COLORS[1], isTarget: false },
    { id: 2, row: 0, col: 2, length: 3, direction: 'vertical', color: VEHICLE_COLORS[2], isTarget: false },
  ];
  return { gridRows, gridCols, vehicles, exitRow, exitCol: gridCols };
}

// ─── Move Logic ──────────────────────────────────────────

export function canMoveVehicle(
  board: BoardState,
  vehicleId: number,
  deltaRow: number,
  deltaCol: number,
): boolean {
  const vehicle = board.vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return false;

  // Vehicles can only move along their direction
  if (vehicle.direction === 'horizontal' && deltaRow !== 0) return false;
  if (vehicle.direction === 'vertical' && deltaCol !== 0) return false;

  const newRow = vehicle.row + deltaRow;
  const newCol = vehicle.col + deltaCol;

  // Check bounds
  const cells = getVehicleCells({ ...vehicle, row: newRow, col: newCol });
  for (const [r, c] of cells) {
    // Allow target to exit off the right edge
    if (vehicle.isTarget && r === board.exitRow && c >= board.gridCols) {
      continue;
    }
    if (r < 0 || r >= board.gridRows || c < 0 || c >= board.gridCols) return false;
  }

  // Check collisions with other vehicles
  const grid = buildGrid(board);
  for (const [r, c] of cells) {
    if (r < 0 || r >= board.gridRows || c < 0 || c >= board.gridCols) continue;
    if (grid[r][c] !== -1 && grid[r][c] !== vehicleId) return false;
  }

  return true;
}

export function moveVehicle(board: BoardState, vehicleId: number, deltaRow: number, deltaCol: number): BoardState {
  return {
    ...board,
    vehicles: board.vehicles.map(v =>
      v.id === vehicleId ? { ...v, row: v.row + deltaRow, col: v.col + deltaCol } : { ...v },
    ),
  };
}

function buildGrid(board: BoardState): number[][] {
  const grid = createGrid(board.gridRows, board.gridCols);
  for (const v of board.vehicles) {
    const cells = getVehicleCells(v);
    for (const [r, c] of cells) {
      if (r >= 0 && r < board.gridRows && c >= 0 && c < board.gridCols) {
        grid[r][c] = v.id;
      }
    }
  }
  return grid;
}

// ─── Win Check ───────────────────────────────────────────

export function isWon(board: BoardState): boolean {
  const target = board.vehicles.find(v => v.isTarget);
  if (!target) return false;
  // Target bus has exited: its rightmost cell reaches the grid edge
  return target.col + target.length >= board.gridCols;
}

export function canTargetExit(board: BoardState): boolean {
  const target = board.vehicles.find(v => v.isTarget);
  if (!target) return false;
  const grid = buildGrid(board);
  for (let c = target.col + target.length; c < board.gridCols; c++) {
    if (grid[target.row][c] !== -1) return false;
  }
  return true;
}

// ─── BFS Solver ──────────────────────────────────────────

function boardKey(board: BoardState): string {
  return board.vehicles
    .map(v => `${v.id}:${v.row},${v.col}`)
    .sort()
    .join('|');
}

export function isSolvable(board: BoardState): boolean {
  const visited = new Set<string>();
  const queue: BoardState[] = [board];
  visited.add(boardKey(board));

  let iterations = 0;
  let head = 0;
  const MAX_ITERATIONS = 30000;

  while (head < queue.length && iterations < MAX_ITERATIONS) {
    iterations++;
    const current = queue[head++];

    if (canTargetExit(current)) return true;

    for (const vehicle of current.vehicles) {
      const deltas: [number, number][] =
        vehicle.direction === 'horizontal'
          ? [[0, -1], [0, 1]]
          : [[-1, 0], [1, 0]];

      for (const [dr, dc] of deltas) {
        // Try sliding 1, 2, 3... cells in this direction
        for (let dist = 1; dist <= Math.max(current.gridRows, current.gridCols); dist++) {
          if (!canMoveVehicle(current, vehicle.id, dr * dist, dc * dist)) break;
          const next = moveVehicle(current, vehicle.id, dr * dist, dc * dist);
          const key = boardKey(next);
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(next);
          }
        }
      }
    }
  }

  return false;
}

// ─── Get all valid single-step moves for a vehicle ───────

export function getValidMoves(board: BoardState, vehicleId: number): { deltaRow: number; deltaCol: number }[] {
  const vehicle = board.vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return [];

  const moves: { deltaRow: number; deltaCol: number }[] = [];
  const deltas: [number, number][] =
    vehicle.direction === 'horizontal'
      ? [[0, -1], [0, 1]]
      : [[-1, 0], [1, 0]];

  for (const [dr, dc] of deltas) {
    for (let dist = 1; dist <= Math.max(board.gridRows, board.gridCols); dist++) {
      if (!canMoveVehicle(board, vehicleId, dr * dist, dc * dist)) break;
      moves.push({ deltaRow: dr * dist, deltaCol: dc * dist });
    }
  }

  return moves;
}
