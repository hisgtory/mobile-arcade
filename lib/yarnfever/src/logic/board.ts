import type { GraphNode, GraphEdge, BoardState, StageConfig, Point } from '../types';

// ─── Board Creation ──────────────────────────────────────

/**
 * Create a planar graph, then scramble node positions so edges cross.
 * The player must drag nodes to eliminate all crossings.
 */
export function createBoard(config: StageConfig, width: number, height: number): BoardState {
  const { numNodes, numEdges } = config;
  const margin = 50;

  // Step 1: Generate a planar graph (nodes on a circle = guaranteed planar layout)
  const nodes: GraphNode[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - margin;

  for (let i = 0; i < numNodes; i++) {
    const angle = (2 * Math.PI * i) / numNodes - Math.PI / 2;
    nodes.push({
      id: i,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }

  // Step 2: Generate edges (connect neighbors + some diagonals for complexity)
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  function addEdge(a: number, b: number): boolean {
    if (a === b) return false;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    edges.push({ from: a, to: b, color: edges.length % 12 });
    return true;
  }

  // Ring edges (guaranteed planar)
  for (let i = 0; i < numNodes; i++) {
    addEdge(i, (i + 1) % numNodes);
  }

  // Add extra edges (skip-1, skip-2 connections)
  let skip = 2;
  while (edges.length < numEdges && skip < numNodes - 1) {
    for (let i = 0; i < numNodes && edges.length < numEdges; i++) {
      addEdge(i, (i + skip) % numNodes);
    }
    skip++;
  }

  // Step 3: Scramble node positions (random placement within bounds)
  const scrambled = scrambleNodes(nodes, width, height, margin);

  return { nodes: scrambled, edges };
}

/**
 * Scramble nodes to random positions, ensuring edges will cross.
 */
function scrambleNodes(
  nodes: GraphNode[],
  width: number,
  height: number,
  margin: number,
): GraphNode[] {
  return nodes.map((n) => ({
    ...n,
    x: margin + Math.random() * (width - margin * 2),
    y: margin + Math.random() * (height - margin * 2),
  }));
}

// ─── Intersection Detection ──────────────────────────────

/**
 * Check if two line segments (p1-p2) and (p3-p4) intersect.
 * Uses cross product method. Does NOT count shared endpoints.
 */
export function segmentsIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): boolean {
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  // Collinear cases
  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: Point, b: Point, c: Point): boolean {
  return (
    Math.min(a.x, b.x) <= c.x &&
    c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y &&
    c.y <= Math.max(a.y, b.y)
  );
}

/**
 * Count the number of edge crossings in the current node layout.
 */
export function countCrossings(nodes: GraphNode[], edges: GraphEdge[]): number {
  let crossings = 0;

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];

      // Skip if edges share a node
      if (e1.from === e2.from || e1.from === e2.to ||
          e1.to === e2.from || e1.to === e2.to) {
        continue;
      }

      const p1 = nodes[e1.from];
      const p2 = nodes[e1.to];
      const p3 = nodes[e2.from];
      const p4 = nodes[e2.to];

      if (segmentsIntersect(p1, p2, p3, p4)) {
        crossings++;
      }
    }
  }

  return crossings;
}

/**
 * Check if the puzzle is solved (zero crossings).
 */
export function isSolved(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  return countCrossings(nodes, edges) === 0;
}
