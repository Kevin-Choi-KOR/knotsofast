'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Ship,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Leaf,
  Award,
  Trophy,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Vessel, Voyage } from '@/shared/types'
import { CARBON_VESSEL_STORAGE_KEY, OWN_COMPANY_NAME, SCHEDULE_CALENDAR_DATE_STORAGE_KEY } from '@/shared/constants'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { formatNumber } from '@/shared/utils/format'
import { ciiGradeFromScore, CII_COLORS, formatSignedPct } from '@/shared/utils/carbon'
import { CARBON_BENCHMARK_MULTIPLIER, MOCK_CII_SCORE_BY_VOYAGE } from '@/mocks/carbon'
import { computeEcoRanking } from '@/features/dashboard/ecoRanking'
import type { FleetGaugeRow } from '@/features/dashboard/fleetGauge'
import { VOYAGE_STATUS_COLOR } from '@/features/dashboard/statusColors'

const CARD_CLASS = 'rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - copy.getDay())
  return copy
}

function formatPeriodLabel(weekStart: Date, weekEnd: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, '0')
  return `${weekStart.getMonth() + 1}.${pad2(weekStart.getDate())} - ${weekEnd.getMonth() + 1}.${pad2(weekEnd.getDate())}`
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface OperationStatsCardProps {
  vesselsCount: number
  delayedCount: number
  completedTodayCount: number
  avgFuelSavingPercent: number
}

function OperationStatsCard({ vesselsCount, delayedCount, completedTodayCount, avgFuelSavingPercent }: OperationStatsCardProps) {
  const { t } = useLanguage()

  const items: { label: string; value: string; icon: typeof Ship; color: string }[] = [
    { label: t.dashboard.statVessels, value: `${vesselsCount}척`, icon: Ship, color: '#6366f1' },
    { label: t.dashboard.statDelayed, value: `${delayedCount}건`, icon: AlertTriangle, color: '#ef4444' },
    { label: t.dashboard.statCompleted, value: `${completedTodayCount}건`, icon: CheckCircle, color: '#22c55e' },
    { label: t.dashboard.statFuelSaving, value: `${avgFuelSavingPercent.toFixed(0)}%`, icon: TrendingDown, color: '#a855f7' },
  ]

  return (
    <div className={`${CARD_CLASS} col-span-2 grid grid-cols-2 grid-rows-2 grid-flow-col gap-x-2 gap-y-1 p-2`}>
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 items-center gap-1">
          <item.icon size={14} color={item.color} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate text-right text-[10px] text-slate-500 dark:text-slate-400">{item.label} :</span>
          <span className="shrink-0 text-xs font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

interface CarbonEmissionCardProps {
  currentCo2TonPerDay: number
}

function CarbonEmissionCard({ currentCo2TonPerDay }: CarbonEmissionCardProps) {
  const { t } = useLanguage()
  const targetCo2TonPerDay = currentCo2TonPerDay * CARBON_BENCHMARK_MULTIPLIER

  return (
    <div className={`${CARD_CLASS} col-span-2 grid grid-cols-2 p-2`}>
      <div className="flex flex-col items-center justify-center gap-0.5">
        <div className="flex items-center gap-1">
          <Leaf size={14} className="shrink-0 text-slate-400" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.dashboard.statCo2Target}</span>
        </div>
        <span className="text-base font-bold text-slate-900 dark:text-slate-100">{formatNumber(targetCo2TonPerDay, 1)}t/일</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-0.5 border-l border-slate-200 pl-2 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <Leaf size={14} className="shrink-0 text-green-500" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.dashboard.statCo2Current}</span>
        </div>
        <span className="text-base font-bold text-green-600">{formatNumber(currentCo2TonPerDay, 1)}t/일</span>
      </div>
    </div>
  )
}

interface CiiGradeCardProps {
  avgScore: number
}

function CiiGradeCard({ avgScore }: CiiGradeCardProps) {
  const { t } = useLanguage()
  const grade = ciiGradeFromScore(avgScore)

  return (
    <div className={`${CARD_CLASS} col-span-1 flex flex-col items-center justify-center gap-1 p-2`}>
      <div className="flex items-center gap-1">
        <Award size={14} className="shrink-0 text-slate-400" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.dashboard.statCiiGrade}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[30px] leading-none font-extrabold" style={{ color: CII_COLORS[grade] }}>
          {grade}
        </span>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{avgScore.toFixed(2)}</span>
      </div>
    </div>
  )
}

const MEDALS = ['🥇', '🥈', '🥉']

interface EcoRankingCardProps {
  vessels: Vessel[]
  voyages: Voyage[]
}

