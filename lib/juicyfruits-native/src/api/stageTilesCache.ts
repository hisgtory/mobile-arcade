import AsyncStorage from '@react-native-async-storage/async-storage';
import { TileData } from '../types';
import { getStageTiles } from './getStageTiles';

/**
 * 스테이지 타일 캐시 — 메모리 + AsyncStorage 2단 레이어.
 *
 * 흐름:
 *   1) 메모리 캐시 hit → 즉시 반환
 *   2) AsyncStorage hit → 메모리에 올리고 반환
 *   3) miss → 서버 호출 후 양쪽 모두 캐시
 *
 * 동시 요청 dedupe: 같은 키의 프로미스가 진행 중이면 그것을 공유.
 */

const VERSION = 'v1';
const KEY_PREFIX = `@juicyfruits_stage_tiles_${VERSION}_`;

const memoryCache = new Map<string, TileData[]>();
const inFlight = new Map<string, Promise<TileData[]>>();

const cacheKey = (stage: number, objects: number) =>
  `${KEY_PREFIX}${stage}_${objects}`;

export async function getStageTilesCached(
  stage: number,
  objects: number,
): Promise<TileData[]> {
  const key = cacheKey(stage, objects);

  const mem = memoryCache.get(key);
  if (mem) return mem;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const fetcher = (async () => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as TileData[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {
      // 캐시 read 실패는 무시 — 네트워크 폴백
    }

    const tiles = await getStageTiles(stage, objects);
    memoryCache.set(key, tiles);
    AsyncStorage.setItem(key, JSON.stringify(tiles)).catch(() => {});
    return tiles;
  })();

  inFlight.set(key, fetcher);
  try {
    return await fetcher;
  } finally {
    inFlight.delete(key);
  }
}

/**
 * 백그라운드 프리페치 — fire-and-forget.
 * 에러는 조용히 무시 (다음 실제 호출에서 다시 시도됨).
 */
export function prefetchStageTiles(stage: number, objects: number): void {
  getStageTilesCached(stage, objects).catch(() => {});
}
