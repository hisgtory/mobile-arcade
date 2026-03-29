// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Colors ──────────────────────────────────────────────
export const YARN_COLORS: readonly string[] = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
] as const;

export const NODE_COLOR = '#374151';
export const NODE_ACTIVE_COLOR = '#2563EB';
export const EDGE_NORMAL_COLOR = '#9CA3AF';
export const EDGE_CROSS_COLOR = '#EF4444';
export const EDGE_CLEAR_COLOR = '#22C55E';

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  /** Number of nodes in the graph */
  nodeCount: number;
  /** Number of edges in the graph */
  edgeCount: number;
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, nodeCount: 4, edgeCount: 6 },
    { stage: 2, nodeCount: 5, edgeCount: 8 },
    { stage: 3, nodeCount: 6, edgeCount: 10 },
    { stage: 4, nodeCount: 7, edgeCount: 12 },
    { stage: 5, nodeCount: 8, edgeCount: 14 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 5: scale up
  const nodeCount = Math.min(8 + (stage - 5), 15);
  const edgeCount = Math.min(14 + (stage - 5) * 2, 30);
  return { stage, nodeCount, edgeCount };
}

// ─── Game Types ──────────────────────────────────────────
export interface NodePos {
  id: number;
  x: number;
  y: number;
}

export interface Edge {
  from: number;
  to: number;
}

export interface BoardState {
  nodes: NodePos[];
  edges: Edge[];
}

export interface GameConfig {
  stage?: number;
}
