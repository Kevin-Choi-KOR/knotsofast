'use client'

import { useLanguage } from '@/features/i18n/LanguageContext'
import { ROLE_ORDER, ROLE_ICON, ROLE_COLOR_CLASS } from './roleConfig'
import type { User } from '@/shared/types'

export function RoleSummaryCards({ users }: { users: User[] }) {
  const { t } = useLanguage()

  const roleCounts = { ADMIN: 0, LOGISTICS: 0, CAPTAIN: 0, CLIENT: 0 }
  for (const u of users) roleCounts[u.role]++

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ROLE_ORDER.map((role) => {
          const Icon = ROLE_ICON[role]
          return (
            <div
              key={role}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-800"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ROLE_COLOR_CLASS[role]}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-lg font-bold">{roleCounts[role]}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{t.role[role]}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
