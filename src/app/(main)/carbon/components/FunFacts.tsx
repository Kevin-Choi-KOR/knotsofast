import { Car, PartyPopper, TreePine, UtensilsCrossed } from 'lucide-react'
import { useLanguage } from '@/features/i18n/LanguageContext'

interface FunFactsProps {
  savedTon: number
  treeCount: number
  earthLaps: number
  chickenCount: number
}

export function FunFacts({ savedTon, treeCount, earthLaps, chickenCount }: FunFactsProps) {
  const { t } = useLanguage()

  return (
    <div className="flex h-full flex-col rounded-xl bg-gradient-to-br from-[#6366f1]/5 to-purple-500/5 p-5 dark:from-[#6366f1]/10 dark:to-purple-500/10">
      <div className="flex items-center gap-2">
        <PartyPopper className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold">{t.carbon.funTitle}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.carbon.funSubtitle(savedTon.toFixed(1))}</p>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
          <TreePine className="h-4 w-4 shrink-0 text-green-600" />
          <span className="text-base">{t.carbon.funTrees(treeCount.toLocaleString('ko-KR'))}</span>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
          <Car className="h-4 w-4 shrink-0 text-blue-500" />
          <span className="text-base">{t.carbon.funEarthLaps(earthLaps.toFixed(1))}</span>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
          <UtensilsCrossed className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="text-base">{t.carbon.funChicken(chickenCount.toLocaleString('ko-KR'))}</span>
        </div>
      </div>

      <p className="mt-auto pt-3 text-[10px] text-slate-500 dark:text-slate-400">{t.carbon.funDisclaimer}</p>
    </div>
  )
}

export default FunFacts
