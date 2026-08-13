'use client'

import { ArrowRight, ChevronDown, ChevronUp, FileDown, RefreshCw, Ship } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { Translations } from '@/features/i18n/translations'
import type { Vessel, Voyage, EcoSpeedReport, AisPosition } from '@/shared/types'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { useReportView } from '../hooks/useReportView'
import { VoyageProgressLine } from './VoyageProgressLine'
import { formatLocalTime, formatSavingValue, portFirstToken, getPortUtcOffset } from '../lib/format'
import type { Confidence } from '../lib/calculations'

const VESSEL_TYPE_KEY = {
  container: 'vesselTypeContainer',
  bulk: 'vesselTypeBulk',
  tanker: 'vesselTypeTanker',
  roro: 'vesselTypeRoro',
} as const

const CONFIDENCE_TEXT_CLASS: Record<Confidence, string> = {
  high: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-red-600 dark:text-red-400',
}

function savingLabels(t: Translations) {
  return { saved: t.aiReport.savingSuffix, increase: t.aiReport.increaseSuffix }
}

interface ReportCardProps {
  vessel: Vessel
  voyage: Voyage
  report: EcoSpeedReport
  position?: AisPosition
  expanded: boolean
  onToggle: () => void
}

export function ReportCard({ vessel, voyage, report, position, expanded, onToggle }: ReportCardProps) {
  const { t } = useLanguage()
  const view = useReportView(vessel, voyage, report, position)

  const departureLabel = portFirstToken(voyage.departurePort)
  const arrivalLabel = portFirstToken(voyage.arrivalPort)
  const departureOffset = getPortUtcOffset(voyage.departurePort)
  const arrivalOffset = getPortUtcOffset(voyage.arrivalPort)

  const fuelSaving = formatSavingValue(view.speedPlan.fuelSavingPercent, 1, '%', savingLabels(t))
  const probability = view.speedPlan.currentSpeedProbability

  return (
    <div
      id={`ai-report-${report.id}`}
      className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggle()
        }}
        className="flex cursor-pointer items-center gap-4 p-4"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
          <Ship className="h-5 w-5 text-[#6366f1]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
            {vessel.name} ({departureLabel} → {arrivalLabel})
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="font-bold">STD</span> {formatLocalTime(voyage.etd, departureOffset)}
            </div>
            <div>
              <span className="font-bold">STA</span> {formatLocalTime(voyage.sta, arrivalOffset)}
            </div>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-6 sm:flex">
          <div className="w-20 text-center text-sm text-slate-600 dark:text-slate-300">
            {t.aiReport[VESSEL_TYPE_KEY[vessel.type]]}
          </div>
          <div className={cn('w-28 text-sm font-medium', fuelSaving.increase ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
            {fuelSaving.text}
          </div>
          <div className="flex w-40 items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
            <span>{view.currentSpeedKnots.toFixed(1)}</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-[#6366f1]">{view.speedPlan.recommendedSpeedKnots.toFixed(1)}</span>
          </div>
          <div className={cn('w-44 text-sm font-semibold', CONFIDENCE_TEXT_CLASS[probability.confidence])}>
            {Math.round(probability.percent)}%
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled
          onClick={(e) => e.stopPropagation()}
          className="hidden shrink-0 items-center gap-1.5 md:flex"
        >
          <FileDown className="h-3.5 w-3.5" />
          {t.aiReport.downloadPdf}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled
          onClick={(e) => e.stopPropagation()}
          className="hidden shrink-0 items-center gap-1.5 md:flex"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t.aiReport.reanalyze}
        </Button>

        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </div>

      {expanded && (
        <div className="space-y-5 border-t border-slate-100 px-4 pb-4 dark:border-slate-800">
          {!voyage.rtaConfirmed && (
            <Alert variant="warning" className="pt-4">
              {t.aiReport.rtaUnconfirmedNotice}
            </Alert>
          )}

          <div className={voyage.rtaConfirmed ? 'pt-4' : undefined}>
            <VoyageProgressLine
              totalDistanceNm={voyage.distanceNm}
              traveledNm={view.progress.traveledNm}
              remainingNm={view.progress.remainingNm}
              percent={view.progress.percent}
              departureLabel={departureLabel}
              arrivalLabel={arrivalLabel}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportCard
