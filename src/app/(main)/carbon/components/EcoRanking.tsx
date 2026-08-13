import { Medal } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { formatKrwCompact, formatSignedPct } from '@/shared/utils/carbon'
import { CARBON_PRICE_KRW_PER_TON } from '@/mocks/carbon'
import { useLanguage } from '@/features/i18n/LanguageContext'

export interface EcoRankingRow {
  vesselId: string
  vesselName: string
  co2SavedPct: number
  co2SavedTon: number
  isCurrent: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

export function EcoRanking({ rows, rank, total }: { rows: EcoRankingRow[]; rank: number; total: number }) {
  const { t } = useLanguage()

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-[#6366f1]/5 to-purple-500/5 p-5 lg:border-l lg:border-slate-200 lg:pl-5 dark:from-[#6366f1]/10 dark:to-purple-500/10 dark:lg:border-slate-800">
      <div className="flex items-center gap-2">
        <Medal className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold">{t.carbon.rankTitle}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 px-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-5 shrink-0" />
          <span>{t.carbon.rankColVessel}</span>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="w-24 text-right">{t.carbon.rankColSaved}</span>
          <span className="w-24 text-right">{t.carbon.rankColValue}</span>
        </div>
      </div>

      <div className="mt-1.5 space-y-1.5">
        {rows.map((row, i) => (
          <div
            key={row.vesselId}
            className={cn(
              'flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900',
              row.isCurrent && 'border-[#6366f1] ring-1 ring-[#6366f1]/30',
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs">{MEDALS[i] ?? i + 1}</span>
              <span
                className={cn(
                  'max-w-[180px] truncate text-sm',
                  row.isCurrent ? 'font-medium text-[#6366f1]' : 'text-slate-600 dark:text-slate-300',
                )}
              >
                {row.vesselName}
                {row.isCurrent && ` (${t.carbon.rankCurrentTag})`}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="w-24 text-right font-mono text-sm font-semibold">
                {formatSignedPct(row.co2SavedPct, t.carbon.pctSaved, t.carbon.pctIncreased)}
              </span>
              <span className="w-24 text-right font-mono text-sm font-semibold text-[#10B981]">
                {formatKrwCompact(row.co2SavedTon * CARBON_PRICE_KRW_PER_TON)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
        {t.carbon.rankSummary(String(rank), String(total))}
      </p>
      <p className="mt-auto pt-3 text-[10px] text-slate-500 dark:text-slate-400">{t.carbon.rankValueDisclaimer}</p>
    </div>
  )
}

export default EcoRanking
