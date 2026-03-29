// ─── Constants ───────────────────────────────────────────
export const DEFAULT_WIDTH = 390;
export const DEFAULT_HEIGHT = 560;

// ─── Colors ──────────────────────────────────────────────
export const COLOR_GREEN = '#22C55E';
export const COLOR_RED = '#EF4444';
export const COLOR_BLUE = '#3B82F6';
export const COLOR_YELLOW = '#EAB308';
export const COLOR_GRAY = '#9CA3AF';

// ─── Puzzle Types ────────────────────────────────────────
export type PuzzleType =
  | 'tap_hidden'
  | 'drag'
  | 'text_trick'
  | 'count'
  | 'sequence'
  | 'fake_ui'
  | 'wait';

export type PuzzleAnswer =
  | { type: 'tap_target'; targetId: string }
  | { type: 'wait'; duration: number }
  | { type: 'input'; value: string }
  | { type: 'tap_count'; count: number }
  | { type: 'drag'; targetId: string };

export interface PuzzleElement {
  id: string;
  type: 'text' | 'shape' | 'button' | 'image_text';
  x: number;
  y: number;
  props: Record<string, unknown>;
}

export interface PuzzleConfig {
  stage: number;
  question: string;
  puzzleType: PuzzleType;
  hintText?: string;
  timeLimit: number;
  answer: PuzzleAnswer;
  explanation: string;
  elements: PuzzleElement[];
}

export interface StageConfig {
  stage: number;
  puzzle: PuzzleConfig;
}

export interface GameConfig {
  stage?: number;
}

// ─── Stage Definitions ───────────────────────────────────

