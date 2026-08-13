import { Anchor, Clock } from 'lucide-react'
import { useLanguage } from '@/features/i18n/LanguageContext'

interface EtaCardProps {
  plannedEta: string
  plannedDays: number
  simEta: Date
  simDays: number
  portWaitHours: number
  portWaitCostUsd: number
}

export function EtaCard({ plannedEta, plannedDays, simEta, simDays, portWaitHours, portWaitCostUsd }: EtaCardProps) {
  const { t } = useLanguage()

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <span className="text-sm font-semibold">{t.simulation.etaTitle}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.simulation.plannedEta}</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {new Date(plannedEta).toLocaleString('ko-KR')}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.simulation.daysLabel(plannedDays.toFixed(1))}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.simulation.simEta}</div>
          <div className="text-sm font-medium text-[#6366f1]">{simEta.toLocaleString('ko-KR')}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.simulation.daysLabel(simDays.toFixed(1))}</div>
        </div>
      </div>

      {portWaitHours > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Anchor className="h-3.5 w-3.5" />
            <span>{t.simulation.portWaitTitle}</span>
          </div>
          <span className="font-semibold text-amber-600 dark:text-amber-500">
            +{portWaitHours}h · {t.simulation.portWaitCost(`$${portWaitCostUsd.toLocaleString('en-US')}`)}
          </span>
        </div>
      )}
    </div>
  )
}

export default EtaCard
