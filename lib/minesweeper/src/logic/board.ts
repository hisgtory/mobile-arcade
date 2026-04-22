/**
 * Board logic for Minesweeper
 *
 * Grid of cells. Each cell can be hidden, revealed, or flagged.
 * First click is always safe (mines placed after first click).
 */

import { type Cell, type CellState, type DifficultyConfig } from '../types';

export type Board = Cell[][];

export function createBoard(config: DifficultyConfig): Board {
  const { rows, cols } = config;
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      adjacentMines: 0,
      state: 'hidden' as CellState,
    })),
  );
}

/** Place mines randomly, ensuring safeRow/safeCol and its neighbors are safe */
export function placeMines(
  board: Board,
  config: DifficultyConfig,
  safeRow: number,
  safeCol: number,
): void {
  const { rows, cols, mines } = config;

  // Build set of safe cells (clicked cell + its neighbors)
  const safeCells = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = safeRow + dr;
      const nc = safeCol + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        safeCells.add(`${nr},${nc}`);
      }
    }
  }

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (board[r][c].mine) continue;
    if (safeCells.has(`${r},${c}`)) continue;
    board[r][c].mine = true;
    placed++;
  }

  // Calculate adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
            count++;
          }
        }
      }
      board[r][c].adjacentMines = count;
    }
  }
}

/** Reveal a cell. If it's a 0-adjacent cell, flood-fill reveal neighbors. Returns revealed cells. */
export function revealCell(
  board: Board,
  row: number,
  col: number,
): { row: number; col: number }[] {
  const rows = board.length;
  const cols = board[0].length;
  const revealed: { row: number; col: number }[] = [];

  if (row < 0 || row >= rows || col < 0 || col >= cols) return revealed;
  if (board[row][col].state !== 'hidden') return revealed;

  board[row][col].state = 'revealed';
  revealed.push({ row, col });

  // If mine, just reveal and return
  if (board[row][col].mine) return revealed;

  // Flood-fill if 0 adjacent mines
  if (board[row][col].adjacentMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        revealed.push(...revealCell(board, row + dr, col + dc));
      }
    }
  }

  return revealed;
}

/** Toggle flag on a hidden cell */
export function toggleFlag(board: Board, row: number, col: number): boolean {
  const cell = board[row][col];
  if (cell.state === 'hidden') {
    cell.state = 'flagged';
    return true;
  } else if (cell.state === 'flagged') {
    cell.state = 'hidden';
    return true;
  }
  return false;
}

/** Count remaining flags (mines - flagged cells) */
export function getMinesRemaining(board: Board, totalMines: number): number {
  let flagged = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.state === 'flagged') flagged++;
    }
  }
  return totalMines - flagged;
}

/** Check if the game is won: all non-mine cells are revealed */
export function checkWin(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.mine && cell.state !== 'revealed') return false;
    }
  }
  return true;
}

/** Reveal all mines (on game over) */
export function revealAllMines(board: Board): { row: number; col: number }[] {
  const revealed: { row: number; col: number }[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c].mine && board[r][c].state !== 'revealed') {
        board[r][c].state = 'revealed';
        revealed.push({ row: r, col: c });
      }
    }
  }
  return revealed;
}
