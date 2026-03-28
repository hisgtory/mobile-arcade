import type { PuzzleData, WordEntry } from '../types';

/** Build a 2D grid from puzzle data. null = empty cell, string = Korean character. */
export function getGridLayout(puzzle: PuzzleData): (string | null)[][] {
  const grid: (string | null)[][] = [];
  for (let r = 0; r < puzzle.gridRows; r++) {
    grid[r] = [];
    for (let c = 0; c < puzzle.gridCols; c++) {
      grid[r][c] = null;
    }
  }

  for (const w of puzzle.words) {
    const chars = [...w.word];
    for (let i = 0; i < chars.length; i++) {
      const r = w.direction === 'h' ? w.row : w.row + i;
      const c = w.direction === 'h' ? w.col + i : w.col;
      grid[r][c] = chars[i];
    }
  }

  return grid;
}

/** Check if given letters (in order) match any unfound word in the puzzle. */
export function checkWord(
  selected: string[],
  puzzle: PuzzleData,
  foundWords: string[],
): WordEntry | null {
  const attempt = selected.join('');
  for (const w of puzzle.words) {
    if (w.word === attempt && !foundWords.includes(w.word)) {
      return w;
    }
  }
  return null;
}

/** Check if all words have been found. */
export function isComplete(foundWords: string[], puzzle: PuzzleData): boolean {
  return puzzle.words.every((w) => foundWords.includes(w.word));
}
