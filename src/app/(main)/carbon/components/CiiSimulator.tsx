import { ShieldCheck, Trophy } from 'lucide-react'
import { CII_COLORS, type CiiGrade } from '@/shared/utils/carbon'
import { useLanguage } from '@/features/i18n/LanguageContext'

interface CiiSimulatorProps {
  currentGrade: CiiGrade
  optimizedGrade: CiiGrade
  plannedSpeedKnots: number
  recommendedSpeedKnots: number
  avoidedGrade: CiiGrade
  complianceAmountLabel: string
}

export function CiiSimulator({
  currentGrade,
  optimizedGrade,
  plannedSpeedKnots,
  recommendedSpeedKnots,
  avoidedGrade,
  complianceAmountLabel,
}: CiiSimulatorProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-2">
        <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <div className="text-sm font-semibold">{t.carbon.ciiSimTitle}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.carbon.ciiSimDesc}</div>
        </div>
      </div>

      <div className="my-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.carbon.ciiSimCurrentLabel}</div>
          <div className="text-2xl font-bold" style={{ color: CII_COLORS[currentGrade] }}>
            {currentGrade}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{t.carbon.ciiSimBaseline}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{plannedSpeedKnots} kts</div>
        </div>
        <div
          className="rounded-lg border p-2.5 text-center"
          style={{ borderColor: 'rgba(16,185,129,0.4)', backgroundColor: 'rgba(16,185,129,0.05)' }}
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.carbon.ciiSimOptimizedLabel}</div>
          <div className="text-2xl font-bold" style={{ color: CII_COLORS[optimizedGrade] }}>
            {optimizedGrade}
          </div>
          <div className="text-[10px] font-semibold text-[#10B981]">{t.carbon.ciiSimRiskGood}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{recommendedSpeedKnots} kts</div>
        </div>
      </div>

      <div className="mt-auto flex items-start gap-2 rounded-lg bg-[#10B981]/10 p-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#10B981]" />
        <div className="text-[11px] text-slate-700 dark:text-slate-300">
          {t.carbon.ciiSimCompliance(avoidedGrade, complianceAmountLabel)}
        </div>
      </div>
    </div>
  )
}

export default CiiSimulator