const STAGES: PuzzleConfig[] = [
  // Stage 1: "가장 큰 숫자를 터치하세요"
  {
    stage: 1,
    question: '가장 큰 숫자를 터치하세요',
    puzzleType: 'tap_hidden',
    hintText: '숫자가 아닌 다른 것도 살펴보세요',
    timeLimit: 30,
    answer: { type: 'tap_target', targetId: 'question_text' },
    explanation: "'숫자'가 아니라 가장 큰 '글자'를 찾는 거였어요!",
    elements: [
      { id: 'num_1', type: 'text', x: 0.2, y: 0.4, props: { value: '1', fontSize: 36 } },
      { id: 'num_22', type: 'text', x: 0.5, y: 0.35, props: { value: '22', fontSize: 48 } },
      { id: 'num_7', type: 'text', x: 0.8, y: 0.45, props: { value: '7', fontSize: 32 } },
      { id: 'num_15', type: 'text', x: 0.35, y: 0.55, props: { value: '15', fontSize: 40 } },
      { id: 'num_3', type: 'text', x: 0.65, y: 0.6, props: { value: '3', fontSize: 28 } },
    ],
  },
  // Stage 2: "사과는 몇 개일까요?"
  {
    stage: 2,
    question: '사과는 몇 개일까요?',
    puzzleType: 'count',
    hintText: '모든 과일이 사과일까요?',
    timeLimit: 30,
    answer: { type: 'tap_target', targetId: 'btn_4' },
    explanation: '토마토는 사과가 아니에요! 🍅',
    elements: [
      { id: 'fruit_1', type: 'image_text', x: 0.2, y: 0.35, props: { emoji: '🍎' } },
      { id: 'fruit_2', type: 'image_text', x: 0.4, y: 0.32, props: { emoji: '🍎' } },
      { id: 'fruit_3', type: 'image_text', x: 0.6, y: 0.36, props: { emoji: '🍅' } },
      { id: 'fruit_4', type: 'image_text', x: 0.8, y: 0.33, props: { emoji: '🍎' } },
      { id: 'fruit_5', type: 'image_text', x: 0.5, y: 0.45, props: { emoji: '🍎' } },
    ],
  },
  // Stage 3: "아래 화살표를 눌러주세요"
  {
    stage: 3,
    question: '아래 화살표를 눌러주세요',
    puzzleType: 'tap_hidden',
    hintText: '문제를 다시 읽어보세요',
    timeLimit: 30,
    answer: { type: 'tap_target', targetId: 'word_아래' },
    explanation: "화살표가 아니라 '아래'라는 글자를 누르는 거였어요!",
    elements: [
      { id: 'arrow_up', type: 'image_text', x: 0.5, y: 0.35, props: { emoji: '⬆️' } },
      { id: 'arrow_down', type: 'image_text', x: 0.5, y: 0.55, props: { emoji: '⬇️' } },
      { id: 'arrow_left', type: 'image_text', x: 0.3, y: 0.45, props: { emoji: '⬅️' } },
      { id: 'arrow_right', type: 'image_text', x: 0.7, y: 0.45, props: { emoji: '➡️' } },
    ],
  },
  // Stage 4: "이 중 가장 작은 것은?"
  {
    stage: 4,
    question: '이 중 가장 작은 것은?',
    puzzleType: 'tap_hidden',
    hintText: '화면에 있는 것 말고도...',
    timeLimit: 30,
    answer: { type: 'tap_target', targetId: 'question_작은' },
    explanation: "화면의 도형이 아니라 '작은'이라는 글자가 가장 작았어요!",
    elements: [
      { id: 'circle_big', type: 'shape', x: 0.25, y: 0.4, props: { shape: 'circle', radius: 50, color: '#3B82F6' } },
      { id: 'circle_med', type: 'shape', x: 0.55, y: 0.45, props: { shape: 'circle', radius: 35, color: '#22C55E' } },
      { id: 'circle_small', type: 'shape', x: 0.78, y: 0.42, props: { shape: 'circle', radius: 20, color: '#EAB308' } },
    ],
  },
  // Stage 5: "삼각형은 몇 개일까요?"
  {
    stage: 5,
    question: '삼각형은 몇 개일까요?',
    puzzleType: 'count',
    hintText: '겹쳐진 것도 세어보세요',
    timeLimit: 30,
    answer: { type: 'tap_target', targetId: 'btn_7' },
    explanation: '겹쳐진 삼각형도 세어야 해요! △△△',
    elements: [
      { id: 'tri_1', type: 'shape', x: 0.3, y: 0.35, props: { shape: 'triangle', size: 60, color: '#3B82F6' } },
      { id: 'tri_2', type: 'shape', x: 0.5, y: 0.32, props: { shape: 'triangle', size: 70, color: '#22C55E' } },
      { id: 'tri_3', type: 'shape', x: 0.7, y: 0.36, props: { shape: 'triangle', size: 55, color: '#EAB308' } },
      { id: 'tri_4', type: 'shape', x: 0.4, y: 0.48, props: { shape: 'triangle', size: 50, color: '#EF4444' } },
      { id: 'tri_5', type: 'shape', x: 0.6, y: 0.46, props: { shape: 'triangle', size: 45, color: '#A855F7' } },
      { id: 'tri_6', type: 'shape', x: 0.35, y: 0.42, props: { shape: 'triangle', size: 35, color: '#F97316' } },
      { id: 'tri_7', type: 'shape', x: 0.65, y: 0.4, props: { shape: 'triangle', size: 30, color: '#06B6D4' } },
    ],
  },
  // Stage 6: "빨간 버튼을 누르세요"
  {
    stage: 6,
    question: '빨간 버튼을 누르세요',
    puzzleType: 'fake_ui',
    hintText: '색깔을 잘 보세요',
    timeLimit: 30,
    answer: { type: 'tap_target', targetId: 'real_red_btn' },
    explanation: "'빨간'이라고 쓰인 버튼이 아니라 빨간색 버튼이었어요!",
    elements: [
      { id: 'fake_red_btn', type: 'button', x: 0.3, y: 0.45, props: { label: '빨간', bgColor: '#22C55E' } },
      { id: 'real_red_btn', type: 'button', x: 0.8, y: 0.6, props: { label: '', bgColor: '#EF4444' } },
    ],
  },
  // Stage 7: "숫자를 작은 순서대로 누르세요: 10 1 8"
  {
    stage: 7,
    question: '숫자를 작은 순서대로 누르세요: 10 1 8',
    puzzleType: 'sequence',
    hintText: '숫자의 크기? 글자의 크기?',
    timeLimit: 30,
    answer: { type: 'tap_target', targetId: 'seq_correct' },
    explanation: '글자 크기가 아니라 숫자 크기 순서였어요!',
    elements: [
      { id: 'num_10', type: 'text', x: 0.25, y: 0.42, props: { value: '10', fontSize: 20 } },
      { id: 'num_1', type: 'text', x: 0.5, y: 0.38, props: { value: '1', fontSize: 52 } },
      { id: 'num_8', type: 'text', x: 0.75, y: 0.44, props: { value: '8', fontSize: 36 } },
    ],
  },
  // Stage 8: "문제를 풀지 마세요"
  {
    stage: 8,
    question: '문제를 풀지 마세요',
    puzzleType: 'wait',
    hintText: '문제를 잘 읽어보세요',
    timeLimit: 30,
    answer: { type: 'wait', duration: 5000 },
    explanation: '풀지 말라고 했잖아요! 가만히 있으면 되는 거였어요 😎',
    elements: [
      { id: 'trap_A', type: 'button', x: 0.2, y: 0.5, props: { label: 'A' } },
      { id: 'trap_B', type: 'button', x: 0.4, y: 0.5, props: { label: 'B' } },
      { id: 'trap_C', type: 'button', x: 0.6, y: 0.5, props: { label: 'C' } },
      { id: 'trap_D', type: 'button', x: 0.8, y: 0.5, props: { label: 'D' } },
    ],
  },
  // Stage 9: "화면에서 고양이를 찾으세요"
  {
    stage: 9,
    question: '화면에서 고양이를 찾으세요',
    puzzleType: 'tap_hidden',
    hintText: '화면 전체를 잘 살펴보세요',
    timeLimit: 30,
    answer: { type: 'tap_target', targetId: 'hidden_cat' },
    explanation: '고양이는 문제 속에 숨어있었어요! 🐱',
    elements: [
      { id: 'dog', type: 'image_text', x: 0.2, y: 0.35, props: { emoji: '🐶' } },
      { id: 'rabbit', type: 'image_text', x: 0.5, y: 0.4, props: { emoji: '🐰' } },
      { id: 'bird', type: 'image_text', x: 0.8, y: 0.35, props: { emoji: '🐦' } },
      { id: 'frog', type: 'image_text', x: 0.35, y: 0.55, props: { emoji: '🐸' } },
      { id: 'fish', type: 'image_text', x: 0.65, y: 0.5, props: { emoji: '🐟' } },
    ],
  },
  // Stage 10: "전구를 켜세요"
  {
    stage: 10,
    question: '전구를 켜세요',
    puzzleType: 'tap_hidden',
    hintText: '어두운 곳을 밝히려면...',
    timeLimit: 30,
    answer: { type: 'tap_target', targetId: 'dark_bg' },
    explanation: '스위치가 아니라 어두운 화면을 터치하면 밝아져요! 💡',
    elements: [
      { id: 'dark_bg', type: 'shape', x: 0, y: 0, props: { shape: 'rect', fill: '#1F2937', alpha: 0.85 } },
      { id: 'bulb', type: 'image_text', x: 0.5, y: 0.4, props: { emoji: '💡' } },
      { id: 'switch', type: 'button', x: 0.5, y: 0.6, props: { label: 'ON' } },
    ],
  },
];

export function getStageConfig(stage: number): StageConfig {
  const index = ((stage - 1) % STAGES.length);
  const puzzle = STAGES[index];
  return {
    stage,
    puzzle: { ...puzzle, stage },
  };
}
