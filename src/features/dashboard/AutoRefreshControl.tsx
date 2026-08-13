'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

const STORAGE_KEY = 'ksf-dashboard-refresh-interval'

const OPTIONS = [
  { value: 0, label: '새로고침 안함' },
  { value: 10, label: '10분' },
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
]

// DASHBOARD.md 4.1장 — 페이지 헤더 자동 새로고침 컨트롤.
export function AutoRefreshControl() {
  const router = useRouter()
  const [intervalMinutes, setIntervalMinutes] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  // KNOWN_PITFALLS.md 1.1 — useState 초기화 함수에서 localStorage를 읽으면 하이드레이션이
  // 어긋난다. 기본값(0)으로 시작한 뒤 마운트 후 1회만 동기화한다(Sidebar의 접힘 상태와 동일 패턴).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? Number(saved) : 0
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!Number.isNaN(parsed) && parsed > 0) setIntervalMinutes(parsed)
  }, [])

  useEffect(() => {
    if (intervalMinutes <= 0) return
    const id = setInterval(() => router.refresh(), intervalMinutes * 60 * 1000)
    return () => clearInterval(id)
  }, [intervalMinutes, router])

  const handleIconClick = () => {
    setExpanded(true)
    requestAnimationFrame(() => selectRef.current?.focus())
  }

  const handleSelect = (value: number) => {
    setIntervalMinutes(value)
    localStorage.setItem(STORAGE_KEY, String(value))
    setExpanded(false)
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        title="자동 새로고침"
        onClick={handleIconClick}
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300',
          expanded && '-translate-x-1',
          intervalMinutes > 0 ? 'text-red-500' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
        )}
      >
        <RefreshCw size={16} className={cn(intervalMinutes > 0 && 'animate-[spin_3s_linear_infinite]')} />
      </button>
      <select
        ref={selectRef}
        value={intervalMinutes}
        onChange={(e) => handleSelect(Number(e.target.value))}
        onBlur={() => setExpanded(false)}
        className={cn(
          'overflow-hidden rounded-md border text-xs transition-all duration-300 dark:bg-slate-900',
          expanded
            ? 'ml-1 w-24 border-slate-200 px-1 py-1 opacity-100 dark:border-slate-700'
            : 'w-0 border-transparent px-0 py-0 opacity-0',
        )}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default AutoRefreshControl
