'use client'

import { Anchor, Download, FlaskConical, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { Vessel, Voyage } from '@/shared/types'
import type { PortCongestion } from '@/mocks/simulation'
import { CONGESTION_WAIT_HOURS } from '@/mocks/simulation'
import { AVG_BERTH_UNLOAD_HOURS } from '@/mocks/simulation'
import {
  DEPARTURE_OFFSET_MAX_H,
  DEPARTURE_OFFSET_MIN_H,
  DEPARTURE_OFFSET_STEP_H,
  SPEED_MAX_KNOTS,
  SPEED_MIN_KNOTS,
  SPEED_STEP_KNOTS,
} from '@/mocks/simulation'
import type { SimRoute } from '@/shared/utils/simulation'

const CONGESTION_OPTIONS: PortCongestion[] = ['low', 'medium', 'high', 'severe']

function departureLabel(offset: number, t: ReturnType<typeof useLanguage>['t']): string {
  if (offset > 0) return t.simulation.delayed(String(offset))
  if (offset < 0) return t.simulation.advanced(String(Math.abs(offset)))
  return t.simulation.noChange
}

function congestionLabel(c: PortCongestion, t: ReturnType<typeof useLanguage>['t']): string {
  return {
    low: t.simulation.congestionLow,
    medium: t.simulation.congestionMedium,
    high: t.simulation.congestionHigh,
    severe: t.simulation.congestionSevere,
  }[c]
}

interface OptionButtonProps {
  active: boolean
  onClick: () => void
  title: string
  subtitle: string
}

function OptionButton({ active, onClick, title, subtitle }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-2.5 text-left text-xs transition-colors',
        active
          ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]'
          : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
      )}
    >
      <div className="font-semibold">{title}</div>
      <div className={cn(active ? 'text-[#6366f1]/80' : 'text-slate-500 dark:text-slate-400')}>{subtitle}</div>
    </button>
  )
}

interface SimulationFormProps {
  ownVoyages: Voyage[]
  completedVoyages: Voyage[]
  vessels: Vessel[]
  selectedVoyage: Voyage

  voyageId: string
  onVoyageIdChange: (id: string) => void
  departureOffset: number
  onDepartureOffsetChange: (v: number) => void
  speedKnots: number
  onSpeedKnotsChange: (v: number) => void
  cargoPercent: number
  onCargoPercentChange: (v: number) => void
  route: SimRoute
  onRouteChange: (v: SimRoute) => void
  portCongestion: PortCongestion
  onPortCongestionChange: (v: PortCongestion) => void
  berthProgress: number
  onBerthProgressChange: (v: number) => void
  compareVoyageId: string
  onCompareVoyageIdChange: (v: string) => void

  onDownloadPdf: () => void
  onReset: () => void
  onApplyAiRecommendation: () => void
  isApplyingAiRecommendation: boolean
}

function voyageOptionLabel(voyage: Voyage, vessels: Vessel[]): string {
  const vessel = vessels.find((v) => v.id === voyage.vesselId)
  return `${vessel?.name} · ${voyage.departurePort.split(' ')[0]} → ${voyage.arrivalPort.split(' ')[0]}`
}

