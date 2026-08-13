'use client'

import { CalendarRange, List, Search } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { VoyageStatus } from '@/shared/types'
import type { FleetType } from '@/shared/utils/fleet'
import type { DateBasis } from '../lib/schedule'
import { STATUS_TABS } from '../lib/schedule'

export type ViewTab = 'list' | 'calendar'

const SEGMENT_BASE =
  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap'
const SEGMENT_ACTIVE = 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
const SEGMENT_INACTIVE = 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'

interface FilterBarProps {
  viewTab: ViewTab
  onViewTabChange: (tab: ViewTab) => void
  search: string
  onSearchChange: (v: string) => void
  statusFilter: VoyageStatus | 'all'
  onStatusFilterChange: (v: VoyageStatus | 'all') => void
  statusCounts: Record<VoyageStatus | 'all', number>
  fleetTypes: ReadonlySet<FleetType>
  onToggleFleetType: (type: FleetType) => void
  dateBasis: DateBasis
  onDateBasisChange: (v: DateBasis) => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
}

export function FilterBar({
  viewTab,
  onViewTabChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  fleetTypes,
  onToggleFleetType,
  dateBasis,
  onDateBasisChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: FilterBarProps) {
  const { t } = useLanguage()

  const statusLabel = (status: VoyageStatus | 'all') => (status === 'all' ? t.common.all : t.status[status])

  return (
    <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
      {/* ① 뷰 탭 */}
      <div className="-mx-6 -mb-px flex gap-4 border-b border-slate-100 px-6 dark:border-slate-800">
        {(
          [
            { tab: 'list' as const, icon: List, label: t.schedule.viewList },
            { tab: 'calendar' as const, icon: CalendarRange, label: t.schedule.viewCalendar },
          ]
        ).map(({ tab, icon: Icon, label }) => (
          <button
            key={tab}
            type="button"
            onClick={() => onViewTabChange(tab)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-1 pb-2.5 text-sm font-medium',
              viewTab === tab
                ? 'border-[#6366f1] text-[#6366f1]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ② 검색 + 상태 필터 */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.schedule.searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusFilterChange(status)}
              className={cn(SEGMENT_BASE, statusFilter === status ? SEGMENT_ACTIVE : SEGMENT_INACTIVE)}
            >
              {statusLabel(status)} <span className="opacity-60">({statusCounts[status] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ③ 선단 구분 필터 */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.common.fleetFilterLabel}</span>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {(['own', 'partner'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onToggleFleetType(type)}
              className={cn(SEGMENT_BASE, fleetTypes.has(type) ? SEGMENT_ACTIVE : SEGMENT_INACTIVE)}
            >
              {type === 'own' ? t.common.fleetOwn : t.common.fleetPartner}
            </button>
          ))}
        </div>
      </div>

      {/* ④ 조회기간 필터 */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.schedule.dateRangeLabel}</span>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {(['etd', 'eta', 'rta'] as const).map((basis) => (
            <button
              key={basis}
              type="button"
              onClick={() => onDateBasisChange(basis)}
              className={cn(SEGMENT_BASE, dateBasis === basis ? SEGMENT_ACTIVE : SEGMENT_INACTIVE)}
            >
              {t.schedule[basis === 'etd' ? 'dateBasisEtd' : basis === 'eta' ? 'dateBasisEta' : 'dateBasisRta']}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800"
        />
        <span className="text-xs text-slate-400">–</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800"
        />
      </div>
    </div>
  )
}

export default FilterBar
