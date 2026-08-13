import { cn } from '@/shared/utils/cn'
import { CII_COLORS, CII_GRADES, type CiiGrade } from '@/shared/utils/carbon'
import { useLanguage } from '@/features/i18n/LanguageContext'

export function CiiGauge({ score, grade }: { score: number; grade: CiiGrade }) {
  const { t } = useLanguage()
  const gradeIdx = CII_GRADES.indexOf(grade)
  const nextGrade = gradeIdx > 0 ? CII_GRADES[gradeIdx - 1] : null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 text-sm font-semibold">{t.carbon.gaugeTitle}</div>

      <div className="flex items-baseline justify-center gap-2">
        <span className="text-4xl font-extrabold" style={{ color: CII_COLORS[grade] }}>
          {grade}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">· CII {score.toFixed(2)}</span>
      </div>

      <div className="mt-2.5 grid grid-cols-5">
        {CII_GRADES.map((g) => (
          <div key={g} className="flex justify-center text-xs leading-none" style={{ color: CII_COLORS[g] }}>
            {g === grade ? '▼' : ' '}
          </div>
        ))}
      </div>

      <div className="grid h-11 grid-cols-5 overflow-hidden rounded-lg shadow-inner">
        {CII_GRADES.map((g) => (
          <div
            key={g}
            className={cn(
              'flex items-center justify-center text-sm font-bold text-white transition-transform',
              g === grade ? 'z-10 scale-y-110 opacity-100 ring-2 ring-inset ring-white/70' : 'opacity-35',
            )}
            style={{ backgroundColor: CII_COLORS[g] }}
          >
            {g}
          </div>
        ))}
      </div>

      <div className="mt-2.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
        {nextGrade ? t.carbon.gaugeNextGrade(nextGrade) : t.carbon.gaugeBestGrade}
      </div>
    </div>
  )
}

export default CiiGauge
