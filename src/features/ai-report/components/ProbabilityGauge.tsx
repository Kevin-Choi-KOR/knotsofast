'use client'

import { Gauge } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { Confidence } from '../lib/calculations'

export type GaugeTone = 'status' | 'blue'

interface Palette {
  text: string
  bar: string
  border: string
}

const STATUS_PALETTE: Record<Confidence, Palette> = {
  high: { text: 'text-green-600', bar: 'bg-green-500', border: 'border-green-500/60' },
  medium: { text: 'text-yellow-600', bar: 'bg-yellow-500', border: 'border-yellow-500/60' },
  low: { text: 'text-red-600', bar: 'bg-red-500', border: 'border-red-500/60' },
}

const BLUE_PALETTE: Record<Confidence, Palette> = {
  high: { text: 'text-blue-600', bar: 'bg-blue-600', border: 'border-blue-600/60' },
  medium: { text: 'text-blue-500', bar: 'bg-blue-500', border: 'border-blue-500/60' },
  low: { text: 'text-blue-400', bar: 'bg-blue-400', border: 'border-blue-400/60' },
}

interface ProbabilityGaugeProps {
  label: string
  percent: number
  confidence: Confidence
  tone: GaugeTone
  /** "현재 속도 유지 시" 등 좌측 설명 문구 */
  descLabel: string
  /** "{RTA} 대비 Nh 여유" 등 우측 마진 문구 */
  marginLabel: string
  /** 현재 속도로는 미달인데 권장 속도로는 100% 충족 가능할 때만 */
  hint?: string
  /** 필요 평균 속도 공식 문자열 */
  formula?: string
}

export function ProbabilityGauge({
  label,
  percent,
  confidence,
  tone,
  descLabel,
  marginLabel,
  hint,
  formula,
}: ProbabilityGaugeProps) {
  const { t } = useLanguage()
  const palette = (tone === 'blue' ? BLUE_PALETTE : STATUS_PALETTE)[confidence]
  const confidenceLabel = {
    high: t.aiReport.confidenceHigh,
    medium: t.aiReport.confidenceMedium,
    low: t.aiReport.confidenceLow,
  }[confidence]
  const clampedPercent = Math.min(100, Math.max(0, percent))

  return (
    <div className={cn('rounded-xl border-2 bg-white p-4 dark:bg-slate-900', palette.border)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Gauge className="h-4 w-4" />
          {label}
        </div>
        <div className={cn('text-3xl font-extrabold', palette.text)}>{Math.round(percent)}%</div>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn('h-full rounded-full transition-all', palette.bar)}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <span className={cn('font-bold', palette.text)}>
          {descLabel} · {confidenceLabel}
        </span>
        <span className="text-slate-500 dark:text-slate-400">{marginLabel}</span>
      </div>

      {hint && <div className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">{hint}</div>}

      {formula && (
        <div className="mt-2 border-t border-slate-100 pt-2 font-mono text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          {formula}
        </div>
      )}
    </div>
  )
}

export default ProbabilityGauge
