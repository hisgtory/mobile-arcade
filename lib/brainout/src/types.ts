/**
 * BrainOut game type definitions
 *
 * Trick-question puzzle game where players solve nonsense/tricky problems.
 */

/** Types of interaction for each puzzle */
export type InteractionType =
  | 'tap'        // Tap the correct element
  | 'drag'       // Drag an element to solve
  | 'multi-tap'  // Tap multiple elements
  | 'text-input' // Type an answer
  | 'shake'      // Shake/swipe gesture
  | 'hide'       // Tap to hide something (e.g., hide a word in the question)
  | 'math'       // Tap the correct number answer
  | 'sequence';  // Tap in correct order

export interface ChoiceOption {
  id: string;
  label: string;
  /** Position hint: relative x (0~1) */
  x?: number;
  /** Position hint: relative y (0~1) */
  y?: number;
  correct?: boolean;
}

export interface Puzzle {
  id: number;
  /** The question text displayed to the player */
  question: string;
  /** Optional hint text shown when player uses hint */
  hint: string;
  /** Type of interaction required */
  interaction: InteractionType;
  /** Choice options or elements shown on screen */
  choices: ChoiceOption[];
  /** IDs of correct choices */
  correctIds: string[];
  /** Explanation shown after solving */
  explanation: string;
  /** Difficulty tier 1-5 */
  difficulty: number;
}

export interface StageConfig {
  stage: number;
  /** Puzzle IDs for this stage (5 puzzles per stage) */
  puzzleIds: number[];
  /** Lives available (errors allowed) */
  lives: number;
  /** Hints available */
  hints: number;
}

export interface GameConfig {
  stage?: number;
  assetBaseUrl?: string;
  onClear?: () => void;
  onGameOver?: () => void;
}

export enum GamePhase {
  IDLE = 'idle',
  PLAYING = 'playing',
  ANIMATING = 'animating',
  SHOWING_RESULT = 'showing_result',
  CLEAR = 'clear',
  GAME_OVER = 'game_over',
}
