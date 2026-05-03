const DEFAULT_TIMEOUT_MS = 1_500;

export class LogEventError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'LogEventError';
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

export interface LogEventInput {
  userId: string;
  event: string;
  /** JSON 직렬화 가능한 평면 객체. PII 넣지 말 것. */
  payload?: Record<string, unknown>;
  /** 클라 epoch ms. 생략 시 서버가 자체 시각만 기록. */
  timestamp?: number;
  timeoutMs?: number;
  baseUrl?: string;
}

/**
 * 분석 이벤트 1건을 서버로 전송. **fire-and-forget**:
 * 모든 실패(타임아웃·네트워크·서버 에러)는 내부에서 swallow되고,
 * 호출자 입장에서는 항상 정상 resolve. await 해도 throw하지 않음.
 *
 * 따라서 UI 흐름이 절대 막히지 않음 — analytics는 best-effort.
 */
export async function logEvent(input: LogEventInput): Promise<void> {
  const base = input.baseUrl ?? getApiBase();
  if (!base) {
    if (__DEV__) console.warn('[logEvent] EXPO_PUBLIC_API_BASE not set, skipping');
    return;
  }
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}/v1/jf/event`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: input.userId,
        event: input.event,
        payload: input.payload ?? {},
        timestamp: input.timestamp,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let body: ApiError | null = null;
      try {
        body = (await res.json()) as ApiError;
      } catch {
        // ignore body parse failure
      }
      if (__DEV__) {
        console.warn(
          `[logEvent] server rejected ${res.status}`,
          body?.code ?? 'unknown',
          body?.message ?? '',
        );
      }
    }
  } catch (err) {
    if (__DEV__) {
      const name = (err as Error)?.name;
      const msg = (err as Error)?.message;
      console.warn(`[logEvent] failed (${name}):`, msg);
    }
  } finally {
    clearTimeout(timer);
  }
}

declare const __DEV__: boolean;
