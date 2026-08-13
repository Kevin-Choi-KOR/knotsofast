'use client'

import { useEffect, useState } from 'react'

// 4제곱 ease-out — 초반에 빠르게 오르고 끝에서 부드럽게 멈춘다.
export function useCountUp(target: number, durationMs = 1800): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(target * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
