import type { BoardState, Screw, Plank, Hole, StageConfig } from '../types';

// ─── Board Creation ──────────────────────────────────────

export function createBoard(config: StageConfig): BoardState {
  const { numPlanks, numColors, screwsPerColor } = config;
  const totalScrews = numColors * screwsPerColor;

  for (let attempt = 0; attempt < 100; attempt++) {
    // Build screw list: screwsPerColor of each color
    const colorList: number[] = [];
    for (let c = 0; c < numColors; c++) {
      for (let i = 0; i < screwsPerColor; i++) {
        colorList.push(c);
      }
    }

    // Shuffle screws
    for (let i = colorList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorList[i], colorList[j]] = [colorList[j], colorList[i]];
    }

    // Distribute screws across planks
    const screwsPerPlank = Math.ceil(totalScrews / numPlanks);
    const planks: Plank[] = [];
    const screws: Screw[] = [];
    let screwIdx = 0;

    // Layout planks in a staggered pattern
    const plankAngles = [0, -15, 12, -8, 18, -12, 10, -18, 5, -10];

    for (let p = 0; p < numPlanks; p++) {
      const slotsInThisPlank = Math.min(screwsPerPlank, totalScrews - screwIdx);
      const plankWidth = 60 + slotsInThisPlank * 40;
      const plankHeight = 28;

      // Stagger planks across the board area
      const col = p % 3;
      const row = Math.floor(p / 3);
      const baseX = 80 + col * 100;
      const baseY = 80 + row * 90;

      const angle = plankAngles[p % plankAngles.length];

      const screwSlots: (number | null)[] = [];

      for (let s = 0; s < slotsInThisPlank; s++) {
        if (screwIdx < colorList.length) {
          const screw: Screw = {
            id: screwIdx,
            color: colorList[screwIdx],
            plankId: p,
            slotIndex: s,
            removed: false,
          };
          screws.push(screw);
          screwSlots.push(screwIdx);
          screwIdx++;
        } else {
          screwSlots.push(null);
        }
      }

      planks.push({
        id: p,
        x: baseX,
        y: baseY,
        width: plankWidth,
        height: plankHeight,
        angle,
        layer: p, // later planks are on top
        screwSlots,
      });
    }

    // Create holes: one for each screw, grouped by color
    const holes: Hole[] = [];
    for (let c = 0; c < numColors; c++) {
      for (let i = 0; i < screwsPerColor; i++) {
        holes.push({
          id: c * screwsPerColor + i,
          color: c,
          filled: false,
          screwId: null,
        });
      }
    }

    const board = { screws, planks, holes, numColors };
    if (!isStuck(board)) {
      return board;
    }
  }

  // Final fallback to the last attempt if no solvable board found
  // (In practice, 100 attempts should be plenty)
  return tryGenerateEmergencyBoard(config);
}

function tryGenerateEmergencyBoard(config: StageConfig): BoardState {
  // Simple non-stuck distribution: planks don't overlap much
  const { numPlanks, numColors, screwsPerColor } = config;
  const totalScrews = numColors * screwsPerColor;
  const screws: Screw[] = [];
  const planks: Plank[] = [];
  const holes: Hole[] = [];

  for (let p = 0; p < numPlanks; p++) {
    const slots = Math.ceil(totalScrews / numPlanks);
    const screwSlots: (number | null)[] = [];
    for (let s = 0; s < slots; s++) {
      const id = p * slots + s;
      if (id < totalScrews) {
        screws.push({ id, color: id % numColors, plankId: p, slotIndex: s, removed: false });
        screwSlots.push(id);
      } else {
        screwSlots.push(null);
      }
    }
    // Place planks in a diagonal non-overlapping line
    planks.push({
      id: p, x: 100 + p * 40, y: 100 + p * 40, width: 100, height: 28, angle: 0, layer: p, screwSlots
    });
  }
  for (let c = 0; c < numColors; c++) {
    for (let i = 0; i < screwsPerColor; i++) {
      holes.push({ id: c * screwsPerColor + i, color: c, filled: false, screwId: null });
    }
  }
  return { screws, planks, holes, numColors };
}

// ─── Screw Interaction ───────────────────────────────────

/**
 * Check if a screw can be removed from its plank.
 * A screw can only be removed if it's on the topmost plank at its position,
 * meaning no other plank is covering it.
 */
