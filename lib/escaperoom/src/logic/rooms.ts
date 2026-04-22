import type { StageConfig, RoomState } from '../types';

// ─── Room Creation ───────────────────────────────────────

export function createRoom(config: StageConfig): RoomState {
  return {
    collectedClues: [],
    codeInput: [],
    puzzleActive: false,
    solved: false,
  };
}

// ─── Clue Collection ─────────────────────────────────────

/** Check if an object index is a clue */
export function isClue(config: StageConfig, objectIndex: number): boolean {
  return config.clueIndices.includes(objectIndex);
}

/** Check if a clue has already been collected */
export function isCollected(room: RoomState, objectIndex: number): boolean {
  return room.collectedClues.includes(objectIndex);
}

/** Collect a clue — returns new state */
export function collectClue(
  room: RoomState,
  config: StageConfig,
  objectIndex: number,
): RoomState {
  if (!isClue(config, objectIndex)) return room;
  if (isCollected(room, objectIndex)) return room;
  if (room.solved) return room;

  const collectedClues = [...room.collectedClues, objectIndex];
  const allCollected = collectedClues.length === config.clueIndices.length;

  return {
    ...room,
    collectedClues,
    puzzleActive: allCollected,
  };
}

// ─── Puzzle Solving ──────────────────────────────────────

/** Add a clue to the code input sequence */
export function addCodeInput(room: RoomState, clueIndex: number): RoomState {
  if (room.solved) return room;
  if (!room.puzzleActive) return room;
  if (room.codeInput.includes(clueIndex)) return room;

  return {
    ...room,
    codeInput: [...room.codeInput, clueIndex],
  };
}

/** Check if the current code input matches the solution */
export function checkSolution(room: RoomState, config: StageConfig): 'correct' | 'wrong' | 'incomplete' {
  if (room.codeInput.length < config.solutionOrder.length) return 'incomplete';

  for (let i = 0; i < config.solutionOrder.length; i++) {
    if (room.codeInput[i] !== config.solutionOrder[i]) return 'wrong';
  }

  return 'correct';
}

/** Reset the code input (on wrong answer) */
export function resetCodeInput(room: RoomState): RoomState {
  return {
    ...room,
    codeInput: [],
  };
}

/** Mark room as solved */
export function solveRoom(room: RoomState): RoomState {
  return {
    ...room,
    solved: true,
  };
}

// ─── Win Check ───────────────────────────────────────────

export function isWon(room: RoomState): boolean {
  return room.solved;
}
