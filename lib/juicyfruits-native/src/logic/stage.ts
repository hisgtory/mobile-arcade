import { StageConfig } from '../types';

const SHAPES: ('rect' | 'heart' | 'diamond' | 'circle' | 'cross')[] = ['circle', 'diamond', 'heart', 'cross', 'rect'];

export function getStageConfig(stage: number): StageConfig {
  // 1. 과일 종류 (typeCount)
  // 1~5단계: 2, 3, 4, 5, 6개
  // 6~10단계: 6개 유지
  // 이후 10단계마다 1개씩 추가 (최대 14개)
  let typeCount = 0;
  if (stage <= 5) {
    typeCount = stage + 1;
  } else if (stage <= 10) {
    typeCount = 6;
  } else {
    typeCount = Math.min(14, 6 + Math.floor((stage - 1) / 10));
  }

  // 2. 타일 커플 배수 (한 종류당 몇 세트가 나올지)
  // 레벨이 높아질수록 같은 과일 3개 묶음이 더 많이 생성됨
  const setMultiplier = 1 + Math.floor(stage / 10); // 10단계마다 세트 배수 증가
  const tileCount = typeCount * 3 * setMultiplier;

  // 3. 레이어 (layers)
  // 5단계마다 하나씩 깊어짐 (최대 6층)
  const layers = Math.min(6, 1 + Math.floor(stage / 5));

  // 4. 그리드 크기 (cols, rows)
  // 타일 개수에 맞춰서 자동으로 영역 확장
  const side = Math.ceil(Math.sqrt(tileCount / layers)) + 2;
  const cols = Math.min(10, side);
  const rows = Math.min(12, side + 1);

  // 5. 모양 (shape)
  // 5가지 모양을 순차적으로 로테이션
  const shape = SHAPES[(stage - 1) % SHAPES.length];

  // 6. 제한 시간
  // 기본 120초 + 스테이지당 10초 추가
  const timeLimit = 120 + (stage * 10);

  return {
    stage,
    typeCount,
    tileCount,
    layers,
    timeLimit,
    cols,
    rows,
    shape
  };
}

export function getMaxStage(): number {
  return 999; // 무한 스테이지 지원
}
