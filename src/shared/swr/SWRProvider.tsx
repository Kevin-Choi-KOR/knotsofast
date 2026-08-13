'use client'

import { SWRConfig, type Cache, type State } from 'swr'
import type { ReactNode } from 'react'
import { SWR_CACHE_STORAGE_KEY } from '@/shared/constants'
import { registerSWRCache } from './cache'

// localStorage 기반 영속 캐시 — 새로고침 시 직전 스냅샷을 즉시 보여줘 화면이 빈 값으로 깜빡이는 것을 막는다.
function localStorageProvider(): Cache {
  const initial: [string, State][] =
    typeof window !== 'undefined'
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem(SWR_CACHE_STORAGE_KEY) ?? '[]')
          } catch {
            return []
          }
        })()
      : []

  const map = new Map<string, State>(initial)
  registerSWRCache(map as unknown as Cache)

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      localStorage.setItem(SWR_CACHE_STORAGE_KEY, JSON.stringify(Array.from(map.entries())))
    })
  }

  return map as unknown as Cache
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: localStorageProvider }}>{children}</SWRConfig>
}
