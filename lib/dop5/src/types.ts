// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

/** Radius of the eraser (in base pixels, scaled by dpr) */
export const ERASER_RADIUS = 28;

/** Fraction of target area that must be erased to count as solved */
export const ERASE_THRESHOLD = 0.55;

// ─── Puzzle Data ─────────────────────────────────────────

/**
 * Each puzzle has a scene drawn with emoji/shapes, a question,
 * and a rectangular target zone the player must erase.
 */
export interface PuzzleData {
  /** Short question shown to the player */
  question: string;
  /** Emoji objects placed on the scene */
  objects: SceneObject[];
  /** The target rectangle (relative 0-1 coords) that the player must erase */
  target: { x: number; y: number; w: number; h: number };
  /** Background color for the scene */
  bgColor: string;
}

export interface SceneObject {
  emoji: string;
  /** Relative position (0-1) */
  x: number;
  y: number;
  /** Font size in base pixels */
  size: number;
}

// ─── Stage Config ────────────────────────────────────────

export interface StageConfig {
  stage: number;
  puzzle: PuzzleData;
}

export function getStageConfig(stage: number): StageConfig {
  const puzzles = getPuzzles();
  const idx = ((stage - 1) % puzzles.length);
  return { stage, puzzle: puzzles[idx] };
}

// ─── Game Types ──────────────────────────────────────────

export interface GameConfig {
  stage?: number;
}

export interface EraseState {
  /** Percentage of target area erased (0-1) */
  erasePercent: number;
  /** Whether the puzzle is solved */
  solved: boolean;
}

// ─── Puzzle Library ──────────────────────────────────────

