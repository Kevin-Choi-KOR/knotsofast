import type { ReactNode } from 'react'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/utils/cn'

export type StatCardAccent = 'default' | 'success' | 'warning' | 'danger' | 'brand'

const TEXT_CLASS: Record<StatCardAccent, string> = {
  default: 'text-slate-700 dark:text-slate-300',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
  brand: 'text-[#6366f1]',
}

const ICON_CLASS: Record<StatCardAccent, string> = {
  default: 'text-slate-400 dark:text-slate-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
  brand: 'text-[#6366f1]',
}

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string
  sublabel?: string
  accent?: StatCardAccent
  /** LT(UTC±X) 접미사 등으로 값 문자열이 길 때 기본 20px보다 한 단계 줄이기 위한 오버라이드. */
  valueClassName?: string
}

export function StatCard({ icon, label, value, sublabel, accent = 'default', valueClassName }: StatCardProps) {
  return (
    <Card className="rounded-lg px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span className={cn('shrink-0', ICON_CLASS[accent])}>{icon}</span>
        <span className="truncate text-sm text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className={cn('mt-1 font-bold', valueClassName ?? 'text-xl', TEXT_CLASS[accent])}>{value}</div>
      {sublabel && <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{sublabel}</div>}
    </Card>
  )
}

export default StatCard
