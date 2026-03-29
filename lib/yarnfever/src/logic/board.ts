import type { NodePos, Edge, BoardState, StageConfig } from '../types';

// ─── Board Creation ──────────────────────────────────────

/**
 * Create a planar graph that is guaranteed to have a non-crossing layout,
 * then scramble node positions so that crossings are introduced.
 */
export function createBoard(config: StageConfig): BoardState {
  const { nodeCount, edgeCount } = config;

  // 1. Generate solution positions on a circle (no crossings)
  const solutionNodes = generateCirclePositions(nodeCount);

  // 2. Generate edges that don't cross in the circular layout
  const edges = generatePlanarEdges(solutionNodes, edgeCount);

  // 3. Scramble node positions to introduce crossings
  const scrambledNodes = scramblePositions(solutionNodes);

  // Make sure we have at least one crossing
  const crossings = countCrossings(scrambledNodes, edges);
  if (crossings === 0) {
    // Force some crossings by swapping node positions
    return createBoard(config);
  }

  return { nodes: scrambledNodes, edges };
}

// ─── Circle Layout ───────────────────────────────────────

function generateCirclePositions(count: number): NodePos[] {
  const nodes: NodePos[] = [];
  const cx = 0.5;
  const cy = 0.5;
  const radius = 0.35;

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    nodes.push({
      id: i,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return nodes;
}

// ─── Edge Generation ─────────────────────────────────────

/**
 * Generate edges for a planar graph.
 * Start with a cycle (ring), then add non-crossing chords.
 */
function generatePlanarEdges(nodes: NodePos[], targetEdgeCount: number): Edge[] {
  const n = nodes.length;
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  const addEdge = (a: number, b: number): boolean => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    edges.push({ from: a, to: b });
    return true;
  };

  // Create a cycle (ring) connecting all nodes
  for (let i = 0; i < n; i++) {
    addEdge(i, (i + 1) % n);
  }

  // Add extra edges (chords) that don't cross existing edges in the circle layout
  const maxAttempts = targetEdgeCount * 10;
  let attempts = 0;

  while (edges.length < targetEdgeCount && attempts < maxAttempts) {
    attempts++;
    const a = Math.floor(Math.random() * n);
    const b = Math.floor(Math.random() * n);
    if (a === b) continue;
    if (Math.abs(a - b) === 1 || (a === 0 && b === n - 1) || (b === 0 && a === n - 1)) continue;

    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeSet.has(key)) continue;

    // Check if this chord crosses any existing non-ring edge
    const newEdge: Edge = { from: a, to: b };
    let crosses = false;
    for (const existing of edges) {
      // Skip ring edges (adjacent nodes)
      if (segmentsIntersect(nodes[newEdge.from], nodes[newEdge.to], nodes[existing.from], nodes[existing.to])) {
        crosses = true;
        break;
      }
    }

    if (!crosses) {
      addEdge(a, b);
    }
  }

  return edges;
}

// ─── Scramble ────────────────────────────────────────────

function scramblePositions(nodes: NodePos[]): NodePos[] {
  const scrambled = nodes.map((n) => ({ ...n }));
  const margin = 0.1;
  const range = 0.8;

  for (const node of scrambled) {
    node.x = margin + Math.random() * range;
    node.y = margin + Math.random() * range;
  }

  // Ensure no two nodes are too close
  for (let i = 0; i < scrambled.length; i++) {
    for (let j = i + 1; j < scrambled.length; j++) {
      const dx = scrambled[i].x - scrambled[j].x;
      const dy = scrambled[i].y - scrambled[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.08) {
        scrambled[j].x = margin + Math.random() * range;
        scrambled[j].y = margin + Math.random() * range;
      }
    }
  }

  return scrambled;
}

// ─── Crossing Detection ─────────────────────────────────

/** Check if two line segments intersect (proper intersection only, not at endpoints) */
export function segmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number },
): boolean {
  // Skip if segments share an endpoint
  if ((p1.x === p3.x && p1.y === p3.y) || (p1.x === p4.x && p1.y === p4.y) ||
      (p2.x === p3.x && p2.y === p3.y) || (p2.x === p4.x && p2.y === p4.y)) {
    return false;
  }

  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return false;
}

function direction(
  pi: { x: number; y: number },
  pj: { x: number; y: number },
  pk: { x: number; y: number },
): number {
  return (pk.x - pi.x) * (pj.y - pi.y) - (pj.x - pi.x) * (pk.y - pi.y);
}

/** Count the number of edge crossings in the current layout */
export function countCrossings(nodes: NodePos[], edges: Edge[]): number {
  let crossings = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];
      // Skip edges that share a node
      if (e1.from === e2.from || e1.from === e2.to || e1.to === e2.from || e1.to === e2.to) {
        continue;
      }
      if (segmentsIntersect(nodes[e1.from], nodes[e1.to], nodes[e2.from], nodes[e2.to])) {
        crossings++;
      }
    }
  }
  return crossings;
}

/** Get set of edge indices that are currently crossing */
export function getCrossingEdges(nodes: NodePos[], edges: Edge[]): Set<number> {
  const crossing = new Set<number>();
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];
      if (e1.from === e2.from || e1.from === e2.to || e1.to === e2.from || e1.to === e2.to) {
        continue;
      }
      if (segmentsIntersect(nodes[e1.from], nodes[e1.to], nodes[e2.from], nodes[e2.to])) {
        crossing.add(i);
        crossing.add(j);
      }
    }
  }
  return crossing;
}
