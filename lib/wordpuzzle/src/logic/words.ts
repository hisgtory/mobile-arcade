import type { PuzzleData } from '../types';

const PUZZLES: PuzzleData[] = [
  // ─── Easy: 3 words, 5×5 ───────────────────────────────
  {
    id: 1, gridRows: 5, gridCols: 5,
    words: [
      { word: '사과', direction: 'h', row: 0, col: 0 },
      { word: '과일', direction: 'v', row: 0, col: 1 },
      { word: '일기', direction: 'h', row: 1, col: 1 },
    ],
    letters: ['사', '과', '일', '기'],
  },
  {
    id: 2, gridRows: 5, gridCols: 5,
    words: [
      { word: '바다', direction: 'h', row: 0, col: 0 },
      { word: '바람', direction: 'v', row: 0, col: 0 },
      { word: '다리', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['바', '다', '람', '리'],
  },
  {
    id: 3, gridRows: 5, gridCols: 5,
    words: [
      { word: '하늘', direction: 'h', row: 0, col: 0 },
      { word: '하루', direction: 'v', row: 0, col: 0 },
      { word: '루비', direction: 'h', row: 1, col: 0 },
    ],
    letters: ['하', '늘', '루', '비'],
  },
  {
    id: 4, gridRows: 5, gridCols: 5,
    words: [
      { word: '나무', direction: 'h', row: 0, col: 0 },
      { word: '나라', direction: 'v', row: 0, col: 0 },
      { word: '무대', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['나', '무', '라', '대'],
  },
  {
    id: 5, gridRows: 5, gridCols: 5,
    words: [
      { word: '가족', direction: 'h', row: 0, col: 0 },
      { word: '가수', direction: 'v', row: 0, col: 0 },
      { word: '수박', direction: 'h', row: 1, col: 0 },
    ],
    letters: ['가', '족', '수', '박'],
  },
  {
    id: 6, gridRows: 5, gridCols: 5,
    words: [
      { word: '학교', direction: 'h', row: 0, col: 0 },
      { word: '학생', direction: 'v', row: 0, col: 0 },
      { word: '교실', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['학', '교', '생', '실'],
  },
  {
    id: 7, gridRows: 5, gridCols: 5,
    words: [
      { word: '친구', direction: 'h', row: 0, col: 0 },
      { word: '친절', direction: 'v', row: 0, col: 0 },
      { word: '구름', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['친', '구', '절', '름'],
  },
  {
    id: 8, gridRows: 5, gridCols: 5,
    words: [
      { word: '건강', direction: 'h', row: 0, col: 0 },
      { word: '건물', direction: 'v', row: 0, col: 0 },
      { word: '강물', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['건', '강', '물'],
  },
  {
    id: 9, gridRows: 5, gridCols: 5,
    words: [
      { word: '세계', direction: 'h', row: 0, col: 0 },
      { word: '세상', direction: 'v', row: 0, col: 0 },
      { word: '계단', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['세', '계', '상', '단'],
  },
  {
    id: 10, gridRows: 5, gridCols: 5,
    words: [
      { word: '동물', direction: 'h', row: 0, col: 0 },
      { word: '동화', direction: 'v', row: 0, col: 0 },
      { word: '물건', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['동', '물', '화', '건'],
  },

  // ─── Medium: 4 words, 5×5 ─────────────────────────────
  {
    id: 11, gridRows: 5, gridCols: 5,
    words: [
      { word: '음악', direction: 'h', row: 0, col: 0 },
      { word: '음식', direction: 'v', row: 0, col: 0 },
      { word: '악기', direction: 'v', row: 0, col: 1 },
      { word: '기차', direction: 'h', row: 1, col: 1 },
    ],
    letters: ['음', '악', '식', '기', '차'],
  },
  {
    id: 12, gridRows: 5, gridCols: 5,
    words: [
      { word: '영화', direction: 'h', row: 0, col: 0 },
      { word: '영어', direction: 'v', row: 0, col: 0 },
      { word: '화가', direction: 'v', row: 0, col: 1 },
      { word: '가방', direction: 'h', row: 1, col: 1 },
    ],
    letters: ['영', '화', '어', '가', '방'],
  },
  {
    id: 13, gridRows: 5, gridCols: 5,
    words: [
      { word: '여행', direction: 'h', row: 0, col: 0 },
      { word: '여우', direction: 'v', row: 0, col: 0 },
      { word: '행복', direction: 'v', row: 0, col: 1 },
      { word: '복도', direction: 'h', row: 1, col: 1 },
    ],
    letters: ['여', '행', '우', '복', '도'],
  },
  {
    id: 14, gridRows: 5, gridCols: 5,
    words: [
      { word: '도시', direction: 'h', row: 0, col: 0 },
      { word: '도로', direction: 'v', row: 0, col: 0 },
      { word: '시장', direction: 'v', row: 0, col: 1 },
      { word: '장미', direction: 'h', row: 1, col: 1 },
    ],
    letters: ['도', '시', '로', '장', '미'],
  },
  {
    id: 15, gridRows: 5, gridCols: 5,
    words: [
      { word: '사진', direction: 'h', row: 0, col: 0 },
      { word: '사자', direction: 'v', row: 0, col: 0 },
      { word: '진실', direction: 'v', row: 0, col: 1 },
      { word: '실수', direction: 'h', row: 1, col: 1 },
    ],
    letters: ['사', '진', '자', '실', '수'],
  },
  {
    id: 16, gridRows: 5, gridCols: 5,
    words: [
      { word: '시간', direction: 'h', row: 0, col: 0 },
      { word: '시험', direction: 'v', row: 0, col: 0 },
      { word: '간식', direction: 'v', row: 0, col: 1 },
      { word: '식당', direction: 'h', row: 1, col: 1 },
    ],
    letters: ['시', '간', '험', '식', '당'],
  },
  {
    id: 17, gridRows: 5, gridCols: 5,
    words: [
      { word: '공원', direction: 'h', row: 0, col: 0 },
      { word: '공부', direction: 'v', row: 0, col: 0 },
      { word: '원인', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['공', '원', '부', '인'],
  },
  {
    id: 18, gridRows: 5, gridCols: 5,
    words: [
      { word: '주문', direction: 'h', row: 0, col: 0 },
      { word: '주차', direction: 'v', row: 0, col: 0 },
      { word: '문제', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['주', '문', '차', '제'],
  },
  {
    id: 19, gridRows: 5, gridCols: 5,
    words: [
      { word: '안경', direction: 'h', row: 0, col: 0 },
      { word: '안전', direction: 'v', row: 0, col: 0 },
      { word: '경기', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['안', '경', '전', '기'],
  },
  {
    id: 20, gridRows: 5, gridCols: 5,
    words: [
      { word: '감사', direction: 'h', row: 0, col: 0 },
      { word: '감동', direction: 'v', row: 0, col: 0 },
      { word: '사고', direction: 'v', row: 0, col: 1 },
    ],
    letters: ['감', '사', '동', '고'],
  },

  // ─── Hard: 5 words, staircase, 6×6 ────────────────────
  {
    id: 21, gridRows: 6, gridCols: 6,
    words: [
      { word: '사과', direction: 'h', row: 0, col: 0 },
      { word: '사람', direction: 'v', row: 0, col: 0 },
      { word: '과일', direction: 'v', row: 0, col: 1 },
      { word: '일기', direction: 'h', row: 1, col: 1 },
      { word: '기타', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['사', '과', '람', '일', '기', '타'],
  },
  {
    id: 22, gridRows: 6, gridCols: 6,
    words: [
      { word: '음악', direction: 'h', row: 0, col: 0 },
      { word: '음식', direction: 'v', row: 0, col: 0 },
      { word: '악기', direction: 'v', row: 0, col: 1 },
      { word: '기차', direction: 'h', row: 1, col: 1 },
      { word: '차별', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['음', '악', '식', '기', '차', '별'],
  },
  {
    id: 23, gridRows: 6, gridCols: 6,
    words: [
      { word: '영화', direction: 'h', row: 0, col: 0 },
      { word: '영어', direction: 'v', row: 0, col: 0 },
      { word: '화가', direction: 'v', row: 0, col: 1 },
      { word: '가방', direction: 'h', row: 1, col: 1 },
      { word: '방학', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['영', '화', '어', '가', '방', '학'],
  },
  {
    id: 24, gridRows: 6, gridCols: 6,
    words: [
      { word: '도시', direction: 'h', row: 0, col: 0 },
      { word: '도로', direction: 'v', row: 0, col: 0 },
      { word: '시장', direction: 'v', row: 0, col: 1 },
      { word: '장미', direction: 'h', row: 1, col: 1 },
      { word: '미래', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['도', '시', '로', '장', '미', '래'],
  },
  {
    id: 25, gridRows: 6, gridCols: 6,
    words: [
      { word: '여행', direction: 'h', row: 0, col: 0 },
      { word: '여우', direction: 'v', row: 0, col: 0 },
      { word: '행복', direction: 'v', row: 0, col: 1 },
      { word: '복도', direction: 'h', row: 1, col: 1 },
      { word: '도전', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['여', '행', '우', '복', '도', '전'],
  },
  {
    id: 26, gridRows: 6, gridCols: 6,
    words: [
      { word: '사진', direction: 'h', row: 0, col: 0 },
      { word: '사자', direction: 'v', row: 0, col: 0 },
      { word: '진실', direction: 'v', row: 0, col: 1 },
      { word: '실수', direction: 'h', row: 1, col: 1 },
      { word: '수학', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['사', '진', '자', '실', '수', '학'],
  },
  {
    id: 27, gridRows: 6, gridCols: 6,
    words: [
      { word: '건강', direction: 'h', row: 0, col: 0 },
      { word: '건물', direction: 'v', row: 0, col: 0 },
      { word: '강물', direction: 'v', row: 0, col: 1 },
      { word: '물감', direction: 'h', row: 1, col: 1 },
      { word: '감자', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['건', '강', '물', '감', '자'],
  },
  {
    id: 28, gridRows: 6, gridCols: 6,
    words: [
      { word: '시간', direction: 'h', row: 0, col: 0 },
      { word: '시험', direction: 'v', row: 0, col: 0 },
      { word: '간식', direction: 'v', row: 0, col: 1 },
      { word: '식당', direction: 'h', row: 1, col: 1 },
      { word: '당근', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['시', '간', '험', '식', '당', '근'],
  },
  {
    id: 29, gridRows: 6, gridCols: 6,
    words: [
      { word: '공원', direction: 'h', row: 0, col: 0 },
      { word: '공부', direction: 'v', row: 0, col: 0 },
      { word: '원인', direction: 'v', row: 0, col: 1 },
      { word: '인기', direction: 'h', row: 1, col: 1 },
      { word: '기차', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['공', '원', '부', '인', '기', '차'],
  },
  {
    id: 30, gridRows: 6, gridCols: 6,
    words: [
      { word: '학교', direction: 'h', row: 0, col: 0 },
      { word: '학생', direction: 'v', row: 0, col: 0 },
      { word: '교실', direction: 'v', row: 0, col: 1 },
      { word: '실내', direction: 'h', row: 1, col: 1 },
      { word: '내용', direction: 'v', row: 1, col: 2 },
    ],
    letters: ['학', '교', '생', '실', '내', '용'],
  },
];

export function getPuzzle(puzzleId: number): PuzzleData {
  const puzzle = PUZZLES.find((p) => p.id === puzzleId);
  if (!puzzle) {
    // Cycle back for IDs beyond 30
    const cycled = ((puzzleId - 1) % PUZZLES.length) + 1;
    return { ...PUZZLES[cycled - 1], id: puzzleId };
  }
  return puzzle;
}

export function getTotalPuzzles(): number {
  return PUZZLES.length;
}
