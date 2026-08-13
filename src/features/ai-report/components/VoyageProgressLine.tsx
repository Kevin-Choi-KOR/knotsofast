'use client'

import { Navigation, Ship } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { formatInt } from '../lib/format'

interface VoyageProgressLineProps {
  totalDistanceNm: number
  traveledNm: number
  remainingNm: number
  percent: number
  departureLabel: string
  arrivalLabel: string
}

export function VoyageProgressLine({
  totalDistanceNm,
  traveledNm,
  remainingNm,
  percent,
  departureLabel,
  arrivalLabel,
}: VoyageProgressLineProps) {
  const { t } = useLanguage()
  const clampedPercent = Math.min(100, Math.max(0, percent))
  // 라벨은 카드 밖으로 잘리지 않도록 6~94%로만 clamp한다. 아이콘 자체 위치는 실제 진행률 그대로 쓴다.
  const labelPercent = Math.min(94, Math.max(6, clampedPercent))

  return (
    <Card>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
          <Navigation className="h-4 w-4 text-[#6366f1]" />
          {t.aiReport.progressLineTitle}
        </div>
        <div className="text-slate-500 dark:text-slate-400">
          {t.aiReport.totalDistance} <span className="font-semibold text-slate-700 dark:text-slate-200">{formatInt(totalDistanceNm)} nm</span>
        </div>
      </div>

      <div className="relative mt-8 mb-2">
        <div
          className="absolute -top-6 -translate-x-1/2 text-xs font-bold whitespace-nowrap text-[#6366f1]"
          style={{ left: `${labelPercent}%` }}
        >
          {t.aiReport.currentPosition} · {Math.round(clampedPercent)}%
        </div>

        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-[#6366f1] transition-all"
            style={{ width: `${clampedPercent}%` }}
          />
        </div>

        <span className="absolute top-1/2 left-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-300 dark:border-slate-900 dark:bg-slate-600" />
        <span className="absolute top-1/2 right-0 h-2.5 w-2.5 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-300 dark:border-slate-900 dark:bg-slate-600" />

        <Ship
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-[#6366f1]"
          style={{ left: `${clampedPercent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <div>
          <span className="font-medium text-slate-700 dark:text-slate-200">{departureLabel}</span>
          <span className="ml-1">
            · {t.aiReport.traveledDistance} {formatInt(traveledNm)} nm
          </span>
        </div>
        <div className="text-right">
          <span className="font-medium text-slate-700 dark:text-slate-200">{arrivalLabel}</span>
          <span className="ml-1">
            · {t.aiReport.remainingDistance} {formatInt(remainingNm)} nm
          </span>
        </div>
      </div>
    </Card>
  )
}

export default VoyageProgressLine
