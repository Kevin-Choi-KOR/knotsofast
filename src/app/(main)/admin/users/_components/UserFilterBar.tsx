'use client'

import { Search } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { ROLE_ORDER } from './roleConfig'
import type { UserRole } from '@/shared/types'

export function UserFilterBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: {
  search: string
  onSearchChange: (v: string) => void
  roleFilter: UserRole | 'all'
  onRoleFilterChange: (v: UserRole | 'all') => void
}) {
  const { t } = useLanguage()

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-6 py-3 sm:flex-row dark:border-slate-800 dark:bg-slate-900">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.users.searchPlaceholder}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm focus:ring-2 focus:ring-[#6366f1] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(['all', ...ROLE_ORDER] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onRoleFilterChange(value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
              roleFilter === value
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400',
            )}
          >
            {value === 'all' ? t.common.all : t.role[value]}
          </button>
        ))}
      </div>
    </div>
  )
}
