import { TileData } from '../types';

const DEFAULT_TIMEOUT_MS = 2_500;

export interface ClearRanking {
  topPercent: number;
  clearOrdinal: number;
  totalClears: number;
  variantAccepted: boolean;
}

export class ReportClearError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ReportClearError';
  }
}

interface ApiTileSubmission {
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

function getApiBase(): string | null {
  const fromEnv =
    typeof process !== 'undefined' && process.env
      ? process.env.EXPO_PUBLIC_API_BASE
      : undefined;
  return fromEnv && fromEnv.length > 0 ? fromEnv.replace(/\/$/, '') : null;
}

export interface ReportClearOptions {
  stage: number;
  durationSec: number;
  userId: string;
  /** 클라가 자체 생성한 tiles. 서버에 풀이 비어있으면 솔버 검증 후 변형으로 저장. */
  tiles?: TileData[];
  /** tiles와 함께 명시 가능. 없으면 서버가 추론. */
  objects?: number;
  timeoutMs?: number;
  baseUrl?: string;
}

export async function reportClear(opts: ReportClearOptions): Promise<ClearRanking> {
  const base = opts.baseUrl ?? getApiBase();
  if (!base) {
    throw new ReportClearError('no_api_base', 'EXPO_PUBLIC_API_BASE not set');
  }
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const submittedTiles: ApiTileSubmission[] | undefined = opts.tiles?.map((t) => ({
    id: t.id,
    objectId: t.type,
    col: t.col,
    row: t.row,
    layer: t.layer,
  }));

  try {
    const res = await fetch(`${base}/v1/jf/stage/clear`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        stage: opts.stage,
        durationSec: opts.durationSec,
        userId: opts.userId,
        tiles: submittedTiles,
        objects: opts.objects,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let body: ApiError | null = null;
      try {
        body = (await res.json()) as ApiError;
      } catch {
        // ignore
      }
      throw new ReportClearError(
        body?.code ?? `http_${res.status}`,
        body?.message ?? `HTTP ${res.status}`,
      );
    }

    return (await res.json()) as ClearRanking;
  } catch (err) {
    if (err instanceof ReportClearError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new ReportClearError('timeout', `request exceeded ${timeoutMs}ms`);
    }
    throw new ReportClearError('network', (err as Error)?.message ?? 'fetch failed');
  } finally {
    clearTimeout(timer);
  }
}