function EcoRankingCard({ vessels, voyages }: EcoRankingCardProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const ranking = useMemo(() => computeEcoRanking(vessels, voyages).slice(0, 3), [vessels, voyages])

  return (
    <div className={`${CARD_CLASS} col-span-1 flex flex-col gap-1 p-2`}>
      <div className="flex items-center gap-1">
        <Trophy size={14} className="shrink-0 text-slate-400" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.dashboard.statEcoRanking}</span>
      </div>
      <div className="flex flex-col">
        {ranking.map((entry, i) => (
          <button
            key={entry.vesselId}
            type="button"
            title="탄소 배출 대시보드에서 조회"
            onClick={() => {
              sessionStorage.setItem(CARBON_VESSEL_STORAGE_KEY, entry.vesselId)
              router.push('/carbon')
            }}
            className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <span className="shrink-0">{MEDALS[i]}</span>
            <span className="min-w-0 flex-1 truncate">{entry.vesselName}</span>
            <span className="shrink-0 font-semibold text-green-600">{formatSignedPct(entry.savedPct, '% 절감', '% 초과')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface WeeklyScheduleCardProps {
  vessels: Vessel[]
  voyages: Voyage[]
}

function WeeklyScheduleCard({ vessels, voyages }: WeeklyScheduleCardProps) {
  const router = useRouter()
  const [cursorDate, setCursorDate] = useState(() => new Date())
  const today = useMemo(() => new Date(), [])

  const ownVoyages = useMemo(() => {
    const ownVesselIds = new Set(vessels.filter((v) => v.company === OWN_COMPANY_NAME).map((v) => v.id))
    return voyages.filter((v) => ownVesselIds.has(v.vesselId))
  }, [vessels, voyages])

  const weekStart = useMemo(() => startOfWeek(cursorDate), [cursorDate])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const vesselNameOf = (vesselId: string) => vessels.find((v) => v.id === vesselId)?.name ?? vesselId

  return (
    <div className={`${CARD_CLASS} col-span-2 flex flex-col gap-1 p-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <CalendarRange size={14} className="shrink-0 text-slate-400" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">이번 주 일정</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursorDate((d) => addDays(d, -7))}
            className="flex h-4 w-4 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[9px] text-slate-500 dark:text-slate-400">{formatPeriodLabel(weekStart, days[6])}</span>
          <button
            type="button"
            onClick={() => setCursorDate((d) => addDays(d, 7))}
            className="flex h-4 w-4 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const events = ownVoyages.flatMap((voyage) => {
            const out: { type: 'etd' | 'rta'; status: Voyage['status']; vesselName: string }[] = []
            if (isSameDay(new Date(voyage.etd), day)) out.push({ type: 'etd', status: voyage.status, vesselName: vesselNameOf(voyage.vesselId) })
            if (isSameDay(new Date(voyage.rta), day)) out.push({ type: 'rta', status: voyage.status, vesselName: vesselNameOf(voyage.vesselId) })
            return out
          })
          const shownEvents = events.slice(0, 4)
          const tooltip = events.length > 0 ? events.map((e) => `${e.type === 'etd' ? '출항' : '입항'} · ${e.vesselName}`).join('\n') : undefined
          const isToday = isSameDay(day, today)

          return (
            <button
              key={day.toISOString()}
              type="button"
              title={tooltip}
              onClick={() => {
                sessionStorage.setItem(SCHEDULE_CALENDAR_DATE_STORAGE_KEY, day.toISOString())
                router.push('/schedule')
              }}
              className="flex flex-col items-center gap-0.5 py-0.5"
            >
              <span className="text-[9px] text-slate-400">{WEEKDAY_LABELS[day.getDay()]}</span>
              {isToday ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6366f1] text-xs font-bold text-white">
                  {day.getDate()}
                </span>
              ) : (
                <span className="text-xs text-slate-700 dark:text-slate-300">{day.getDate()}</span>
              )}
              <span className="flex h-1 items-center justify-center gap-0.5">
                {shownEvents.map((e, i) => (
                  <span key={i} className="h-1 w-1 rounded-full" style={{ backgroundColor: VOYAGE_STATUS_COLOR[e.status] }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface SummaryCardsProps {
  vessels: Vessel[]
  voyages: Voyage[]
  activeVoyages: Voyage[]
  fleetGaugeRows: FleetGaugeRow[]
}

export function SummaryCards({ vessels, voyages, activeVoyages, fleetGaugeRows }: SummaryCardsProps) {
  const today = useMemo(() => new Date(), [])

  const delayedCount = useMemo(() => activeVoyages.filter((v) => v.status === 'delayed').length, [activeVoyages])

  const completedTodayCount = useMemo(() => {
    const ownVesselIds = new Set(vessels.filter((v) => v.company === OWN_COMPANY_NAME).map((v) => v.id))
    return voyages.filter((v) => ownVesselIds.has(v.vesselId) && v.status === 'completed' && isSameDay(new Date(v.eta), today)).length
  }, [vessels, voyages, today])

  const avgFuelSavingPercent = useMemo(() => {
    if (fleetGaugeRows.length === 0) return 0
    return fleetGaugeRows.reduce((sum, r) => sum + r.fuelSavingPercent, 0) / fleetGaugeRows.length
  }, [fleetGaugeRows])

  const currentCo2TonPerDay = useMemo(() => fleetGaugeRows.reduce((sum, r) => sum + r.co2TonPerDay, 0), [fleetGaugeRows])

  const ciiAvgScore = useMemo(() => {
    if (activeVoyages.length === 0) return 4.5
    const sum = activeVoyages.reduce((acc, v) => acc + (MOCK_CII_SCORE_BY_VOYAGE[v.id] ?? 4.5), 0)
    return sum / activeVoyages.length
  }, [activeVoyages])

  return (
    <div className="grid shrink-0 grid-cols-4 gap-2 border-b border-slate-100 bg-white px-6 py-2 md:grid-cols-8 dark:border-slate-800 dark:bg-slate-800">
      <OperationStatsCard
        vesselsCount={activeVoyages.length}
        delayedCount={delayedCount}
        completedTodayCount={completedTodayCount}
        avgFuelSavingPercent={avgFuelSavingPercent}
      />
      <CarbonEmissionCard currentCo2TonPerDay={currentCo2TonPerDay} />
      <CiiGradeCard avgScore={ciiAvgScore} />
      <EcoRankingCard vessels={vessels} voyages={voyages} />
      <WeeklyScheduleCard vessels={vessels} voyages={voyages} />
    </div>
  )
}

export default SummaryCards
