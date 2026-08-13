'use client'

import { UserCheck, UserX } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { RoleBadge } from './RoleBadge'
import type { User, Vessel } from '@/shared/types'

function assignedVesselLabel(user: User, vessels: Vessel[]): string {
  const names = user.assignedVesselIds
    ?.map((id) => vessels.find((v) => v.id === id)?.name)
    .filter(Boolean) as string[] | undefined
  return names && names.length > 0 ? names.join(', ') : '—'
}

export function UserTable({
  users,
  vessels,
  onRowClick,
  onToggleActive,
}: {
  users: User[]
  vessels: Vessel[]
  onRowClick: (user: User) => void
  onToggleActive: (id: string) => void
}) {
  const { t } = useLanguage()

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.users.colUser}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.users.colRole}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.users.colDept}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.users.colVessel}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.users.colStatus}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.users.colAction}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((user) => (
            <tr
              key={user.id}
              onClick={() => onRowClick(user)}
              className={cn(
                'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40',
                !user.active && 'opacity-50',
              )}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold dark:bg-slate-700">
                    {user.name.charAt(0)}
                  </span>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-4 py-3 text-xs">{user.department ?? '-'}</td>
              <td className="px-4 py-3 text-xs">{assignedVesselLabel(user, vessels)}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    user.active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                  )}
                >
                  {user.active ? t.status.enabled : t.status.disabled}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleActive(user.id)
                  }}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {user.active ? (
                    <>
                      <UserX className="h-3 w-3" />
                      {t.users.deactivate}
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3 w-3" />
                      {t.users.activate}
                    </>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
