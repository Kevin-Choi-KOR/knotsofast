'use client'

import { Anchor, Wrench } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { VesselBadge } from '@/shared/components/StatusBadge'
import { portToken } from '@/shared/utils/vessel'
import type { Vessel, Voyage } from '@/shared/types'

const TYPE_LABEL_KEY = {
  container: 'typeContainer',
  bulk: 'typeBulk',
  tanker: 'typeTanker',
  roro: 'typeRoro',
} as const

export function VesselCard({
  vessel,
  selected,
  activeVoyage,
  onClick,
}: {
  vessel: Vessel
  selected: boolean
  activeVoyage?: Voyage
  onClick: () => void
}) {
  const { t } = useLanguage()
  const foulingWarn = vessel.foulingFactor > 1.07

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border bg-white p-4 text-left dark:bg-slate-800',
        selected
          ? 'border-[#6366f1] shadow-md ring-1 ring-[#6366f1]/30'
          : 'border-slate-200 hover:shadow-sm hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60">
          {vessel.status === 'maintenance' ? (
            <Wrench className="h-4 w-4 text-yellow-500" />
          ) : (
            <Anchor className="h-4 w-4 text-[#6366f1]" />
          )}
        </span>
        <VesselBadge status={vessel.status} />
      </div>

      <div className="text-sm font-semibold">{vessel.name}</div>
      <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        IMO {vessel.imo} · {t.vessel[TYPE_LABEL_KEY[vessel.type]]} · {vessel.buildYear}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <div className="text-slate-500 dark:text-slate-400">{t.vessel.grossTonnage}</div>
          <div className="font-medium text-slate-700 dark:text-slate-200">
            {vessel.grossTonnage.toLocaleString('ko-KR')} GT
          </div>
        </div>
        <div>
          <div className="text-slate-500 dark:text-slate-400">{t.vessel.draft}</div>
          <div className="font-medium text-slate-700 dark:text-slate-200">
            {vessel.currentDraft}m / {vessel.maxDraft}m
          </div>
        </div>
        <div>
          <div className="text-slate-500 dark:text-slate-400">{t.vessel.loa}</div>
          <div className="font-medium text-slate-700 dark:text-slate-200">{vessel.lengthOverall}m</div>
        </div>
        <div>
          <div className="text-slate-500 dark:text-slate-400">{t.vessel.fouling}</div>
          <div
            className={cn(
              'font-medium',
              foulingWarn ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200',
            )}
          >
            ×{vessel.foulingFactor.toFixed(2)}
          </div>
        </div>
      </div>

      {activeVoyage && (
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium text-[#6366f1] dark:border-slate-700">
          {t.vessel.underway}: {portToken(activeVoyage.departurePort)} → {portToken(activeVoyage.arrivalPort)}
        </div>
      )}
    </button>
  )
}
