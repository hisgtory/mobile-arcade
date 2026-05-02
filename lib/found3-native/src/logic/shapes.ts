export type BoardShape = 'rect' | 'heart' | 'diamond' | 'circle' | 'cross';

/**
 * 특정 좌표(col, row)가 주어진 모양 안에 포함되는지 판별합니다.
 * 범위는 0.0 ~ 1.0 사이의 비율로 계산하여 유연하게 대응합니다.
 */
export function isInsideShape(shape: BoardShape, c: number, r: number, totalCols: number, totalRows: number): boolean {
  // 중심점 및 정규화된 좌표 (0.0 ~ 1.0)
  const x = c / (totalCols - 1 || 1);
  const y = r / (totalRows - 1 || 1);
  const dx = x - 0.5;
  const dy = y - 0.5;

  switch (shape) {
    case 'heart': {
      // 하트 공식: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
      // 화면 좌표계에 맞게 보정
      const hx = dx * 2.2;
      const hy = -dy * 2.2 + 0.2;
      return Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * Math.pow(hy, 3) <= 0;
    }
    case 'diamond': {
      // 마름모: |dx| + |dy| <= 0.5
      return Math.abs(dx) + Math.abs(dy) <= 0.5;
    }
    case 'circle': {
      // 원형: dx^2 + dy^2 <= r^2
      return dx * dx + dy * dy <= 0.25;
    }
    case 'cross': {
      // 십자가
      return Math.abs(dx) <= 0.15 || Math.abs(dy) <= 0.15;
    }
    case 'rect':
    default:
      return true;
  }
}
