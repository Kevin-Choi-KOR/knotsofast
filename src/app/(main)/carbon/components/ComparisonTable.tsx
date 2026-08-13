import { cn } from '@/shared/utils/cn'
import { CII_COLORS, type CiiGrade } from '@/shared/utils/carbon'
import { useLanguage } from '@/features/i18n/LanguageContext'

export interface ComparisonRow {
  label: string
  ciiScore: number
  grade: CiiGrade
  totalFuelTon: number
  totalCo2Ton: number
  highlight?: boolean
}

function GradeBadge({ grade }: { grade: CiiGrade }) {
  return (
    <span
      className="rounded px-2 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: CII_COLORS[grade] }}
    >
      {grade}
    </span>
  )
}

export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  const { t } = useLanguage()

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="bg-slate-50 px-5 py-3 text-sm font-semibold dark:bg-slate-800/60">{t.carbon.comparison}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            <th className="px-5 py-2 text-left">{t.carbon.colCategory}</th>
            <th className="px-5 py-2 text-right">{t.carbon.colCiiScore}</th>
            <th className="px-5 py-2 text-right">{t.carbon.colGrade}</th>
            <th className="px-5 py-2 text-right">{t.carbon.colFuel}</th>
            <th className="px-5 py-2 text-right">{t.carbon.colCo2}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className={cn(
                'border-t border-slate-100 dark:border-slate-800',
                row.highlight ? 'bg-[#6366f1]/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
              )}
            >
              <td className="px-5 py-2.5">{row.label}</td>
              <td className="px-5 py-2.5 text-right font-mono">{row.ciiScore.toFixed(2)}</td>
              <td className="px-5 py-2.5 text-right">
                <GradeBadge grade={row.grade} />
              </td>
              <td className="px-5 py-2.5 text-right">{row.totalFuelTon.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</td>
              <td className="px-5 py-2.5 text-right">{row.totalCo2Ton.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ComparisonTable