function getPuzzles(): PuzzleData[] {
  return [
    // Stage 1: Find the hidden star
    {
      question: 'Find the hidden star! ⭐',
      bgColor: '#E8F5E9',
      objects: [
        { emoji: '🌳', x: 0.15, y: 0.25, size: 52 },
        { emoji: '🌳', x: 0.45, y: 0.20, size: 58 },
        { emoji: '🌳', x: 0.75, y: 0.28, size: 50 },
        { emoji: '🏠', x: 0.50, y: 0.55, size: 64 },
        { emoji: '🌸', x: 0.25, y: 0.70, size: 36 },
        { emoji: '🌸', x: 0.70, y: 0.72, size: 32 },
        { emoji: '☁️', x: 0.30, y: 0.10, size: 40 },
        { emoji: '☁️', x: 0.65, y: 0.08, size: 44 },
        { emoji: '⭐', x: 0.50, y: 0.42, size: 40 },
      ],
      target: { x: 0.35, y: 0.32, w: 0.30, h: 0.22 },
    },
    // Stage 2: Who stole the cookie?
    {
      question: 'Who stole the cookie? 🍪',
      bgColor: '#FFF3E0',
      objects: [
        { emoji: '👦', x: 0.20, y: 0.35, size: 56 },
        { emoji: '👧', x: 0.50, y: 0.35, size: 56 },
        { emoji: '👶', x: 0.80, y: 0.35, size: 56 },
        { emoji: '🍪', x: 0.80, y: 0.55, size: 36 },
        { emoji: '🏠', x: 0.50, y: 0.15, size: 48 },
        { emoji: '🪑', x: 0.15, y: 0.65, size: 40 },
        { emoji: '🪑', x: 0.50, y: 0.65, size: 40 },
        { emoji: '🪑', x: 0.85, y: 0.65, size: 40 },
      ],
      target: { x: 0.65, y: 0.25, w: 0.30, h: 0.40 },
    },
    // Stage 3: Find the fish in the pond
    {
      question: 'Find the fish! 🐟',
      bgColor: '#E3F2FD',
      objects: [
        { emoji: '🌊', x: 0.50, y: 0.50, size: 80 },
        { emoji: '🪨', x: 0.20, y: 0.70, size: 44 },
        { emoji: '🪨', x: 0.80, y: 0.65, size: 40 },
        { emoji: '🌿', x: 0.15, y: 0.45, size: 36 },
        { emoji: '🌿', x: 0.85, y: 0.48, size: 38 },
        { emoji: '🐟', x: 0.50, y: 0.52, size: 42 },
        { emoji: '☀️', x: 0.80, y: 0.12, size: 48 },
        { emoji: '☁️', x: 0.30, y: 0.10, size: 36 },
      ],
      target: { x: 0.32, y: 0.38, w: 0.36, h: 0.28 },
    },
    // Stage 4: Stop the alarm
    {
      question: 'Stop the alarm! ⏰',
      bgColor: '#FCE4EC',
      objects: [
        { emoji: '🛏️', x: 0.50, y: 0.55, size: 72 },
        { emoji: '😴', x: 0.50, y: 0.40, size: 52 },
        { emoji: '⏰', x: 0.20, y: 0.30, size: 44 },
        { emoji: '🌙', x: 0.80, y: 0.15, size: 40 },
        { emoji: '💤', x: 0.65, y: 0.32, size: 32 },
        { emoji: '🪟', x: 0.82, y: 0.35, size: 48 },
        { emoji: '🧸', x: 0.25, y: 0.70, size: 36 },
      ],
      target: { x: 0.05, y: 0.18, w: 0.30, h: 0.28 },
    },
    // Stage 5: Find the key
    {
      question: 'Find the key! 🔑',
      bgColor: '#F3E5F5',
      objects: [
        { emoji: '🚪', x: 0.50, y: 0.45, size: 72 },
        { emoji: '🔒', x: 0.50, y: 0.62, size: 36 },
        { emoji: '🪴', x: 0.15, y: 0.55, size: 44 },
        { emoji: '🪴', x: 0.85, y: 0.52, size: 42 },
        { emoji: '🖼️', x: 0.20, y: 0.25, size: 40 },
        { emoji: '🔑', x: 0.78, y: 0.72, size: 32 },
        { emoji: '🧹', x: 0.82, y: 0.30, size: 36 },
      ],
      target: { x: 0.62, y: 0.60, w: 0.32, h: 0.25 },
    },
    // Stage 6: Who is hiding?
    {
      question: 'Who is hiding? 🙈',
      bgColor: '#E0F7FA',
      objects: [
        { emoji: '🌴', x: 0.20, y: 0.35, size: 64 },
        { emoji: '🌴', x: 0.80, y: 0.30, size: 60 },
        { emoji: '🐒', x: 0.22, y: 0.50, size: 40 },
        { emoji: '🦜', x: 0.75, y: 0.20, size: 36 },
        { emoji: '🌺', x: 0.50, y: 0.70, size: 32 },
        { emoji: '🌺', x: 0.35, y: 0.75, size: 28 },
        { emoji: '☀️', x: 0.50, y: 0.08, size: 44 },
      ],
      target: { x: 0.07, y: 0.38, w: 0.30, h: 0.25 },
    },
    // Stage 7: Save the cake
    {
      question: 'Save the cake! 🎂',
      bgColor: '#FFF9C4',
      objects: [
        { emoji: '🎂', x: 0.50, y: 0.45, size: 60 },
        { emoji: '🐜', x: 0.30, y: 0.60, size: 28 },
        { emoji: '🐜', x: 0.65, y: 0.65, size: 26 },
        { emoji: '🐜', x: 0.45, y: 0.70, size: 30 },
        { emoji: '🍽️', x: 0.50, y: 0.55, size: 48 },
        { emoji: '🎈', x: 0.25, y: 0.20, size: 36 },
        { emoji: '🎈', x: 0.75, y: 0.18, size: 38 },
        { emoji: '🎁', x: 0.20, y: 0.50, size: 40 },
      ],
      target: { x: 0.20, y: 0.50, w: 0.55, h: 0.30 },
    },
    // Stage 8: Find the diamond
    {
      question: 'Find the diamond! 💎',
      bgColor: '#E8EAF6',
      objects: [
        { emoji: '⛏️', x: 0.30, y: 0.40, size: 48 },
        { emoji: '🪨', x: 0.50, y: 0.50, size: 56 },
        { emoji: '🪨', x: 0.25, y: 0.60, size: 44 },
        { emoji: '🪨', x: 0.72, y: 0.55, size: 48 },
        { emoji: '💎', x: 0.55, y: 0.48, size: 32 },
        { emoji: '🕯️', x: 0.15, y: 0.25, size: 36 },
        { emoji: '🦇', x: 0.80, y: 0.15, size: 32 },
      ],
      target: { x: 0.38, y: 0.35, w: 0.32, h: 0.28 },
    },
    // Stage 9: Wake up the cat
    {
      question: 'Wake up the cat! 🐱',
      bgColor: '#EFEBE9',
      objects: [
        { emoji: '🐱', x: 0.50, y: 0.50, size: 56 },
        { emoji: '🧶', x: 0.25, y: 0.65, size: 36 },
        { emoji: '🐾', x: 0.70, y: 0.68, size: 28 },
        { emoji: '🐾', x: 0.35, y: 0.72, size: 26 },
        { emoji: '🛋️', x: 0.50, y: 0.58, size: 64 },
        { emoji: '📺', x: 0.50, y: 0.22, size: 48 },
        { emoji: '🪟', x: 0.15, y: 0.20, size: 44 },
      ],
      target: { x: 0.32, y: 0.38, w: 0.36, h: 0.28 },
    },
    // Stage 10: Find the treasure
    {
      question: 'Find the treasure! 💰',
      bgColor: '#FBE9E7',
      objects: [
        { emoji: '🏝️', x: 0.50, y: 0.40, size: 72 },
        { emoji: '🌴', x: 0.25, y: 0.30, size: 52 },
        { emoji: '🌴', x: 0.75, y: 0.28, size: 48 },
        { emoji: '💰', x: 0.55, y: 0.65, size: 40 },
        { emoji: '🦀', x: 0.30, y: 0.72, size: 32 },
        { emoji: '🐚', x: 0.70, y: 0.75, size: 28 },
        { emoji: '⛵', x: 0.80, y: 0.12, size: 36 },
      ],
      target: { x: 0.38, y: 0.52, w: 0.34, h: 0.28 },
    },
    // Stage 11: Find the ghost
    {
      question: 'Find the ghost! 👻',
      bgColor: '#263238',
      objects: [
        { emoji: '🏚️', x: 0.50, y: 0.40, size: 72 },
        { emoji: '🌙', x: 0.80, y: 0.10, size: 44 },
        { emoji: '🦇', x: 0.30, y: 0.15, size: 32 },
        { emoji: '🦇', x: 0.60, y: 0.12, size: 28 },
        { emoji: '👻', x: 0.25, y: 0.55, size: 40 },
        { emoji: '🕷️', x: 0.75, y: 0.65, size: 28 },
        { emoji: '🎃', x: 0.55, y: 0.70, size: 36 },
      ],
      target: { x: 0.10, y: 0.42, w: 0.30, h: 0.28 },
    },
    // Stage 12: Rescue the puppy
    {
      question: 'Rescue the puppy! 🐶',
      bgColor: '#E8F5E9',
      objects: [
        { emoji: '🌳', x: 0.30, y: 0.25, size: 64 },
        { emoji: '🌳', x: 0.70, y: 0.22, size: 60 },
        { emoji: '🐶', x: 0.50, y: 0.58, size: 44 },
        { emoji: '🏠', x: 0.50, y: 0.15, size: 48 },
        { emoji: '🦴', x: 0.25, y: 0.70, size: 28 },
        { emoji: '🧱', x: 0.50, y: 0.65, size: 56 },
        { emoji: '🌻', x: 0.15, y: 0.60, size: 32 },
        { emoji: '🌻', x: 0.85, y: 0.58, size: 30 },
      ],
      target: { x: 0.32, y: 0.45, w: 0.36, h: 0.30 },
    },
    // Stage 13: Find the sun
    {
      question: 'Where is the sun? ☀️',
      bgColor: '#B3E5FC',
      objects: [
        { emoji: '☁️', x: 0.25, y: 0.20, size: 56 },
        { emoji: '☁️', x: 0.55, y: 0.15, size: 64 },
        { emoji: '☁️', x: 0.80, y: 0.22, size: 52 },
        { emoji: '☀️', x: 0.55, y: 0.18, size: 44 },
        { emoji: '🌈', x: 0.50, y: 0.45, size: 60 },
        { emoji: '🏔️', x: 0.30, y: 0.70, size: 56 },
        { emoji: '🏔️', x: 0.70, y: 0.68, size: 52 },
      ],
      target: { x: 0.35, y: 0.05, w: 0.40, h: 0.28 },
    },
    // Stage 14: Find the missing piece
    {
      question: 'Find the missing piece! 🧩',
      bgColor: '#F1F8E9',
      objects: [
        { emoji: '🧩', x: 0.35, y: 0.35, size: 44 },
        { emoji: '🧩', x: 0.55, y: 0.35, size: 44 },
        { emoji: '🧩', x: 0.35, y: 0.55, size: 44 },
        { emoji: '🧩', x: 0.75, y: 0.70, size: 36 },
        { emoji: '📦', x: 0.20, y: 0.65, size: 40 },
        { emoji: '🎨', x: 0.80, y: 0.25, size: 36 },
      ],
      target: { x: 0.60, y: 0.58, w: 0.30, h: 0.25 },
    },
    // Stage 15: Help the bird fly
    {
      question: 'Help the bird fly! 🐦',
      bgColor: '#E1F5FE',
      objects: [
        { emoji: '🐦', x: 0.50, y: 0.50, size: 48 },
        { emoji: '🪢', x: 0.50, y: 0.62, size: 32 },
        { emoji: '🌳', x: 0.20, y: 0.55, size: 56 },
        { emoji: '🌳', x: 0.80, y: 0.50, size: 52 },
        { emoji: '☁️', x: 0.30, y: 0.12, size: 40 },
        { emoji: '☁️', x: 0.70, y: 0.10, size: 44 },
        { emoji: '🌞', x: 0.85, y: 0.08, size: 36 },
      ],
      target: { x: 0.35, y: 0.50, w: 0.30, h: 0.22 },
    },
    // Stage 16: Catch the mouse
    {
      question: 'Catch the mouse! 🐭',
      bgColor: '#FFF8E1',
      objects: [
        { emoji: '🧀', x: 0.50, y: 0.40, size: 48 },
        { emoji: '🐭', x: 0.25, y: 0.62, size: 36 },
        { emoji: '🪤', x: 0.70, y: 0.55, size: 40 },
        { emoji: '🧱', x: 0.50, y: 0.72, size: 60 },
        { emoji: '📦', x: 0.15, y: 0.45, size: 44 },
        { emoji: '📦', x: 0.82, y: 0.42, size: 40 },
      ],
      target: { x: 0.10, y: 0.50, w: 0.30, h: 0.25 },
    },
    // Stage 17: Find the ring
    {
      question: 'Find the ring! 💍',
      bgColor: '#FCE4EC',
      objects: [
        { emoji: '🎁', x: 0.50, y: 0.45, size: 56 },
        { emoji: '💍', x: 0.52, y: 0.43, size: 28 },
        { emoji: '🌹', x: 0.25, y: 0.35, size: 36 },
        { emoji: '🌹', x: 0.75, y: 0.32, size: 34 },
        { emoji: '💐', x: 0.50, y: 0.65, size: 44 },
        { emoji: '🕯️', x: 0.20, y: 0.60, size: 32 },
        { emoji: '🕯️', x: 0.80, y: 0.58, size: 32 },
      ],
      target: { x: 0.35, y: 0.32, w: 0.30, h: 0.25 },
    },
    // Stage 18: Put out the fire
    {
      question: 'Put out the fire! 🔥',
      bgColor: '#FFCCBC',
      objects: [
        { emoji: '🏠', x: 0.50, y: 0.40, size: 64 },
        { emoji: '🔥', x: 0.50, y: 0.30, size: 44 },
        { emoji: '🔥', x: 0.40, y: 0.35, size: 36 },
        { emoji: '🚒', x: 0.25, y: 0.70, size: 48 },
        { emoji: '💧', x: 0.75, y: 0.65, size: 36 },
        { emoji: '🌳', x: 0.15, y: 0.35, size: 48 },
        { emoji: '🌳', x: 0.85, y: 0.38, size: 44 },
      ],
      target: { x: 0.30, y: 0.20, w: 0.40, h: 0.28 },
    },
    // Stage 19: Find the butterfly
    {
      question: 'Find the butterfly! 🦋',
      bgColor: '#E8F5E9',
      objects: [
        { emoji: '🌸', x: 0.25, y: 0.40, size: 44 },
        { emoji: '🌸', x: 0.55, y: 0.35, size: 48 },
        { emoji: '🌸', x: 0.80, y: 0.42, size: 40 },
        { emoji: '🦋', x: 0.55, y: 0.38, size: 32 },
        { emoji: '🌿', x: 0.20, y: 0.65, size: 36 },
        { emoji: '🌿', x: 0.70, y: 0.68, size: 34 },
        { emoji: '☀️', x: 0.50, y: 0.10, size: 40 },
      ],
      target: { x: 0.38, y: 0.25, w: 0.34, h: 0.25 },
    },
    // Stage 20: Find the UFO
    {
      question: 'Find the UFO! 🛸',
      bgColor: '#1A237E',
      objects: [
        { emoji: '🌙', x: 0.80, y: 0.12, size: 40 },
        { emoji: '⭐', x: 0.20, y: 0.15, size: 24 },
        { emoji: '⭐', x: 0.40, y: 0.08, size: 20 },
        { emoji: '⭐', x: 0.65, y: 0.20, size: 22 },
        { emoji: '🛸', x: 0.45, y: 0.35, size: 44 },
        { emoji: '🏔️', x: 0.30, y: 0.75, size: 56 },
        { emoji: '🏔️', x: 0.70, y: 0.72, size: 52 },
        { emoji: '🌲', x: 0.50, y: 0.65, size: 36 },
      ],
      target: { x: 0.28, y: 0.22, w: 0.35, h: 0.25 },
    },
  ];
}
