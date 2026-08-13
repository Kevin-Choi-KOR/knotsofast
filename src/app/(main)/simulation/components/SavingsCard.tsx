import { cn } from '@/shared/utils/cn'
import type { SavingResult } from '@/shared/utils/simulation'
import { useLanguage } from '@/features/i18n/LanguageContext'

function directionClass(value: number): string {
  return value >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'
}

export function SavingsCard({ saving }: { saving: SavingResult }) {
  const { t } = useLanguage()
  const borderClass = saving.cost >= 0 ? 'border-green-200' : 'border-red-200'
  const suffix = (v: number) => (v >= 0 ? t.simulation.savingSuffix : t.simulation.excessSuffix)

  return (
    <div className={cn('rounded-xl border bg-transparent p-4', borderClass, 'dark:bg-slate-900')}>
      <div className="text-sm font-semibold">{t.simulation.savingTitle}</div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-lg">⛽</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.simulation.fuel}</div>
          <div className={cn('mt-0.5 text-lg font-bold whitespace-nowrap', directionClass(saving.fuel))}>
            {Math.abs(saving.fuel).toFixed(0)} ton {suffix(saving.fuel)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg">💰</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.simulation.cost}</div>
          <div className={cn('mt-0.5 text-lg font-bold whitespace-nowrap', directionClass(saving.cost))}>
            ${Math.abs(saving.cost / 1000).toFixed(0)}k {suffix(saving.cost)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg">🌱</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">CO₂</div>
          <div className={cn('mt-0.5 text-lg font-bold whitespace-nowrap', directionClass(saving.co2))}>
            {Math.abs(saving.co2).toFixed(0)} ton {suffix(saving.co2)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SavingsCard
