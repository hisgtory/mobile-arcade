import type { Puzzle, PuzzleType, StageConfig } from '../types';
import { TILE_EMOJIS } from '../types';

// ─── Constants ────────────────────────────────────────────

const MAX_CHOICE_GENERATION_ATTEMPTS = 100;
const MIN_MIRROR_GRID_SIZE = 4;

// ─── Random helpers ──────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Puzzle Generators ───────────────────────────────────

/**
 * Odd One Out — grid filled with one emoji, one cell is different.
 * Trick: the "different" one may be very similar (e.g. 🔴 vs 🟠)
 */
function generateOddOneOut(gridSize: number): Puzzle {
  // Pick similar-looking pairs for the trick
  const similarPairs = [
    [0, 5],   // 🔴 vs 🟠
    [1, 12],  // 🔵 vs ⚡ (blue theme)
    [2, 15],  // 🟢 vs 🍀
    [3, 8],   // 🟡 vs ⭐
    [4, 13],  // 🟣 vs 🌙
  ];

  const pair = pick(similarPairs);
  const mainIdx = pair[0];
  const oddIdx = pair[1];

  const grid: number[][] = [];
  const oddRow = randInt(0, gridSize - 1);
  const oddCol = randInt(0, gridSize - 1);

  for (let r = 0; r < gridSize; r++) {
    grid[r] = [];
    for (let c = 0; c < gridSize; c++) {
      grid[r][c] = (r === oddRow && c === oddCol) ? oddIdx : mainIdx;
    }
  }

  return {
    type: 'odd_one_out',
    grid,
    answer: oddRow * gridSize + oddCol,
    question: 'Find the different one!',
    twist: `${TILE_EMOJIS[oddIdx]} hides among ${TILE_EMOJIS[mainIdx]}`,
  };
}

/**
 * Count — how many of a specific emoji are in the grid?
 * Trick: some look-alike emojis are mixed in to confuse
 */
function generateCount(gridSize: number): Puzzle {
  const targetIdx = randInt(0, 7);
  const confuserIdx = (targetIdx + 1) % 8; // visually similar neighbor
  const fillerIdx = randInt(8, 15);

  const totalCells = gridSize * gridSize;
  const targetCount = randInt(3, Math.floor(totalCells * 0.4));
  const confuserCount = randInt(2, Math.floor(totalCells * 0.3));
  const fillerCount = totalCells - targetCount - confuserCount;

  const flat: number[] = [
    ...Array(targetCount).fill(targetIdx),
    ...Array(confuserCount).fill(confuserIdx),
    ...Array(Math.max(0, fillerCount)).fill(fillerIdx),
  ];

  // Ensure we have exactly totalCells items
  while (flat.length < totalCells) flat.push(fillerIdx);
  while (flat.length > totalCells) flat.pop();

  const shuffled = shuffle(flat);

  const grid: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    grid[r] = [];
    for (let c = 0; c < gridSize; c++) {
      grid[r][c] = shuffled[r * gridSize + c];
    }
  }

  // Generate choices (one correct, others wrong)
  const wrongChoices = new Set<number>();
  let guard = 0;
  while (wrongChoices.size < 3 && guard < MAX_CHOICE_GENERATION_ATTEMPTS) {
    guard++;
    const w = targetCount + randInt(-5, 5);
    if (w !== targetCount && w > 0) wrongChoices.add(w);
  }
  // Fallback: fill remaining with sequential values if range was too narrow
  let fallback = targetCount + 1;
  while (wrongChoices.size < 3) {
    if (fallback !== targetCount) wrongChoices.add(fallback);
    fallback++;
  }
  const choices = shuffle([targetCount, ...Array.from(wrongChoices)]);

  return {
    type: 'count',
    grid,
    answer: targetCount,
    question: `How many ${TILE_EMOJIS[targetIdx]} ?`,
    choices,
    twist: `${TILE_EMOJIS[confuserIdx]} looks similar — don't count them!`,
  };
}

/**
 * Pattern — find the missing piece in a pattern sequence.
 * Trick: the pattern repeats but with a subtle offset
 */
function generatePattern(gridSize: number): Puzzle {
  const patternLen = randInt(2, 3);
  const patternTiles = Array.from({ length: patternLen }, () => randInt(0, 7));

  const grid: number[][] = [];
  let missingRow = -1;
  let missingCol = -1;

  for (let r = 0; r < gridSize; r++) {
    grid[r] = [];
    for (let c = 0; c < gridSize; c++) {
      grid[r][c] = patternTiles[(r * gridSize + c) % patternLen];
    }
  }

  // Remove one cell (the answer)
  missingRow = randInt(0, gridSize - 1);
  missingCol = randInt(0, gridSize - 1);
  const correctAnswer = grid[missingRow][missingCol];
  grid[missingRow][missingCol] = -1; // empty

  // Generate choices
  const wrongChoices = new Set<number>();
  while (wrongChoices.size < 3) {
    const w = randInt(0, 7);
    if (w !== correctAnswer) wrongChoices.add(w);
  }
  const choices = shuffle([correctAnswer, ...Array.from(wrongChoices)]);

  return {
    type: 'pattern',
    grid,
    answer: correctAnswer,
    question: 'What goes in the empty spot?',
    choices,
    twist: 'Follow the repeating pattern carefully!',
  };
}

