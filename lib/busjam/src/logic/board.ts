import {
  BUS_CAPACITY,
  BOARDING_AREA_LIMIT,
  type Passenger,
  type Bus,
  type BoardState,
  type StageConfig,
} from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  let nextId = 1;
  const { numColors, numBuses, queueCols } = config;
  const numStops = 2; // 2 bus stops visible at a time

  // Total passengers = numBuses * BUS_CAPACITY
  const totalPassengers = numBuses * BUS_CAPACITY;
  // Ensure queue grid has enough slots for all passengers
  const queueRows = Math.max(config.queueRows, Math.ceil(totalPassengers / queueCols));

  // Create a color distribution: each bus color gets BUS_CAPACITY passengers
  // We assign buses to colors round-robin
  const busColors: number[] = [];
  for (let i = 0; i < numBuses; i++) {
    busColors.push(i % numColors);
  }

  // Build passenger color list matching bus distribution
  const colorList: number[] = [];
  for (const c of busColors) {
    for (let i = 0; i < BUS_CAPACITY; i++) {
      colorList.push(c);
    }
  }

  // Shuffle passengers
  for (let i = colorList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colorList[i], colorList[j]] = [colorList[j], colorList[i]];
  }

  // Fill queue grid (some slots may be null if totalPassengers < totalSlots)
  const queue: (Passenger | null)[][] = [];
  let pIdx = 0;
  for (let r = 0; r < queueRows; r++) {
    const row: (Passenger | null)[] = [];
    for (let c = 0; c < queueCols; c++) {
      if (pIdx < totalPassengers) {
        row.push({ id: nextId++, colorIdx: colorList[pIdx] });
        pIdx++;
      } else {
        row.push(null);
      }
    }
    queue.push(row);
  }

  // Shuffle bus order
  const shuffledBusColors = [...busColors];
  for (let i = shuffledBusColors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledBusColors[i], shuffledBusColors[j]] = [shuffledBusColors[j], shuffledBusColors[i]];
  }

  // Create all buses
  const allBuses: Bus[] = shuffledBusColors.map((c) => ({
    colorIdx: c,
    passengers: [],
    departed: false,
  }));

  // Place first `numStops` buses at stops, rest in queue
  const buses = allBuses.slice(0, numStops);
  const busQueue = allBuses.slice(numStops);

  return {
    queue,
    boardingArea: [],
    buses,
    busQueue,
    numStops,
    numColors,
  };
}

// ─── Passenger Movement ──────────────────────────────────

/** Move passenger from queue[row][col] to boarding area. Returns false if invalid. */
export function moveToBoarding(
  board: BoardState,
  row: number,
  col: number,
): boolean {
  const passenger = board.queue[row]?.[col];
  if (!passenger) return false;
  if (board.boardingArea.length >= BOARDING_AREA_LIMIT) return false;

  // Only the front-most (lowest row index) passenger in each column can be picked.
  // If any passenger exists in a row below, this one is blocked.
  for (let r = 0; r < row; r++) {
    if (board.queue[r]?.[col] != null) {
      return false; // blocked by passenger below
    }
  }

  board.queue[row][col] = null;
  board.boardingArea.push(passenger);
  return true;
}

/** Try to board passengers from boarding area onto matching buses */
export function tryBoard(board: BoardState): { boarded: Passenger[]; busIdx: number }[] {
  const results: { boarded: Passenger[]; busIdx: number }[] = [];

  for (let bIdx = 0; bIdx < board.buses.length; bIdx++) {
    const bus = board.buses[bIdx];
    if (bus.departed) continue;

    // Find matching passengers in boarding area
    const matching: number[] = [];
    for (let i = 0; i < board.boardingArea.length; i++) {
      if (board.boardingArea[i].colorIdx === bus.colorIdx) {
        matching.push(i);
      }
    }

    // Board as many as the bus can hold
    const space = BUS_CAPACITY - bus.passengers.length;
    const toBoard = matching.slice(0, space);

    if (toBoard.length > 0) {
      const boarded: Passenger[] = [];
      // Remove from boarding area (from end to avoid index shift)
      const sorted = [...toBoard].sort((a, b) => b - a);
      for (const idx of sorted) {
        boarded.unshift(board.boardingArea.splice(idx, 1)[0]);
      }
      bus.passengers.push(...boarded);
      results.push({ boarded, busIdx: bIdx });
    }
  }

  return results;
}

/** Check if any bus is full and should depart */
export function departFullBuses(board: BoardState): number[] {
  const departed: number[] = [];

  for (let i = board.buses.length - 1; i >= 0; i--) {
    const bus = board.buses[i];
    if (!bus.departed && bus.passengers.length >= BUS_CAPACITY) {
      bus.departed = true;
      departed.push(i);
    }
  }

  return departed;
}

/** Replace departed buses with ones from the queue */
export function advanceBuses(board: BoardState): void {
  // Remove departed buses and fill from queue
  board.buses = board.buses.filter((b) => !b.departed);

  while (board.buses.length < board.numStops && board.busQueue.length > 0) {
    board.buses.push(board.busQueue.shift()!);
  }
}

// ─── Win / Lose Check ────────────────────────────────────

export function isWon(board: BoardState): boolean {
  // All buses dispatched and boarding area empty and queue empty
  const queueEmpty = board.queue.every((row) => row.every((p) => p === null));
  const boardingEmpty = board.boardingArea.length === 0;
  const allBusesDone = board.buses.every((b) => b.departed) && board.busQueue.length === 0;
  return queueEmpty && boardingEmpty && allBusesDone;
}

export function isGameOver(board: BoardState): boolean {
  if (isWon(board)) return false;

  // Game over if boarding area is full and no buses can take any passengers
  if (board.boardingArea.length < BOARDING_AREA_LIMIT) return false;

  // Check if any active bus at stops can take a passenger from boarding area
  for (const bus of board.buses) {
    if (bus.departed) continue;
    if (bus.passengers.length >= BUS_CAPACITY) continue;
    for (const p of board.boardingArea) {
      if (p.colorIdx === bus.colorIdx) return false; // can still board
    }
  }

  // Boarding area is full and no current bus matches.
  // Check if future buses in the queue could match any boarding area passenger.
  // If a future bus matches, we're not in deadlock — current buses can still
  // depart once manually filled or timed out, allowing queue to advance.
  // However, since buses only depart when full and boarding area is already full
  // (can't add more passengers), the only way forward is if a current bus
  // can be filled. Since we already checked that no current bus matches,
  // this is a true deadlock.
  return true;
}

/** Get pickable positions (front passengers in each column) */
export function getPickablePositions(board: BoardState): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = [];
  const cols = board.queue[0]?.length ?? 0;

  for (let c = 0; c < cols; c++) {
    // Find the bottom-most (lowest row index) non-null passenger
    for (let r = 0; r < board.queue.length; r++) {
      if (board.queue[r][c] != null) {
        positions.push({ row: r, col: c });
        break;
      }
    }
  }

  return positions;
}
