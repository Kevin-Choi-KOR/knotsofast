'use client'

import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { ROLE_ICON, ROLE_COLOR_CLASS } from './roleConfig'
import type { UserRole } from '@/shared/types'

export function RoleBadge({ role }: { role: UserRole }) {
  const { t } = useLanguage()
  const Icon = ROLE_ICON[role]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
        ROLE_COLOR_CLASS[role],
      )}
    >
      <Icon className="h-3 w-3" />
      {t.role[role]}
    </span>
  )
}