export function canRemoveScrew(board: BoardState, screwId: number): boolean {
  const screw = board.screws[screwId];
  if (!screw || screw.removed) return false;

  const plank = board.planks[screw.plankId];
  if (!plank) return false;

  // Get the screw's world position
  const screwPos = getScrewWorldPosition(plank, screw.slotIndex);

  // Check if any plank with a higher layer overlaps this screw position
  for (const otherPlank of board.planks) {
    if (otherPlank.id === plank.id) continue;
    if (otherPlank.layer <= plank.layer) continue;

    // Check if this other plank still has screws (if all screws removed, plank is gone)
    const hasActiveScrews = otherPlank.screwSlots.some(
      (sid) => {
        if (sid === null) return false;
        const s = board.screws[sid];
        return s && !s.removed;
      }
    );
    if (!hasActiveScrews) continue;

    // Check if the screw position falls within the other plank
    if (isPointInPlank(screwPos.x, screwPos.y, otherPlank)) {
      return false; // blocked by a higher plank
    }
  }

  return true;
}

/** Get world position of a screw slot on a plank */
export function getScrewWorldPosition(
  plank: Plank,
  slotIndex: number,
): { x: number; y: number } {
  const slotCount = plank.screwSlots.length;
  const spacing = plank.width / (slotCount + 1);
  const localX = -plank.width / 2 + spacing * (slotIndex + 1);
  const localY = 0;

  // Rotate around plank center
  const rad = (plank.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: plank.x + localX * cos - localY * sin,
    y: plank.y + localX * sin + localY * cos,
  };
}

/** Check if a point is inside a rotated rectangle (plank) */
export function isPointInPlank(px: number, py: number, plank: Plank): boolean {
  // Transform point to plank local coordinates
  const dx = px - plank.x;
  const dy = py - plank.y;
  const rad = (-plank.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const hw = plank.width / 2 + 5; // small tolerance
  const hh = plank.height / 2 + 5;
  return Math.abs(localX) <= hw && Math.abs(localY) <= hh;
}

// ─── Place Screw in Hole ─────────────────────────────────

/** Find an available hole for a screw color */
export function findAvailableHole(
  board: BoardState,
  screwColor: number,
): number | null {
  for (let i = 0; i < board.holes.length; i++) {
    if (board.holes[i].color === screwColor && !board.holes[i].filled) {
      return i;
    }
  }
  return null;
}

/** Remove a screw and place it in the matching hole */
export function removeScrewAndPlace(
  board: BoardState,
  screwId: number,
): { newBoard: BoardState; holeIdx: number } | null {
  if (!canRemoveScrew(board, screwId)) return null;

  const screw = board.screws[screwId];
  const holeIdx = findAvailableHole(board, screw.color);
  if (holeIdx === null) return null;

  // Deep clone
  const newBoard: BoardState = {
    screws: board.screws.map((s) => ({ ...s })),
    planks: board.planks.map((p) => ({ ...p, screwSlots: [...p.screwSlots] })),
    holes: board.holes.map((h) => ({ ...h })),
    numColors: board.numColors,
  };

  // Remove screw from plank
  newBoard.screws[screwId].removed = true;
  const plank = newBoard.planks[screw.plankId];
  plank.screwSlots[screw.slotIndex] = null;

  // Place in hole
  newBoard.holes[holeIdx].filled = true;
  newBoard.holes[holeIdx].screwId = screwId;

  return { newBoard, holeIdx };
}

// ─── Win Check ───────────────────────────────────────────

export function isWon(board: BoardState): boolean {
  return board.holes.every((h) => h.filled);
}

/** Check if a color group is complete (all holes filled) */
export function isColorComplete(board: BoardState, color: number): boolean {
  const colorHoles = board.holes.filter((h) => h.color === color);
  if (colorHoles.length === 0) return false;
  return colorHoles.every((h) => h.filled);
}

/** Check if the game is stuck (no screw can be removed and placed) */
export function isStuck(board: BoardState): boolean {
  for (const screw of board.screws) {
    if (screw.removed) continue;
    if (!canRemoveScrew(board, screw.id)) continue;
    if (findAvailableHole(board, screw.color) !== null) return false;
  }
  return true;
}
