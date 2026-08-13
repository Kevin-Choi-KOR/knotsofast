'use client'

import { useMemo, useState, useEffect } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { Vessel, Voyage, VoyageStatus } from '@/shared/types'
import { getPortCode } from '../lib/route'

// 대시보드 지도 마커(MapView)와 동일한 팔레트 — 지도·캘린더 색을 통일하기 위한 값이다.
const STATUS_COLOR: Record<VoyageStatus, string> = {
  underway: '#3b82f6',
  delayed: '#ef4444',
  preparing: '#94a3b8',
  completed: '#22c55e',
  cancelled: '#64748b',
}

const MAX_MARKERS_PER_DAY = 3

interface CalendarEvent {
  voyage: Voyage
  vesselName: string
  kind: 'departure' | 'arrival'
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function buildGrid(cursor: Date): Date[] {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}

interface ScheduleCalendarProps {
  voyages: Voyage[]
  vessels: Vessel[]
  onEventClick: (voyage: Voyage) => void
  focusDate?: Date | null
}

export function ScheduleCalendar({ voyages, vessels, onEventClick, focusDate }: ScheduleCalendarProps) {
  const { t } = useLanguage()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    if (!focusDate) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCursor(new Date(focusDate.getFullYear(), focusDate.getMonth(), 1))
  }, [focusDate])

  const grid = useMemo(() => buildGrid(cursor), [cursor])
  const today = useMemo(() => new Date(), [])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const voyage of voyages) {
      const vessel = vessels.find((v) => v.id === voyage.vesselId)
      const vesselName = vessel?.name ?? '-'
      const push = (dateIso: string, kind: 'departure' | 'arrival') => {
        const d = new Date(dateIso)
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        const list = map.get(key) ?? []
        list.push({ voyage, vesselName, kind })
        map.set(key, list)
      }
      push(voyage.etd, 'departure')
      push(voyage.rta, 'arrival')
    }
    return map
  }, [voyages, vessels])

  const monthLabel = `${cursor.getFullYear()}.${String(cursor.getMonth() + 1).padStart(2, '0')}`
  const weekdayLabels = t.schedule.weekdays

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-28 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
          }}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t.schedule.todayBtn}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        {weekdayLabels.map((w) => (
          <div key={w} className="py-1.5">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
        {grid.map((date, i) => {
          const inMonth = date.getMonth() === cursor.getMonth()
          const isToday = isSameDay(date, today)
          const isFocused = focusDate ? isSameDay(date, focusDate) : false
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          const events = eventsByDay.get(key) ?? []
          const visibleEvents = events.slice(0, MAX_MARKERS_PER_DAY)
          const overflow = events.length - visibleEvents.length

          return (
            <div
              key={i}
              className={cn(
                'flex min-h-[92px] flex-col gap-0.5 bg-white p-1 dark:bg-slate-900',
                isFocused && 'ring-2 ring-inset ring-[#6366f1]',
              )}
            >
              <div className="px-1 text-xs">
                {isToday ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6366f1] font-semibold text-white">
                    {date.getDate()}
                  </span>
                ) : (
                  <span className={inMonth ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-700'}>
                    {date.getDate()}
                  </span>
                )}
              </div>

              {visibleEvents.map((ev, idx) => {
                const Icon = ev.kind === 'departure' ? ArrowUpRight : ArrowDownLeft
                const color = STATUS_COLOR[ev.voyage.status]
                const depCode = getPortCode(ev.voyage.departurePort)
                const arrCode = getPortCode(ev.voyage.arrivalPort)
                const codePair = depCode && arrCode ? ` (${depCode}-${arrCode})` : ''
                const dirLabel = ev.kind === 'departure' ? t.schedule.departureTag : t.schedule.arrivalTag

                return (
                  <button
                    key={idx}
                    type="button"
                    title={`${dirLabel} · ${ev.vesselName}${codePair}`}
                    onClick={() => onEventClick(ev.voyage)}
                    style={{ color, backgroundColor: `${color}20` }}
                    className="flex items-center gap-0.5 truncate rounded px-1 py-0.5 text-left text-[10px] hover:opacity-75"
                  >
                    <Icon className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">
                      {ev.vesselName}
                      <span className="opacity-70">{codePair}</span>
                    </span>
                  </button>
                )
              })}

              {overflow > 0 && (
                <span className="px-1 text-[10px] text-slate-400">{t.schedule.moreEvents(String(overflow))}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ScheduleCalendar
