import { StageConfig } from '../types';

const SHAPES: ('rect' | 'heart' | 'diamond' | 'circle' | 'cross')[] = ['circle', 'diamond', 'heart', 'cross', 'rect'];

export function getStageConfig(stage: number): StageConfig {
  // 1. 과일 종류 (typeCount)
  let typeCount = 0;
  if (stage <= 5) {
    typeCount = stage + 1;
  } else if (stage <= 10) {
    typeCount = 6;
  } else {
    typeCount = Math.min(14, 6 + Math.floor((stage - 1) / 10));
  }

  // 2. 타일 세트 배수
  const setMultiplier = 1 + Math.floor(stage / 10); 
  const tileCount = typeCount * 3 * setMultiplier;

  // 3. 레이어 (layers)
  // 그리드가 고정되므로 타일이 많아지면 레이어를 아주 높게 쌓습니다. (최대 15층)
  const layers = Math.min(15, 1 + Math.floor(stage / 3));

  // 4. 그리드 크기 고정 (타일 크기 일정하게 유지)
  // 가로 6, 세로 8로 고정하면 모든 스테이지에서 타일 크기가 동일하게 유지됩니다.
  const cols = 6;
  const rows = 8;

  // 5. 모양 (shape)
  const shape = SHAPES[(stage - 1) % SHAPES.length];

  // 6. 제한 시간
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
  return 999;
}
