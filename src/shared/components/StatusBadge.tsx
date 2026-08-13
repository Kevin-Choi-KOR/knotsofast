'use client'

import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { VoyageStatus, VesselStatus } from '@/shared/types'

const BASE_CLASS = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'

const VOYAGE_CLASS: Record<VoyageStatus, string> = {
  preparing: 'bg-slate-100 text-slate-600',
  underway: 'bg-blue-100 text-blue-700',
  delayed: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

export function VoyageBadge({ status }: { status: VoyageStatus }) {
  const { t } = useLanguage()
  return <span className={cn(BASE_CLASS, VOYAGE_CLASS[status])}>{t.status[status]}</span>
}

const VESSEL_CLASS: Record<VesselStatus, string> = {
  active: 'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  idle: 'bg-slate-100 text-slate-600',
}

export function VesselBadge({ status }: { status: VesselStatus }) {
  const { t } = useLanguage()
  return <span className={cn(BASE_CLASS, VESSEL_CLASS[status])}>{t.status[status]}</span>
}

type RiskLevel = 'high' | 'medium' | 'low'

const RISK_CLASS: Record<RiskLevel, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-[#6366f1]/10 text-[#6366f1]',
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { t } = useLanguage()
  return <span className={cn(BASE_CLASS, RISK_CLASS[level])}>{t.status[level]}</span>
}
