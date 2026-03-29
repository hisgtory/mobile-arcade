// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;
export const NODE_RADIUS = 14;

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
  '#92400E', // Brown
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#F43F5E', // Rose
] as const;

// ─── Types ───────────────────────────────────────────────
export interface Point {
  x: number;
  y: number;
}

export interface GraphNode {
  id: number;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: number;
  to: number;
  color: number; // index into YARN_COLORS
}

export interface BoardState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── Stage Config ────────────────────────────────────────
export interface StageConfig {
  stage: number;
  numNodes: number;
  numEdges: number;
}

export function getStageConfig(stage: number): StageConfig {
  const configs: StageConfig[] = [
    { stage: 1, numNodes: 5, numEdges: 6 },
    { stage: 2, numNodes: 6, numEdges: 8 },
    { stage: 3, numNodes: 7, numEdges: 10 },
    { stage: 4, numNodes: 8, numEdges: 12 },
    { stage: 5, numNodes: 9, numEdges: 14 },
  ];
  if (stage <= configs.length) return configs[stage - 1];
  // Beyond stage 5: scale up
  const numNodes = Math.min(9 + (stage - 5), 20);
  const numEdges = Math.min(14 + (stage - 5) * 2, 40);
  return { stage, numNodes, numEdges };
}

// ─── Game Types ──────────────────────────────────────────
export interface GameConfig {
  stage?: number;
}