export function SimulationForm({
  ownVoyages,
  completedVoyages,
  vessels,
  selectedVoyage,
  voyageId,
  onVoyageIdChange,
  departureOffset,
  onDepartureOffsetChange,
  speedKnots,
  onSpeedKnotsChange,
  cargoPercent,
  onCargoPercentChange,
  route,
  onRouteChange,
  portCongestion,
  onPortCongestionChange,
  berthProgress,
  onBerthProgressChange,
  compareVoyageId,
  onCompareVoyageIdChange,
  onDownloadPdf,
  onReset,
  onApplyAiRecommendation,
  isApplyingAiRecommendation,
}: SimulationFormProps) {
  const { t } = useLanguage()

  const suezDistance = Math.round(selectedVoyage.distanceNm)
  const capeDistance = Math.round(selectedVoyage.distanceNm * 1.28)

  const congestionWaitHint = CONGESTION_WAIT_HOURS[portCongestion]
  const berthWaitHint = Math.max(0, ((100 - berthProgress) / 100) * AVG_BERTH_UNLOAD_HOURS)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-[#6366f1]" />
          <span className="text-sm font-semibold">{t.simulation.conditions}</span>
        </div>
        <button
          type="button"
          onClick={onDownloadPdf}
          title={t.simulation.downloadPdfHint}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Download className="h-3 w-3" />
          {t.simulation.downloadPdf}
        </button>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.simulation.targetVoyage}
            </label>
            <select
              value={voyageId}
              onChange={(e) => onVoyageIdChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800"
            >
              {ownVoyages.map((voyage) => (
                <option key={voyage.id} value={voyage.id}>
                  {voyageOptionLabel(voyage, vessels)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.simulation.compareVoyage}
            </label>
            {completedVoyages.length > 0 ? (
              <select
                value={compareVoyageId}
                onChange={(e) => onCompareVoyageIdChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800"
              >
                {completedVoyages.map((voyage) => (
                  <option key={voyage.id} value={voyage.id}>
                    {voyageOptionLabel(voyage, vessels)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.simulation.compareVoyageNone}</p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.simulation.departureAdj}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{departureLabel(departureOffset, t)}</span>
          </div>
          <input
            type="range"
            min={DEPARTURE_OFFSET_MIN_H}
            max={DEPARTURE_OFFSET_MAX_H}
            step={DEPARTURE_OFFSET_STEP_H}
            value={departureOffset}
            onChange={(e) => onDepartureOffsetChange(Number(e.target.value))}
            className="w-full accent-[#6366f1]"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{DEPARTURE_OFFSET_MIN_H}h</span>
            <span>0</span>
            <span>+{DEPARTURE_OFFSET_MAX_H}h</span>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.simulation.speed}</span>
            <span className="text-xs font-semibold text-[#6366f1]">{speedKnots} kts</span>
          </div>
          <input
            type="range"
            min={SPEED_MIN_KNOTS}
            max={SPEED_MAX_KNOTS}
            step={SPEED_STEP_KNOTS}
            value={speedKnots}
            onChange={(e) => onSpeedKnotsChange(Number(e.target.value))}
            className="w-full accent-[#6366f1]"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {SPEED_MIN_KNOTS} kts ({t.simulation.slowSteam})
            </span>
            <span>
              {SPEED_MAX_KNOTS} kts ({t.simulation.max})
            </span>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.simulation.cargo}</span>
            <span className="text-xs font-semibold text-[#6366f1]">{cargoPercent}%</span>
          </div>
          <input
            type="range"
            min={30}
            max={100}
            step={5}
            value={cargoPercent}
            onChange={(e) => onCargoPercentChange(Number(e.target.value))}
            className="w-full accent-[#6366f1]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.simulation.route}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <OptionButton
              active={route === 'default'}
              onClick={() => onRouteChange('default')}
              title={t.simulation.routeDefault}
              subtitle={t.simulation.defaultSub(suezDistance.toLocaleString('en-US'))}
            />
            <OptionButton
              active={route === 'suez'}
              onClick={() => onRouteChange('suez')}
              title={t.simulation.routeSuez}
              subtitle={t.simulation.suezSub(suezDistance.toLocaleString('en-US'))}
            />
            <OptionButton
              active={route === 'cape'}
              onClick={() => onRouteChange('cape')}
              title={t.simulation.routeCape}
              subtitle={t.simulation.capeSub(capeDistance.toLocaleString('en-US'))}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="mb-2 flex items-center gap-2">
            <Anchor className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.simulation.portWaitTitle}
            </span>
          </div>

          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.simulation.portCongestion}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {CONGESTION_OPTIONS.map((c) => (
              <OptionButton
                key={c}
                active={portCongestion === c}
                onClick={() => onPortCongestionChange(c)}
                title={congestionLabel(c, t)}
                subtitle=""
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {t.simulation.congestionWaitSub(String(congestionWaitHint))}
          </p>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.simulation.berthProgress}
              </span>
              <span className="text-xs font-semibold text-[#6366f1]">{berthProgress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={berthProgress}
              onChange={(e) => onBerthProgressChange(Number(e.target.value))}
              className="w-full accent-[#6366f1]"
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {t.simulation.berthWaitSub(berthWaitHint.toFixed(1))}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onApplyAiRecommendation}
              disabled={isApplyingAiRecommendation}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApplyingAiRecommendation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isApplyingAiRecommendation ? t.simulation.aiRecommendAnalyzing : t.simulation.aiRecommend}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
              {t.simulation.reset}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{t.simulation.aiRecommendDesc}</p>
        </div>
      </div>
    </div>
  )
}

export default SimulationForm
