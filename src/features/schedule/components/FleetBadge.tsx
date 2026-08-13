'use client'

import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { FleetType } from '@/shared/utils/fleet'

const BASE_CLASS = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'

const FLEET_CLASS: Record<FleetType, string> = {
  own: 'bg-[#6366f1]/10 text-[#6366f1]',
  partner: 'bg-emerald-100 text-emerald-700',
  other: 'bg-slate-100 text-slate-600',
}

/** 선단 구분 배지 — 필터 UI에서는 other를 뺐지만(4.2장), 배지는 3종을 모두 쓴다(4.3장). */
export function FleetBadge({ type, className }: { type: FleetType; className?: string }) {
  const { t } = useLanguage()
  const label = { own: t.common.fleetOwn, partner: t.common.fleetPartner, other: t.common.fleetOther }[type]
  return <span className={cn(BASE_CLASS, FLEET_CLASS[type], className)}>{label}</span>
}

export default FleetBadge
