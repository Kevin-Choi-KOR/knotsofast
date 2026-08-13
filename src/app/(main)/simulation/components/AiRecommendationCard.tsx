import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Alert } from '@/shared/components/Alert'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { AiSimulationRecommendFailureReason } from './recommendTypes'

export type AiExplanationStatus = 'idle' | 'loading' | 'success' | 'error'

interface AiRecommendationCardProps {
  status: AiExplanationStatus
  reasoning?: string
  reason?: AiSimulationRecommendFailureReason
  model?: string
  feasible: boolean
  marginHours: number
  deadlineTerm: 'RTA' | 'STA'
}

export function AiRecommendationCard({
  status,
  reasoning,
  reason,
  model,
  feasible,
  marginHours,
  deadlineTerm,
}: AiRecommendationCardProps) {
  const { t } = useLanguage()

  if (status === 'idle') return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#6366f1]" />
        <span className="text-sm font-semibold">{t.simulation.aiExplanationTitle}</span>
        {status === 'success' && model && (
          <span className="inline-flex items-center rounded-full bg-[#6366f1]/10 px-2 py-0.5 text-xs font-medium text-[#6366f1]">
            {model}
          </span>
        )}
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
            feasible
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
          )}
        >
          {feasible
            ? t.simulation.deadlineMet(deadlineTerm, marginHours.toFixed(1))
            : t.simulation.deadlineMissed(deadlineTerm, Math.abs(marginHours).toFixed(1))}
        </span>
      </div>

      {status === 'loading' && (
        <Alert variant="info" className="mt-3 flex items-center gap-2">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          {t.simulation.aiExplanationLoading}
        </Alert>
      )}

      {status === 'error' && (
        <div className="mt-2 flex items-start gap-1.5 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {reason === 'no_api_key' ? t.simulation.aiExplanationNoApiKey : t.simulation.aiExplanationFailed}
        </div>
      )}

      {status === 'success' && reasoning && (
        <div className="mt-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <ul className="list-none space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            {reasoning
              .split('\n')
              .filter((line) => line.trim().length > 0)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AiRecommendationCard
