const DEFAULT_TIMEOUT_MS = 2_500;

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  highestStage: number;
}

export interface UserPosition {
  highestStage: number;
  rank: number;
  topPercent: number;
  totalClears: number;
}

export interface Leaderboard {
  totalUsers: number;
  top: LeaderboardEntry[];
  user: UserPosition | null;
}

export class LeaderboardError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'LeaderboardError';
  }
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

export interface GetLeaderboardOptions {
  /** 본인의 위치도 같이 받고 싶을 때 전달. */
  userId?: string;
  /** 상단 노출할 top N. 기본 10, 최대 50. */
  limit?: number;
  timeoutMs?: number;
  baseUrl?: string;
}

export async function getLeaderboard(
  opts: GetLeaderboardOptions = {},
): Promise<Leaderboard> {
  const base = opts.baseUrl ?? getApiBase();
  if (!base) {
    throw new LeaderboardError('no_api_base', 'EXPO_PUBLIC_API_BASE not set');
  }
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const params = new URLSearchParams();
  if (opts.userId) params.set('userId', opts.userId);
  if (opts.limit != null) params.set('limit', String(opts.limit));
  const qs = params.toString();
  const url = `${base}/v1/jf/leaderboard${qs ? `?${qs}` : ''}`;

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      let body: ApiError | null = null;
      try {
        body = (await res.json()) as ApiError;
      } catch {
        // ignore
      }
      throw new LeaderboardError(
        body?.code ?? `http_${res.status}`,
        body?.message ?? `HTTP ${res.status}`,
      );
    }
    return (await res.json()) as Leaderboard;
  } catch (err) {
    if (err instanceof LeaderboardError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new LeaderboardError('timeout', `request exceeded ${timeoutMs}ms`);
    }
    throw new LeaderboardError(
      'network',
      (err as Error)?.message ?? 'fetch failed',
    );
  } finally {
    clearTimeout(timer);
  }
}
