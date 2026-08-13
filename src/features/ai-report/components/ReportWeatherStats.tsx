'use client'

import type { ReactNode } from 'react'
import { Loader2, Waves, Wind } from 'lucide-react'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { StatCard, type StatCardAccent } from './StatCard'
import type { WeatherPointState } from '../hooks/useReportWeather'
import type { Translations } from '@/features/i18n/translations'

type SeaStateKey = 'seaStateCalm' | 'seaStateModerate' | 'seaStateRough' | 'seaStateHigh'

function seaState(waveHeightM: number): { labelKey: SeaStateKey; accent: StatCardAccent } {
  if (waveHeightM < 1) return { labelKey: 'seaStateCalm', accent: 'success' }
  if (waveHeightM < 2) return { labelKey: 'seaStateModerate', accent: 'default' }
  if (waveHeightM < 4) return { labelKey: 'seaStateRough', accent: 'warning' }
  return { labelKey: 'seaStateHigh', accent: 'danger' }
}

function WeatherSlot({ icon, label, state, t }: { icon: ReactNode; label: string; state: WeatherPointState; t: Translations }) {
  if (state.status === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label} · {t.aiReport.weatherFetching}
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {label} · {t.aiReport.weatherUnavailable}
      </div>
    )
  }
  const sea = seaState(state.waveHeightM)
  return (
    <StatCard
      icon={icon}
      label={label}
      value={`${state.windSpeedMs.toFixed(1)} m/s · ${state.waveHeightM.toFixed(1)}m`}
      sublabel={t.aiReport[sea.labelKey]}
      accent={sea.accent}
    />
  )
}

interface ReportWeatherStatsProps {
  current: WeatherPointState
  arrival: WeatherPointState
  currentLabel: string
  arrivalLabel: string
}

/** 현재 위치·도착항 실시간 풍속/파고를 StatCard 2장으로 보여준다(docs/specs/AI_REPORT.md 5.4장). */
export function ReportWeatherStats({ current, arrival, currentLabel, arrivalLabel }: ReportWeatherStatsProps) {
  const { t } = useLanguage()
  return (
    <>
      <WeatherSlot icon={<Wind className="h-4 w-4" />} label={currentLabel} state={current} t={t} />
      <WeatherSlot icon={<Waves className="h-4 w-4" />} label={arrivalLabel} state={arrival} t={t} />
    </>
  )
}

export default ReportWeatherStats
