'use client'

import { Search } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { FleetType } from '@/shared/utils/fleet'
import type { VesselType } from '@/shared/types'

const FLEET_OPTIONS: { value: FleetType; labelKey: 'fleetOwn' | 'fleetPartner' }[] = [
  { value: 'own', labelKey: 'fleetOwn' },
  { value: 'partner', labelKey: 'fleetPartner' },
]

const TYPE_OPTIONS: (VesselType | 'all')[] = ['all', 'container', 'bulk', 'tanker', 'roro']

const TYPE_LABEL_KEY = {
  container: 'typeContainer',
  bulk: 'typeBulk',
  tanker: 'typeTanker',
  roro: 'typeRoro',
} as const

function segmentClass(active: boolean) {
  return cn(
    'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
    active
      ? 'border-[#6366f1] bg-[#6366f1] text-white'
      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600',
  )
}

export function VesselFilterBar({
  search,
  onSearchChange,
  fleetFilter,
  onToggleFleet,
  typeFilter,
  onTypeFilterChange,
  typeCounts,
}: {
  search: string
  onSearchChange: (v: string) => void
  fleetFilter: Set<FleetType>
  onToggleFleet: (v: FleetType) => void
  typeFilter: VesselType | 'all'
  onTypeFilterChange: (v: VesselType | 'all') => void
  typeCounts: Record<VesselType | 'all', number>
}) {
  const { t } = useLanguage()

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.vessel.searchPlaceholder}
          className="w-64 rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm focus:ring-2 focus:ring-[#6366f1] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.common.fleetFilterLabel}</span>
        <div className="flex gap-1.5">
          {FLEET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggleFleet(opt.value)}
              className={segmentClass(fleetFilter.has(opt.value))}
            >
              {t.common[opt.labelKey]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5">
        {TYPE_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onTypeFilterChange(value)}
            className={segmentClass(typeFilter === value)}
          >
            {value === 'all' ? t.common.all : t.vessel[TYPE_LABEL_KEY[value]]} ({typeCounts[value]})
          </button>
        ))}
      </div>
    </div>
  )
}
