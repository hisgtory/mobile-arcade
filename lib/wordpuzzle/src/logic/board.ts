import type { StageConfig, BoardState, WordPlacement } from '../types';

// ─── Korean Word Database ─────────────────────────────────

const WORD_POOL: string[][] = [
  // 2-letter words
  ['사과', '바다', '하늘', '나무', '구름', '별빛', '꽃잎', '새벽', '노래', '햇빛',
   '소리', '마음', '바람', '지구', '달빛', '눈물', '시간', '세상', '우리', '가을',
   '겨울', '봄날', '여름', '산책', '공원', '도시', '학교', '친구', '가족', '미래'],
  // 3-letter words
  ['사랑해', '고마워', '행복해', '아름다', '즐거운', '따뜻한', '나비야', '무지개',
   '해바라', '초콜릿', '아이스', '캔디야', '피아노', '기타야', '드럼이', '음악이'],
];

// ─── Stage Definitions ────────────────────────────────────

const STAGE_CONFIGS: StageConfig[] = [
  // Easy (5×5, 3 words)
  { stage: 1, gridSize: 5, words: ['사과', '바다', '하늘'] },
  { stage: 2, gridSize: 5, words: ['나무', '구름', '별빛'] },
  { stage: 3, gridSize: 5, words: ['꽃잎', '새벽', '노래'] },
  { stage: 4, gridSize: 5, words: ['햇빛', '소리', '마음'] },
  { stage: 5, gridSize: 5, words: ['바람', '지구', '달빛'] },
  // Medium (5×5, 4 words)
  { stage: 6, gridSize: 5, words: ['사과', '눈물', '시간', '세상'] },
  { stage: 7, gridSize: 5, words: ['우리', '가을', '겨울', '봄날'] },
  { stage: 8, gridSize: 5, words: ['여름', '산책', '공원', '도시'] },
  { stage: 9, gridSize: 5, words: ['학교', '친구', '가족', '미래'] },
  { stage: 10, gridSize: 5, words: ['하늘', '바다', '나무', '별빛'] },
];

export function getStageConfig(stage: number): StageConfig {
  if (stage <= STAGE_CONFIGS.length) return STAGE_CONFIGS[stage - 1];
  // Beyond defined stages: generate from pool
  const gridSize = 5;
  const numWords = Math.min(3 + Math.floor((stage - 1) / 5), 5);
  const pool = WORD_POOL[0];
  const words: string[] = [];
  const used = new Set<number>();
  while (words.length < numWords) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!used.has(idx)) {
      used.add(idx);
      words.push(pool[idx]);
    }
  }
  return { stage, gridSize, words };
}

// ─── Random Korean Characters ─────────────────────────────

const KOREAN_CHARS = '가나다라마바사아자차카타파하고노도로모보소오조코토포호구누두루무부수우주쿠투푸후';

function randomKoreanChar(): string {
  return KOREAN_CHARS[Math.floor(Math.random() * KOREAN_CHARS.length)];
}

// ─── Board Creation ───────────────────────────────────────

type Direction = 'horizontal' | 'vertical';

interface PlacementAttempt {
  word: string;
  row: number;
  col: number;
  direction: Direction;
}

function canPlace(grid: string[][], attempt: PlacementAttempt, gridSize: number): boolean {
  const chars = [...attempt.word];
  for (let i = 0; i < chars.length; i++) {
    const r = attempt.direction === 'vertical' ? attempt.row + i : attempt.row;
    const c = attempt.direction === 'horizontal' ? attempt.col + i : attempt.col;
    if (r >= gridSize || c >= gridSize) return false;
    if (grid[r][c] !== '' && grid[r][c] !== chars[i]) return false;
  }
  return true;
}

function placeWord(grid: string[][], attempt: PlacementAttempt): { row: number; col: number }[] {
  const chars = [...attempt.word];
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < chars.length; i++) {
    const r = attempt.direction === 'vertical' ? attempt.row + i : attempt.row;
    const c = attempt.direction === 'horizontal' ? attempt.col + i : attempt.col;
    grid[r][c] = chars[i];
    cells.push({ row: r, col: c });
  }
  return cells;
}

export function createBoard(config: StageConfig): BoardState {
  const { gridSize, words } = config;
  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: string[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => ''),
    );
    const placements: WordPlacement[] = [];
    let success = true;

    // Sort words by length (longest first for better placement)
    const sortedWords = [...words].sort((a, b) => [...b].length - [...a].length);

    for (const word of sortedWords) {
      const chars = [...word];
      let placed = false;
      const directions: Direction[] = ['horizontal', 'vertical'];

      // Shuffle directions
      if (Math.random() > 0.5) directions.reverse();

      for (const dir of directions) {
        if (placed) break;
        // Try random positions
        const positions: { row: number; col: number }[] = [];
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            positions.push({ row: r, col: c });
          }
        }
        // Fisher-Yates shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (const pos of positions) {
          const att: PlacementAttempt = {
            word,
            row: pos.row,
            col: pos.col,
            direction: dir,
          };
          if (canPlace(grid, att, gridSize)) {
            const cells = placeWord(grid, att);
            placements.push({ word, cells, found: false });
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        success = false;
        break;
      }
    }

    if (success) {
      // Fill empty cells with random Korean characters
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (grid[r][c] === '') {
            grid[r][c] = randomKoreanChar();
          }
        }
      }
      return { grid, gridSize, placements, numWords: words.length };
    }
  }

  throw new Error(`Failed to create board after ${maxAttempts} attempts`);
}

// ─── Word Check ──────────────────────────────────────────

export function checkWord(
  board: BoardState,
  selectedCells: { row: number; col: number }[],
): number {
  // Check if the selected cells match any unfound word
  for (let i = 0; i < board.placements.length; i++) {
    const placement = board.placements[i];
    if (placement.found) continue;

    if (placement.cells.length !== selectedCells.length) continue;

    // Check forward match
    const forwardMatch = placement.cells.every(
      (c, idx) => c.row === selectedCells[idx].row && c.col === selectedCells[idx].col,
    );
    // Check reverse match
    const reverseCells = [...selectedCells].reverse();
    const reverseMatch = placement.cells.every(
      (c, idx) => c.row === reverseCells[idx].row && c.col === reverseCells[idx].col,
    );

    if (forwardMatch || reverseMatch) return i;
  }
  return -1;
}

// ─── Win Check ───────────────────────────────────────────

export function isWon(board: BoardState): boolean {
  return board.placements.every((p) => p.found);
}
