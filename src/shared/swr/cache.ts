import type { Cache } from 'swr'

// SWRProvider가 생성한 캐시 인스턴스를 등록해 두면, 컴포넌트 트리 밖(AuthContext.logout 등)에서도
// 인메모리 캐시를 비울 수 있다.
let activeCache: Cache | undefined

export function registerSWRCache(cache: Cache) {
  activeCache = cache
}

export function clearSWRCache() {
  if (!activeCache) return
  for (const key of activeCache.keys()) {
    activeCache.delete(key)
  }
}
