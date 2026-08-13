'use client'

import {
  AlertTriangle,
  Anchor,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  FileDown,
  Fuel,
  Info,
  Leaf,
  MapPin,
  Minus,
  Navigation,
  RadioTower,
  RefreshCw,
  Shield,
  Ship,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingDown,
  TrendingUp,
  Wind,
  Wrench,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { Translations } from '@/features/i18n/translations'
import type { Vessel, Voyage, EcoSpeedReport, AisPosition, RiskItem } from '@/shared/types'
import type { CongestionLevel, CongestionTrend } from '@/mocks/port-congestion'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { RiskBadge } from '@/shared/components/StatusBadge'
import { useReportView } from '../hooks/useReportView'
import { VoyageProgressLine } from './VoyageProgressLine'
import { ProbabilityGauge } from './ProbabilityGauge'
import { StatCard, type StatCardAccent } from './StatCard'
import { ReportWeatherStats } from './ReportWeatherStats'
import {
  formatDecimal,
  formatInt,
  formatLocalTime,
  formatLocalTimeNatural,
  formatSavingValue,
  portFirstToken,
  getPortUtcOffset,
} from '../lib/format'
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

const CONGESTION_ICON_CLASS: Record<CongestionLevel, string> = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
}

const CONGESTION_TEXT_CLASS: Record<CongestionLevel, string> = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-green-600 dark:text-green-400',
}

const CONGESTION_LABEL_KEY: Record<CongestionLevel, 'congestionHigh' | 'congestionMedium' | 'congestionLow'> = {
  high: 'congestionHigh',
  medium: 'congestionMedium',
  low: 'congestionLow',
}

const TREND_ICON = { rising: TrendingUp, stable: Minus, falling: TrendingDown } as const

const TREND_CLASS: Record<CongestionTrend, string> = {
  rising: 'text-red-500',
  stable: 'text-slate-400',
  falling: 'text-green-500',
}

const TREND_LABEL_KEY: Record<CongestionTrend, 'trendRising' | 'trendStable' | 'trendFalling'> = {
  rising: 'trendRising',
  stable: 'trendStable',
  falling: 'trendFalling',
}

function savingLabels(t: Translations) {
  return { saved: t.aiReport.savingSuffix, increase: t.aiReport.increaseSuffix }
}

const RISK_CATEGORY_ICON = { weather: Wind, port: Anchor, geopolitical: Shield, mechanical: Wrench } as const

const RISK_CATEGORY_LABEL_KEY = {
  weather: 'catWeather',
  port: 'catPort',
  geopolitical: 'catGeopolitical',
  mechanical: 'catMechanical',
} as const

const RISK_LEVEL_ICON_CLASS: Record<RiskItem['level'], string> = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-[#6366f1]',
}

const RISK_LEVEL_BORDER_CLASS: Record<RiskItem['level'], string> = {
  high: 'border-red-200 dark:border-red-900/40',
  medium: 'border-yellow-200 dark:border-yellow-900/40',
  low: 'border-slate-200 dark:border-slate-700',
}

