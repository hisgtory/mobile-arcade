import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@jf_user_id';
const ID_SIZE = 21;
const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

let cached: string | null = null;

function generate(): string {
  let id = '';
  for (let i = 0; i < ID_SIZE; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return id;
}

/**
 * 앱 설치 시 한 번 생성되어 영구 보존되는 익명 식별자.
 * 충돌 가능성 무시할 수준(64^21)이고 외부 서버에 노출되어도 PII 아님.
 */
export async function getUserId(): Promise<string> {
  if (cached) return cached;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && stored.length > 0) {
      cached = stored;
      return stored;
    }
  } catch {
    // ignore — fall through to generate
  }
  const fresh = generate();
  cached = fresh;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, fresh);
  } catch {
    // 메모리에는 캐시됐으니 다음 부팅 때 새로 만들어도 OK
  }
  return fresh;
}
