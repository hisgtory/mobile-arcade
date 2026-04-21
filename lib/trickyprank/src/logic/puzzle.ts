import type { PuzzleElement, StageConfig } from '../types';

// ─── Player Action ───────────────────────────────────────

export type PlayerAction =
  | { type: 'tap'; targetId?: string; x?: number; y?: number }
  | { type: 'wait' }
  | {
      type: 'drag';
      targetId?: string;
      fromX?: number;
      fromY?: number;
      toX?: number;
      toY?: number;
    }
  | { type: 'input'; value: string }
  | { type: 'sequence'; targetIds: string[] };

// ─── Puzzle State ────────────────────────────────────────

export interface PuzzleState {
  config: StageConfig;
  solved: boolean;
  attempts: number;
  startTime: number;
  elements: PuzzleElement[];
  sequenceProgress: string[];
}

export function createPuzzle(config: StageConfig): PuzzleState {
  return {
    config,
    solved: false,
    attempts: 0,
    startTime: Date.now(),
    elements: [...config.puzzle.elements],
    sequenceProgress: [],
  };
}

export function checkAnswer(
  puzzle: PuzzleState,
  action: PlayerAction,
): boolean {
  const answer = puzzle.config.puzzle.answer;

  switch (answer.type) {
    case 'tap_target':
      return action.type === 'tap' && action.targetId === answer.targetId;

    case 'wait':
      return action.type === 'wait';

    case 'input':
      return action.type === 'input' && action.value === answer.value;

    case 'tap_count':
      return false;

    case 'drag':
      return action.type === 'drag' && action.targetId === answer.targetId;

    case 'sequence':
      if (action.type === 'tap' && action.targetId === 'seq_correct') {
        return true;
      }
      return false;

    default:
      return false;
  }
}

export function isTimeUp(puzzle: PuzzleState): boolean {
  const elapsed = (Date.now() - puzzle.startTime) / 1000;
  return elapsed >= puzzle.config.puzzle.timeLimit;
}

export function getRemainingTime(puzzle: PuzzleState): number {
  const elapsed = (Date.now() - puzzle.startTime) / 1000;
  return Math.max(0, puzzle.config.puzzle.timeLimit - elapsed);
}
