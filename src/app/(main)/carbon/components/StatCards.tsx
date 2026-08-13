import type { ReactNode } from 'react'
import { Award, Fuel, Leaf, TrendingDown } from 'lucide-react'
import { formatNumber } from '@/shared/utils/format'
import { formatSignedPct, type CiiGrade } from '@/shared/utils/carbon'
import { useLanguage } from '@/features/i18n/LanguageContext'

interface StatCardsProps {
  ciiScore: number
  ciiGrade: CiiGrade
  totalCo2Ton: number
  totalFuelTon: number
  vsBenchmarkPct: number
}

function StatCard({
  icon,
  iconClass,
  value,
  description,
}: {
  icon: ReactNode
  iconClass: string
  value: string
  description: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 ${iconClass}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-base font-bold">{value}</div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">{description}</div>
      </div>
    </div>
  )
}

export function StatCards({ ciiScore, ciiGrade, totalCo2Ton, totalFuelTon, vsBenchmarkPct }: StatCardsProps) {
  const { t } = useLanguage()

  return (
    <div className="grid grid-cols-4 gap-3">
      <StatCard
        icon={<Award className="h-4 w-4" />}
        iconClass="text-orange-600"
        value={ciiScore.toFixed(2)}
        description={`${t.carbon.ciiScore} · ${t.carbon.grade} ${ciiGrade}`}
      />
      <StatCard
        icon={<Leaf className="h-4 w-4" />}
        iconClass="text-green-600"
        value={`${formatNumber(totalCo2Ton / 1000, 1)} k ton`}
        description={`${t.carbon.totalCo2} · ${t.carbon.curVoyage}`}
      />
      <StatCard
        icon={<Fuel className="h-4 w-4" />}
        iconClass="text-[#6366f1]"
        value={`${formatNumber(totalFuelTon / 1000, 1)} k ton`}
        description={`${t.carbon.totalFuel} · ${t.carbon.hfoBase}`}
      />
      <StatCard
        icon={<TrendingDown className="h-4 w-4" />}
        iconClass="text-purple-600"
        value={formatSignedPct(vsBenchmarkPct, t.carbon.pctSaved, t.carbon.pctExceeded)}
        description={t.carbon.vsBenchmark}
      />
    </div>
  )
}

export default StatCards
