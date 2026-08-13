import { Anchor } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { AnchorCarbonChart } from './AnchorCarbonChart'

export interface AnchorScenarioTotals {
  sailingCo2Ton: number
  anchorCo2Ton: number
}

interface AnchorCarbonProps {
  baseline: AnchorScenarioTotals
  optimized: AnchorScenarioTotals
  savedTon: number
}

export function AnchorCarbon({ baseline, optimized, savedTon }: AnchorCarbonProps) {
  const { t } = useLanguage()

  const baselineTotal = baseline.sailingCo2Ton + baseline.anchorCo2Ton
  const optimizedTotal = optimized.sailingCo2Ton + optimized.anchorCo2Ton

  const rows = [
    {
      label: t.carbon.anchorBaselineLabel,
      sailing: baseline.sailingCo2Ton,
      anchor: baseline.anchorCo2Ton,
      total: baselineTotal,
      highlight: false,
    },
    {
      label: t.carbon.anchorOptimizedLabel,
      sailing: optimized.sailingCo2Ton,
      anchor: optimized.anchorCo2Ton,
      total: optimizedTotal,
      highlight: true,
    },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/5">
          <Anchor className="h-4 w-4 text-red-500" />
        </span>
        <div>
          <div className="text-sm font-semibold">{t.carbon.anchorTitle}</div>
          <p className="mt-1 max-w-2xl text-xs text-slate-500 dark:text-slate-400">{t.carbon.anchorDesc}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <AnchorCarbonChart
          baseline={{ label: t.carbon.anchorBaselineLabel, ...baseline }}
          optimized={{ label: t.carbon.anchorOptimizedLabel, ...optimized }}
        />

        <div className="self-start overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="px-3 py-2 text-left">{t.carbon.colScenario}</th>
                <th className="px-3 py-2 text-right">{t.carbon.colSailingCo2}</th>
                <th className="px-3 py-2 text-right">{t.carbon.colAnchorCo2}</th>
                <th className="px-3 py-2 text-right">{t.carbon.colTotalCo2}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className={cn('border-t border-slate-100 dark:border-slate-800', row.highlight && 'bg-[#10B981]/5')}
                >
                  <td className="px-3 py-2.5 text-xs">{row.label}</td>
                  <td className="px-3 py-2.5 text-right">{row.sailing.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right">{row.anchor.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold">{row.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between bg-[#10B981]/10 px-4 py-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t.carbon.anchorBaselineLabel} → {t.carbon.anchorOptimizedLabel}
            </span>
            <span className="text-sm font-bold text-[#10B981]">{t.carbon.savedLabel(savedTon.toFixed(2))}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnchorCarbon
