import { TUBE_CAPACITY, type Tube, type BoardState, type PourMove, type StageConfig } from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  const { numColors, emptyTubes } = config;
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Build flat array: 4 of each color
    const flat: number[] = [];
    for (let c = 0; c < numColors; c++) {
      for (let i = 0; i < TUBE_CAPACITY; i++) flat.push(c);
    }

    // Fisher-Yates shuffle
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }

    // Distribute into tubes
    const tubes: Tube[] = [];
    for (let t = 0; t < numColors; t++) {
      tubes.push(flat.slice(t * TUBE_CAPACITY, (t + 1) * TUBE_CAPACITY));
    }
    // Add empty tubes
    for (let e = 0; e < emptyTubes; e++) tubes.push([]);

    // Verify solvability — if solvable, return board
    if (isSolvable(tubes, numColors)) {
      return { tubes, numColors };
    }
  }

  throw new Error(`Failed to create solvable board after ${maxAttempts} attempts`);
}

// ─── Pour Logic ──────────────────────────────────────────

/** Count consecutive same-color segments on top of a tube */
export function topCount(tube: Tube): number {
  if (tube.length === 0) return 0;
  const topColor = tube[tube.length - 1];
  let count = 0;
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] === topColor) count++;
    else break;
  }
  return count;
}

export function topColor(tube: Tube): number | undefined {
  return tube.length > 0 ? tube[tube.length - 1] : undefined;
}

export function canPour(tubes: Tube[], from: number, to: number): PourMove | null {
  if (from === to) return null;
  const src = tubes[from];
  const dst = tubes[to];
  if (src.length === 0) return null;
  if (dst.length >= TUBE_CAPACITY) return null;

  const srcTop = topColor(src)!;
  const dstTop = topColor(dst);

  // Can only pour onto same color or empty
  if (dstTop !== undefined && dstTop !== srcTop) return null;

  // How many can we pour?
  const srcCount = topCount(src);
  const dstSpace = TUBE_CAPACITY - dst.length;
  const count = Math.min(srcCount, dstSpace);

  // Don't pour if source tube is already solved (all same color, full)
  if (src.length === TUBE_CAPACITY && topCount(src) === TUBE_CAPACITY) return null;

  // Don't pour entire tube into empty (pointless move)
  if (dst.length === 0 && srcCount === src.length) return null;

  return { from, to, count };
}

export function executePour(tubes: Tube[], move: PourMove): Tube[] {
  const newTubes = tubes.map((t) => [...t]);
  const segments = newTubes[move.from].splice(
    newTubes[move.from].length - move.count,
    move.count,
  );
  newTubes[move.to].push(...segments);
  return newTubes;
}

// ─── Win Check ───────────────────────────────────────────

export function isTubeSolved(tube: Tube): boolean {
  return (
    tube.length === TUBE_CAPACITY &&
    tube.every((c) => c === tube[0])
  );
}

export function isWon(tubes: Tube[]): boolean {
  return tubes.every((t) => t.length === 0 || isTubeSolved(t));
}

// ─── BFS Solver (for level validation) ───────────────────

function boardKey(tubes: Tube[]): string {
  // Sort tubes for canonical form (order doesn't matter)
  const sorted = tubes.map((t) => t.join(',')).sort();
  return sorted.join('|');
}

export function isSolvable(tubes: Tube[], _numColors: number): boolean {
  // For large boards (10+ tubes), use DFS with depth limit to avoid memory explosion
  if (tubes.length >= 10) {
    return isSolvableDFS(tubes, 60);
  }
  return isSolvableBFS(tubes);
}

function isSolvableBFS(tubes: Tube[]): boolean {
  const visited = new Set<string>();
  const queue: Tube[][] = [tubes];
  visited.add(boardKey(tubes));

  let iterations = 0;
  let head = 0;
  const MAX_ITERATIONS = 50000;

  while (head < queue.length && iterations < MAX_ITERATIONS) {
    iterations++;
    const current = queue[head++]!;

    if (isWon(current)) return true;

    for (let from = 0; from < current.length; from++) {
      if (current[from].length === 0) continue;
      for (let to = 0; to < current.length; to++) {
        const move = canPour(current, from, to);
        if (!move) continue;
        const next = executePour(current, move);
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

function isSolvableDFS(tubes: Tube[], maxDepth: number): boolean {
  const visited = new Set<string>();
  visited.add(boardKey(tubes));
  let iterations = 0;
  const MAX_ITERATIONS = 30000;

  function dfs(current: Tube[], depth: number): boolean {
    if (iterations >= MAX_ITERATIONS) return false;
    if (isWon(current)) return true;
    if (depth >= maxDepth) return false;

    for (let from = 0; from < current.length; from++) {
      if (current[from].length === 0) continue;
      for (let to = 0; to < current.length; to++) {
        const move = canPour(current, from, to);
        if (!move) continue;
        const next = executePour(current, move);
        const key = boardKey(next);
        if (!visited.has(key)) {
          iterations++;
          visited.add(key);
          if (dfs(next, depth + 1)) return true;
          visited.delete(key); // Backtrack for DFS
        }
      }
    }

    return false;
  }

  return dfs(tubes, 0);
}