/** 6.9장: increase(증가)면 danger로 강조하고, 절감일 때만 원래 accent(brand/success)를 쓴다. */
function savingAccent(increase: boolean, base: StatCardAccent): StatCardAccent {
  return increase ? 'danger' : base
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

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border-2 border-[#6366f1]/25 bg-white p-4 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Navigation className="h-4 w-4 text-[#6366f1]" />
                  {t.aiReport.speedComparison}
                  {report.aiAnalyzedAt && (
                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#6366f1]/10 px-2 py-0.5 text-xs font-medium text-[#6366f1]">
                      <Sparkles className="h-3 w-3" />
                      {t.aiReport.aiGeneratedBadge}
                    </span>
                  )}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {t.aiReport.maxSpeedBadge} {formatDecimal(view.speedRange.max)}kts
                </span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-500 dark:text-slate-400">
                    {formatDecimal(view.currentSpeedKnots)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.aiReport.liveSpeed}</div>
                </div>
                <ArrowRight className="h-6 w-6 shrink-0 text-slate-300 dark:text-slate-600" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {formatDecimal(view.speedPlan.recommendedSpeedKnots)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.aiReport.recSpeed}</div>
                </div>
              </div>

              <div className="mt-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
                {view.delta === 'maintain' && t.aiReport.speedMaintain}
                {view.delta === 'reduce' &&
                  t.aiReport.speedReduceBy(formatDecimal(view.currentSpeedKnots - view.speedPlan.recommendedSpeedKnots))}
                {view.delta === 'increase' &&
                  t.aiReport.speedIncreaseBy(formatDecimal(view.speedPlan.recommendedSpeedKnots - view.currentSpeedKnots))}
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                {view.speedPlan.recommendedSpeedProbability.percent === 100 ? (
                  <>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">
                      {t.aiReport.recommendedGuarantee(view.deadline.term)}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                    <span className="text-red-700 dark:text-red-400">
                      {t.aiReport.recommendedInfeasible(
                        view.deadline.term,
                        String(Math.round(view.speedPlan.recommendedSpeedProbability.percent)),
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>

            <ProbabilityGauge
              label={t.aiReport.rtaProbability(view.deadline.term)}
              percent={view.speedPlan.currentSpeedProbability.percent}
              confidence={view.speedPlan.currentSpeedProbability.confidence}
              tone={view.deadline.term === 'STA' ? 'blue' : 'status'}
              descLabel={t.aiReport.rtaProbabilityDesc}
              marginLabel={
                view.speedPlan.currentSpeedProbability.marginHours >= 0
                  ? t.aiReport.marginBuffer(view.deadline.term, formatDecimal(view.speedPlan.currentSpeedProbability.marginHours))
                  : t.aiReport.marginDeficit(
                      view.deadline.term,
                      formatDecimal(Math.abs(view.speedPlan.currentSpeedProbability.marginHours)),
                    )
              }
              hint={
                view.speedPlan.currentSpeedProbability.percent < 100 &&
                view.speedPlan.recommendedSpeedProbability.percent === 100
                  ? t.aiReport.switchToRecommendedHint(view.deadline.term, formatDecimal(view.speedPlan.recommendedSpeedKnots))
                  : undefined
              }
              formula={t.aiReport.requiredSpeedFormula(
                formatInt(view.progress.remainingNm),
                formatDecimal(view.speedPlan.hoursUntilDeadline),
                formatDecimal(view.speedPlan.requiredSpeedKnots),
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<CalendarClock className="h-4 w-4" />}
              label={t.aiReport.sta}
              value={formatLocalTime(voyage.sta, arrivalOffset)}
              valueClassName="text-base"
              accent={voyage.rtaConfirmed ? 'default' : 'warning'}
            />
            <StatCard
              icon={<RadioTower className="h-4 w-4" />}
              label={t.aiReport.rta}
              value={voyage.rtaConfirmed ? formatLocalTime(voyage.rta, arrivalOffset) : t.aiReport.rtaUnconfirmedValue}
              valueClassName="text-base"
              accent={voyage.rtaConfirmed ? 'default' : 'warning'}
            />
            <StatCard
              icon={<Timer className="h-4 w-4" />}
              label={t.aiReport.etaAtCurrentSpeed}
              value={formatLocalTime(view.speedPlan.etaAtCurrent, arrivalOffset)}
              valueClassName="text-base"
            />
            <StatCard
              icon={<CalendarCheck className="h-4 w-4" />}
              label={t.aiReport.etaAtRecommendedSpeed}
              value={formatLocalTime(view.speedPlan.etaAtRecommended, arrivalOffset)}
              valueClassName="text-base"
              accent="success"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Leaf className="h-4 w-4" />}
              label={t.aiReport.co2SavingCumulative}
              value={formatSavingValue(view.speedPlan.co2SavedTon, 1, 'ton', savingLabels(t)).text}
              sublabel={t.aiReport.vsOriginalPlan}
              accent={savingAccent(view.speedPlan.co2SavedTon < 0, 'brand')}
            />
            <StatCard
              icon={<Leaf className="h-4 w-4" />}
              label={t.aiReport.co2SavingAdjustment}
              value={formatSavingValue(view.speedPlan.co2SavedTonFromCurrent, 1, 'ton', savingLabels(t)).text}
              sublabel={t.aiReport.vsCurrentSpeed}
              accent={savingAccent(view.speedPlan.co2SavedTonFromCurrent < 0, 'brand')}
            />
            <StatCard
              icon={<Fuel className="h-4 w-4" />}
              label={t.aiReport.fuelSavingCumulative}
              value={fuelSaving.text}
              sublabel={t.aiReport.vsOriginalPlan}
              accent={savingAccent(fuelSaving.increase, 'success')}
            />
            <StatCard
              icon={<Fuel className="h-4 w-4" />}
              label={t.aiReport.fuelSavingAdjustment}
              value={formatSavingValue(view.speedPlan.fuelSavingPercentFromCurrent, 1, '%', savingLabels(t)).text}
              sublabel={t.aiReport.vsCurrentSpeed}
              accent={savingAccent(view.speedPlan.fuelSavingPercentFromCurrent < 0, 'success')}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Anchor className={cn('h-4 w-4', CONGESTION_ICON_CLASS[view.congestionTier])} />
                  {t.aiReport.portCongestionTitle}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {t.aiReport.congestionP75Badge}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn('text-base font-bold', CONGESTION_TEXT_CLASS[view.congestionTier])}>
                  {t.aiReport[CONGESTION_LABEL_KEY[view.congestionTier]]}
                </span>
                <span className="text-sm text-slate-400">{view.congestion.congestionScore}/100</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">
                  {t.aiReport.p75WaitHours} {formatDecimal(view.congestion.avgWaitHours)}h
                </span>
                {(() => {
                  const TrendIcon = TREND_ICON[view.congestion.trend]
                  return (
                    <span className={cn('flex items-center gap-1', TREND_CLASS[view.congestion.trend])}>
                      <TrendIcon className="h-3.5 w-3.5" />
                      {t.aiReport[TREND_LABEL_KEY[view.congestion.trend]]}
                    </span>
                  )
                })()}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {t.aiReport.berthAvailability}{' '}
                {t.aiReport.berthCount(String(view.congestion.berthsAvailable), String(view.congestion.berthsTotal))}
              </div>
            </Card>

            <ReportWeatherStats
              current={view.weather.current}
              arrival={view.weather.arrival}
              currentLabel={t.aiReport.currentAreaWeather}
              arrivalLabel={t.aiReport.arrivalPortWeather}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t.aiReport.reasoning}</h3>
              {report.aiAnalyzedAt && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#6366f1]/10 px-2 py-0.5 text-xs font-medium text-[#6366f1]">
                    <Sparkles className="h-3 w-3" />
                    {t.aiReport.aiGeneratedBadge}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t.aiReport.aiAnalyzedAtLabel}: {formatLocalTimeNatural(report.aiAnalyzedAt, arrivalOffset)}
                  </span>
                </>
              )}
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {report.reasoning
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t.aiReport.risks}</h3>
            <div className="mt-2 space-y-2">
              {report.risks.map((risk, i) => {
                const RiskIcon = risk.level === 'low' ? Info : AlertTriangle
                const CategoryIcon = RISK_CATEGORY_ICON[risk.category]
                return (
                  <div
                    key={i}
                    className={cn('rounded-lg border p-3', RISK_LEVEL_BORDER_CLASS[risk.level])}
                  >
                    <div className="flex items-start gap-2">
                      <RiskIcon className={cn('mt-0.5 h-4 w-4 shrink-0', RISK_LEVEL_ICON_CLASS[risk.level])} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{risk.title}</span>
                          <RiskBadge level={risk.level} />
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <CategoryIcon className="h-3 w-3" />
                            {t.aiReport[RISK_CATEGORY_LABEL_KEY[risk.category]]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm whitespace-pre-line text-slate-600 dark:text-slate-300">
                          {risk.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.aiReport.regionalIssuesTitle}
            </h3>
            {view.issues.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.aiReport.noNearbyIssues}</p>
            ) : (
              <div className="mt-2 space-y-2">
                {view.issues.map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{issue.title}</span>
                          <RiskBadge level={issue.severity} />
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{issue.description}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {t.aiReport.source}: {issue.source}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportCard
