import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface HorizontalGaugeProps {
  icon: LucideIcon
  label: string
  value: string
  percent: number
  barClassName: string
}

// DASHBOARD.md 6.3장 — 카드 안에서 재사용하는 공용 가로 게이지.
export function HorizontalGauge({ icon: Icon, label, value, percent, barClassName }: HorizontalGaugeProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className="flex items-center gap-1">
      <Icon size={12} className="shrink-0 text-slate-400" />
      <span className="w-11 shrink-0 truncate text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', barClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-12 shrink-0 truncate text-right text-[10px] font-semibold whitespace-nowrap tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  )
}

export default HorizontalGauge
