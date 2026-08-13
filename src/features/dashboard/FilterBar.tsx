'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Anchor, ChevronLeft, ChevronRight, CloudRain, MapPin, Sailboat, Ship } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { Destination, QuickFilterKey } from '@/features/dashboard/filters'

const QUICK_FILTERS: { key: QuickFilterKey; label: string; icon: LucideIcon; title: string }[] = [
  { key: 'my', label: 'My', icon: Sailboat, title: '자사 선박만 지도에 표시' },
  { key: 'weather', label: '기상', icon: CloudRain, title: '해상 기상 + 강수 레이더 지도에 표시' },
  { key: 'vessels', label: '선박', icon: Ship, title: '선박 마커 지도에 표시' },
  { key: 'issues', label: '이슈', icon: AlertTriangle, title: '지역 이슈 지도에 표시 (항구와 동시 선택 불가)' },
  { key: 'ports', label: '항구', icon: Anchor, title: '항구 지도에 표시 (이슈와 동시 선택 불가)' },
]

function quickFilterClass(key: QuickFilterKey, active: boolean): string {
  if (key === 'my') {
    return active ? 'border-rose-500 bg-rose-500 text-white' : 'border-rose-300 bg-rose-50 text-rose-600'
  }
  return active
    ? 'border-[#6366f1] bg-[#6366f1] text-white'
    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

export interface FilterBarProps {
  activeFilters: Set<QuickFilterKey>
  onToggleFilter: (key: QuickFilterKey) => void
  destinations: Destination[]
  selectedDestinationCode: string | null
  onSelectDestination: (code: string | null) => void
  showVessels: boolean
  summaryText: string
}

export function FilterBar({
  activeFilters,
  onToggleFilter,
  destinations,
  selectedDestinationCode,
  onSelectDestination,
  showVessels,
  summaryText,
}: FilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    const updateScrollState = () => {
      if (!el) return
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }

    updateScrollState()
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [destinations, showVessels])

  const scrollByAmount = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const activeFilterLabels = QUICK_FILTERS.filter((f) => activeFilters.has(f.key)).map((f) => f.label)

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-6 py-2.5 dark:border-slate-800 dark:bg-slate-800">
      <MapPin size={14} className="shrink-0 text-slate-400" />
      <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300">도착지 필터</span>

      {QUICK_FILTERS.map(({ key, label, icon: Icon, title }) => (
        <button
          key={key}
          type="button"
          title={title}
          onClick={() => onToggleFilter(key)}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
            quickFilterClass(key, activeFilters.has(key)),
          )}
        >
          <Icon size={12} />
          {label}
        </button>
      ))}

      <span className="h-4 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />

      {!showVessels ? (
        <span className="min-w-0 flex-1 truncate text-xs text-slate-400 italic">
          {activeFilterLabels.join(' · ')} 보기 중에는 도착지 필터를 사용할 수 없습니다
        </span>
      ) : (
        <div className="relative min-w-0 flex-1">
          {canScrollLeft && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent dark:from-slate-800" />
              <button
                type="button"
                onClick={() => scrollByAmount(-240)}
                className="absolute top-1/2 left-0 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow dark:bg-slate-700"
              >
                <ChevronLeft size={14} />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className={cn(
              'flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              canScrollLeft && 'pl-7',
              canScrollRight && 'pr-7',
            )}
          >
            {destinations.map((d) => (
              <button
                key={d.code ?? 'all'}
                type="button"
                onClick={() => onSelectDestination(d.code === selectedDestinationCode ? null : d.code)}
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
                  d.code === selectedDestinationCode
                    ? 'bg-[#6366f1] text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {canScrollRight && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent dark:from-slate-800" />
              <button
                type="button"
                onClick={() => scrollByAmount(240)}
                className="absolute top-1/2 right-0 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow dark:bg-slate-700"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>
      )}

      <span className="ml-auto shrink-0 text-xs text-slate-500 dark:text-slate-400">{summaryText}</span>
    </div>
  )
}

export default FilterBar
