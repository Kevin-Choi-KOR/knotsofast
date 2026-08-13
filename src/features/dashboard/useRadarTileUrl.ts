'use client'

import { useEffect, useState } from 'react'

interface RainViewerResponse {
  radar?: { past?: { path?: string }[] }
}

// DASHBOARD.md 11.3장 — RainViewer 강수 레이더. 실패는 조용히 무시한다(에러 상태 없음).
export function useRadarTileUrl(): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json')
        if (!res.ok) return
        const data = (await res.json()) as RainViewerResponse
        const past = data.radar?.past
        const last = past && past.length > 0 ? past[past.length - 1] : undefined
        if (!last?.path || cancelled) return
        setUrl(`https://tilecache.rainviewer.com${last.path}/256/{z}/{x}/{y}/6/1_1.png`)
      } catch {
        // 조용히 무시 — 레이더 레이어가 그냥 안 뜬다.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return url
}
