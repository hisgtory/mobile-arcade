// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  theme: string;
  objectCount: number;
  clueCount: number;
  /** Emoji pool for objects in this room */
  objects: string[];
  /** Indices into `objects` that are clues (collectible) */
  clueIndices: number[];
  /** Correct order of clue indices for puzzle solution */
  solutionOrder: number[];
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    {
      stage: 1,
      theme: '서재',
      objectCount: 9,
      clueCount: 3,
      objects: ['📖', '🕯️', '🔑', '🖋️', '📜', '🪑', '🏺', '⏰', '🗺️'],
      clueIndices: [2, 4, 8], // 🔑, 📜, 🗺️
      solutionOrder: [8, 4, 2], // 🗺️ → 📜 → 🔑
    },
    {
      stage: 2,
      theme: '실험실',
      objectCount: 12,
      clueCount: 4,
      objects: ['🧪', '🔬', '⚗️', '💊', '🧬', '🔋', '💡', '📋', '🧲', '⚙️', '🔩', '🛠️'],
      clueIndices: [0, 2, 6, 8], // 🧪, ⚗️, 💡, 🧲
      solutionOrder: [6, 0, 2, 8], // 💡 → 🧪 → ⚗️ → 🧲
    },
    {
      stage: 3,
      theme: '감옥',
      objectCount: 12,
      clueCount: 4,
      objects: ['⛓️', '🗝️', '🪨', '🕸️', '🐀', '🔓', '🧱', '💀', '🪣', '📎', '🔦', '🪟'],
      clueIndices: [1, 5, 9, 10], // 🗝️, 🔓, 📎, 🔦
      solutionOrder: [10, 9, 5, 1], // 🔦 → 📎 → 🔓 → 🗝️
    },
    {
      stage: 4,
      theme: '보물방',
      objectCount: 16,
      clueCount: 5,
      objects: ['💎', '👑', '🏆', '💰', '🪙', '📿', '🗡️', '🛡️', '🎭', '🧭', '🪬', '🔱', '⚱️', '🏺', '💍', '🪞'],
      clueIndices: [0, 1, 9, 14, 15], // 💎, 👑, 🧭, 💍, 🪞
      solutionOrder: [15, 9, 14, 0, 1], // 🪞 → 🧭 → 💍 → 💎 → 👑
    },
    {
      stage: 5,
      theme: '마법의 방',
      objectCount: 16,
      clueCount: 5,
      objects: ['🔮', '✨', '🌙', '⭐', '🪄', '📕', '🕯️', '💫', '🦉', '🐉', '🧙', '🏰', '🌀', '🎆', '🪶', '🫧'],
      clueIndices: [0, 4, 7, 12, 14], // 🔮, 🪄, 💫, 🌀, 🪶
      solutionOrder: [14, 4, 12, 7, 0], // 🪶 → 🪄 → 🌀 → 💫 → 🔮
    },
  ];

  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 5: cycle themes with increasing clues
  // TODO: Scale difficulty (objectCount, clueCount) for later stages
  const base = configs[(stage - 1) % configs.length];
  return { ...base, stage };
}

// ─── Game Types ──────────────────────────────────────────

export interface RoomState {
  /** Which object indices have been tapped (revealed as clue) */
  collectedClues: number[];
  /** Current code input sequence (clue indices) */
  codeInput: number[];
  /** Whether puzzle panel is active */
  puzzleActive: boolean;
  /** Whether room is solved */
  solved: boolean;
}

export interface GameConfig {
  stage?: number;
}
