import { describe, it, expect } from 'vitest';
import { isAdjacent, swap, calcMatchScore, findAllMatches, EMPTY } from '../logic/board';
import type { Board } from '../logic/board';

describe('isAdjacent', () => {
  it('returns true for cells 1 row apart', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(true);
  });

  it('returns true for cells 1 col apart', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(true);
  });

  it('returns false for diagonal cells', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(false);
  });

  it('returns false for same cell', () => {
    expect(isAdjacent({ row: 2, col: 2 }, { row: 2, col: 2 })).toBe(false);
  });

  it('returns false for cells 2 apart', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
  });
});

describe('swap', () => {
  it('swaps values of two cells', () => {
    const board: Board = [
      [0, 1, 2],
      [3, 4, 5],
    ];
    swap(board, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(board[0][0]).toBe(1);
    expect(board[0][1]).toBe(0);
  });

  it('swaps across rows', () => {
    const board: Board = [
      [7, 8],
      [9, 10],
    ];
    swap(board, { row: 0, col: 1 }, { row: 1, col: 0 });
    expect(board[0][1]).toBe(9);
    expect(board[1][0]).toBe(8);
  });
});

describe('calcMatchScore', () => {
  it('returns 100 for 3-cell match at combo 1', () => {
    expect(calcMatchScore(3, 1)).toBe(100);
  });

  it('returns 200 for 4-cell match at combo 1', () => {
    expect(calcMatchScore(4, 1)).toBe(200);
  });

  it('returns 500 for 5-cell match at combo 1', () => {
    expect(calcMatchScore(5, 1)).toBe(500);
  });

  it('multiplies by combo', () => {
    expect(calcMatchScore(3, 2)).toBe(200);
    expect(calcMatchScore(4, 3)).toBe(600);
  });

  it('treats combo 0 as 1', () => {
    expect(calcMatchScore(3, 0)).toBe(100);
  });
});

describe('findAllMatches', () => {
  it('returns empty array when no matches', () => {
    // checkerboard — no 3 in a row
    const board: Board = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 1, 0],
    ];
    expect(findAllMatches(board)).toHaveLength(0);
  });

  it('finds a horizontal match', () => {
    const board: Board = [
      [0, 0, 0],
      [1, 2, 1],
      [2, 1, 2],
    ];
    const matches = findAllMatches(board);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toHaveLength(3);
    matches[0].forEach((c) => expect(c.row).toBe(0));
  });

  it('finds a vertical match', () => {
    const board: Board = [
      [0, 1, 2],
      [0, 2, 1],
      [0, 1, 2],
    ];
    const matches = findAllMatches(board);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toHaveLength(3);
    matches[0].forEach((c) => expect(c.col).toBe(0));
  });

  it('ignores EMPTY cells', () => {
    const board: Board = [
      [EMPTY, EMPTY, EMPTY],
      [1, 2, 1],
      [2, 1, 2],
    ];
    expect(findAllMatches(board)).toHaveLength(0);
  });

  it('finds 4-cell horizontal match', () => {
    const board: Board = [
      [0, 0, 0, 0],
      [1, 2, 1, 2],
      [2, 1, 2, 1],
    ];
    const matches = findAllMatches(board);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toHaveLength(4);
  });
});
