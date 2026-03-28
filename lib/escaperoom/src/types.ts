// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Room Object Types ──────────────────────────────────
export type ObjectKind = 'inspectable' | 'collectible' | 'usable' | 'exit';

export interface RoomObject {
  id: string;
  label: string;
  /** Rectangular bounds in normalised coords (0-1 range) */
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ObjectKind;
  /** Text shown on inspection */
  inspectText?: string;
  /** Item id granted when collected */
  grantsItem?: string;
  /** Item id required to activate (usable / exit) */
  requiresItem?: string;
  /** If true, this object is hidden until a prerequisite is met */
  hidden?: boolean;
  /** Prerequisite object id that must be resolved first */
  prerequisite?: string;
  /** Visual: fill colour (hex number) */
  color: number;
  /** Visual: emoji or short icon text rendered on the object */
  icon?: string;
}

// ─── Item (Inventory) ───────────────────────────────────
export interface Item {
  id: string;
  label: string;
  icon: string;
}

// ─── Room Config ────────────────────────────────────────
export interface RoomConfig {
  stage: number;
  title: string;
  description: string;
  /** Background colour */
  bgColor: number;
  objects: RoomObject[];
  /** Items obtainable in this room */
  items: Item[];
}

// ─── Stage Config (public) ──────────────────────────────
export interface StageConfig {
  stage: number;
  title: string;
}

// ─── Game Config ────────────────────────────────────────
export interface GameConfig {
  stage?: number;
}

// ─── Game Phase ─────────────────────────────────────────
export type GamePhase = 'playing' | 'inspecting' | 'cleared';
