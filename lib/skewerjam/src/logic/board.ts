import { SKEWER_CAPACITY, type Skewer, type BoardState, type MoveAction, type StageConfig } from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  const { numFoods, emptySkewers } = config;
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Build flat array: SKEWER_CAPACITY of each food
    const flat: number[] = [];
    for (let c = 0; c < numFoods; c++) {
      for (let i = 0; i < SKEWER_CAPACITY; i++) flat.push(c);
    }

    // Fisher-Yates shuffle
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }

    // Distribute into skewers
    const skewers: Skewer[] = [];
    for (let t = 0; t < numFoods; t++) {
      skewers.push(flat.slice(t * SKEWER_CAPACITY, (t + 1) * SKEWER_CAPACITY));
    }
    // Add empty skewers
    for (let e = 0; e < emptySkewers; e++) skewers.push([]);

    // Verify solvability — if solvable, return board
    if (isSolvable(skewers, numFoods)) {
      return { skewers, numFoods };
    }
  }

  // Graceful fallback for emergency: return a shuffled board without verification
  const flat: number[] = [];
  for (let c = 0; c < numFoods; c++) {
    for (let i = 0; i < SKEWER_CAPACITY; i++) flat.push(c);
  }
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flat[i], flat[j]] = [flat[j], flat[i]];
  }
  const skewers: Skewer[] = [];
  for (let t = 0; t < numFoods; t++) {
    skewers.push(flat.slice(t * SKEWER_CAPACITY, (t + 1) * SKEWER_CAPACITY));
  }
  for (let e = 0; e < emptySkewers; e++) skewers.push([]);
  return { skewers, numFoods };
}

// ─── Move Logic ──────────────────────────────────────────

/** Count consecutive same-food items on top of a skewer */
export function topCount(skewer: Skewer): number {
  if (skewer.length === 0) return 0;
  const topFood = skewer[skewer.length - 1];
  let count = 0;
  for (let i = skewer.length - 1; i >= 0; i--) {
    if (skewer[i] === topFood) count++;
    else break;
  }
  return count;
}

export function topFood(skewer: Skewer): number | undefined {
  return skewer.length > 0 ? skewer[skewer.length - 1] : undefined;
}

export function canMove(skewers: Skewer[], from: number, to: number): MoveAction | null {
  if (from === to) return null;
  const src = skewers[from];
  const dst = skewers[to];
  if (src.length === 0) return null;
  if (dst.length >= SKEWER_CAPACITY) return null;

  const srcTop = topFood(src)!;
  const dstTop = topFood(dst);

  // Can only place onto same food or empty
  if (dstTop !== undefined && dstTop !== srcTop) return null;

  // How many can we move?
  const srcCount = topCount(src);
  const dstSpace = SKEWER_CAPACITY - dst.length;
  const count = Math.min(srcCount, dstSpace);

  // Don't move if source skewer is already solved (all same food, full)
  if (src.length === SKEWER_CAPACITY && topCount(src) === SKEWER_CAPACITY) return null;

  // Don't move entire skewer into empty (pointless move)
  if (dst.length === 0 && srcCount === src.length) return null;

  return { from, to, count };
}

export function executeMove(skewers: Skewer[], move: MoveAction): Skewer[] {
  const newSkewers = skewers.map((s) => [...s]);
  const items = newSkewers[move.from].splice(
    newSkewers[move.from].length - move.count,
    move.count,
  );
  newSkewers[move.to].push(...items);
  return newSkewers;
}

// ─── Win Check ───────────────────────────────────────────

export function isSkewerSolved(skewer: Skewer): boolean {
  return (
    skewer.length === SKEWER_CAPACITY &&
    skewer.every((c) => c === skewer[0])
  );
}

export function isWon(skewers: Skewer[]): boolean {
  return skewers.every((s) => s.length === 0 || isSkewerSolved(s));
}

// ─── BFS Solver (for level validation) ───────────────────

function boardKey(skewers: Skewer[]): string {
  // Sort skewers for canonical form (order doesn't matter)
  const sorted = skewers.map((s) => s.join(',')).sort();
  return sorted.join('|');
}

export function isSolvable(skewers: Skewer[], _numFoods: number): boolean {
  const visited = new Set<string>();
  const queue: Skewer[][] = [skewers];
  visited.add(boardKey(skewers));

  let iterations = 0;
  let head = 0;
  const MAX_ITERATIONS = 50000;

  while (head < queue.length && iterations < MAX_ITERATIONS) {
    iterations++;
    const current = queue[head++]!;
    // Cleanup processed state to free memory
    if (head > 1) queue[head - 2] = null as any;

    if (isWon(current)) return true;

    for (let from = 0; from < current.length; from++) {
      if (current[from].length === 0) continue;
      for (let to = 0; to < current.length; to++) {
        const move = canMove(current, from, to);
        if (!move) continue;
        const next = executeMove(current, move);
        const key = boardKey(next);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(next);
        }
      }
    }
  }

  return false; // Not solvable within iteration limit
}