/**
 * Sequence — which number comes next?
 * Trick: the sequence has a non-obvious rule
 */
function generateSequence(_gridSize: number): Puzzle {
  const sequences = [
    { nums: [2, 4, 8, 16], next: 32, rule: 'doubles' },
    { nums: [1, 1, 2, 3], next: 5, rule: 'fibonacci' },
    { nums: [3, 6, 9, 12], next: 15, rule: 'multiples of 3' },
    { nums: [1, 4, 9, 16], next: 25, rule: 'squares' },
    { nums: [2, 3, 5, 7], next: 11, rule: 'primes' },
    { nums: [1, 3, 6, 10], next: 15, rule: 'triangular' },
    { nums: [0, 1, 1, 2], next: 3, rule: 'fibonacci from 0' },
    { nums: [1, 2, 4, 7], next: 11, rule: '+1,+2,+3,+4' },
  ];

  const seq = pick(sequences);

  // Display in a single-row grid
  const gridSize = seq.nums.length + 1;
  const grid: number[][] = [seq.nums.map((n) => n)];
  grid[0].push(-1); // empty slot for the answer

  // Generate wrong choices
  const wrongChoices = new Set<number>();
  let guard = 0;
  while (wrongChoices.size < 3 && guard < MAX_CHOICE_GENERATION_ATTEMPTS) {
    guard++;
    const w = seq.next + randInt(-10, 10);
    if (w !== seq.next && w > 0) wrongChoices.add(w);
  }
  // Fallback: fill remaining with sequential values if range was too narrow
  let fallback = seq.next + 1;
  while (wrongChoices.size < 3) {
    if (fallback !== seq.next) wrongChoices.add(fallback);
    fallback++;
  }
  const choices = shuffle([seq.next, ...Array.from(wrongChoices)]);

  return {
    type: 'sequence',
    grid,
    answer: seq.next,
    question: 'What comes next?',
    choices,
    twist: `The rule is: ${seq.rule}`,
  };
}

/**
 * Mirror — find which cell breaks the symmetry.
 * Trick: the grid looks symmetric but one cell is off
 */
function generateMirror(gridSize: number): Puzzle {
  // Mirror requires gridSize >= 4 to have meaningful puzzles
  const safeGridSize = Math.max(gridSize, MIN_MIRROR_GRID_SIZE);
  const grid: number[][] = [];
  const half = Math.ceil(safeGridSize / 2);

  // Create symmetric grid
  for (let r = 0; r < safeGridSize; r++) {
    grid[r] = [];
    for (let c = 0; c < half; c++) {
      const tile = randInt(0, 5);
      grid[r][c] = tile;
      grid[r][safeGridSize - 1 - c] = tile;
    }
  }

  // Break symmetry at one point
  const breakRow = randInt(0, safeGridSize - 1);
  const breakCol = randInt(0, Math.floor(safeGridSize / 2) - 1);
  const mirrorCol = safeGridSize - 1 - breakCol;

  // Change the mirror side
  let newTile = grid[breakRow][mirrorCol];
  while (newTile === grid[breakRow][breakCol]) {
    newTile = randInt(0, 5);
  }
  grid[breakRow][mirrorCol] = newTile;

  return {
    type: 'mirror',
    grid,
    answer: breakRow * safeGridSize + mirrorCol,
    question: 'Find the one that breaks symmetry!',
    twist: 'The grid should be a mirror — one cell is wrong',
  };
}

// ─── Puzzle Set Generation ──────────────────────────────

const GENERATORS: Record<PuzzleType, (gridSize: number) => Puzzle> = {
  odd_one_out: generateOddOneOut,
  count: generateCount,
  pattern: generatePattern,
  sequence: generateSequence,
  mirror: generateMirror,
};

export function generatePuzzleSet(config: StageConfig): Puzzle[] {
  const puzzles: Puzzle[] = [];
  const { puzzleCount, gridSize, puzzleTypes } = config;

  for (let i = 0; i < puzzleCount; i++) {
    const type = puzzleTypes[i % puzzleTypes.length];
    puzzles.push(GENERATORS[type](gridSize));
  }

  return puzzles;
}

/** Calculate score for answering correctly */
export function calcScore(timeRemaining: number, streak: number): number {
  const baseScore = 100;
  const timeBonus = Math.floor(timeRemaining * 2);
  const streakMultiplier = Math.min(streak, 5);
  return baseScore + timeBonus + streakMultiplier * 20;
}
