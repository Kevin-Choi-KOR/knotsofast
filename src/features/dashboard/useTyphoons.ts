'use client'

import { useEffect, useState } from 'react'
import type { TyphoonWarning } from '@/mocks/map-overlays'

const POLL_INTERVAL_MS = 15 * 60 * 1000
const TIMEOUT_MS = 12000

// DASHBOARD.md 11.2장 — GDACS 실시간 데이터만 표시하고, 실패하면 빈 배열로 폴백한다.
// 목업을 병합하지 않는다 — 태풍이 하나도 없으면 마커가 안 보이는 것이 정상이다.
export function useTyphoons(): TyphoonWarning[] {
  const [typhoons, setTyphoons] = useState<TyphoonWarning[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch('/api/typhoons', { signal: AbortSignal.timeout(TIMEOUT_MS) })
        if (!res.ok) throw new Error(`GDACS proxy responded ${res.status}`)
        const data = (await res.json()) as TyphoonWarning[]
        if (!cancelled) setTyphoons(data)
      } catch {
        if (!cancelled) setTyphoons([])
      }
    }

    void load()
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return typhoons
}
