import { TileData } from '../types';

const DEFAULT_TIMEOUT_MS = 2_500;

interface ApiTile {
  id: string;
  objectId: number;
  col: number;
  row: number;
  layer: number;
}

interface ApiError {
  code: string;
  message: string;
}

export class StageTilesError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'StageTilesError';
  }
}

function getApiBase(): string | null {
  // Expo: EXPO_PUBLIC_API_BASE 환경변수
  const fromEnv =
    typeof process !== 'undefined' && process.env
      ? process.env.EXPO_PUBLIC_API_BASE
      : undefined;
  return fromEnv && fromEnv.length > 0 ? fromEnv.replace(/\/$/, '') : null;
}

/**
 * arcade-api로부터 미리 검증된 보드를 가져온다.
 * - 네트워크 / 타임아웃 / 5xx → throw StageTilesError (호출자가 폴백 처리)
 * - 4xx (잘못된 입력) → throw StageTilesError (코드로 분기 가능)
 *
 * `objects`는 보드에 사용할 객체 종류 수. 응답의 objectId(0..objects-1)는
 * 클라가 직접 fruit asset에 매핑한다.
 */
export async function getStageTiles(
  stage: number,
  objects: number,
  opts: { timeoutMs?: number; baseUrl?: string } = {},
): Promise<TileData[]> {
  const base = opts.baseUrl ?? getApiBase();
  if (!base) {
    throw new StageTilesError('no_api_base', 'EXPO_PUBLIC_API_BASE not set');
  }
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}/v1/jf/stage/tiles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stage, objects }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let body: ApiError | null = null;
      try {
        body = (await res.json()) as ApiError;
      } catch {
        // body 파싱 실패는 무시
      }
      throw new StageTilesError(
        body?.code ?? `http_${res.status}`,
        body?.message ?? `HTTP ${res.status}`,
      );
    }

    const data = (await res.json()) as ApiTile[];
    return data.map(adaptTile);
  } catch (err) {
    if (err instanceof StageTilesError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new StageTilesError('timeout', `request exceeded ${timeoutMs}ms`);
    }
    throw new StageTilesError('network', (err as Error)?.message ?? 'fetch failed');
  } finally {
    clearTimeout(timer);
  }
}

function adaptTile(t: ApiTile): TileData {
  return {
    id: t.id,
    type: t.objectId,
    col: t.col,
    row: t.row,
    layer: t.layer,
  };
}
