'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/shared/components/PageHeader'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { useAuth } from '@/features/auth/AuthContext'
import { useUsers } from '@/shared/hooks/useUsers'
import { useVessels } from '@/shared/hooks/useVessels'
import { OWN_COMPANY_NAME } from '@/shared/constants'
import { RoleSummaryCards } from './_components/RoleSummaryCards'
import { UserFilterBar } from './_components/UserFilterBar'
import { UserTable } from './_components/UserTable'
import { UserModal } from './_components/UserModal'
import type { User, UserRole } from '@/shared/types'

interface ModalState {
  open: boolean
  mode: 'create' | 'view'
  user: User | null
}

export default function Page() {
  const { t } = useLanguage()
  const { user: currentUser } = useAuth()
  const { users, mutate: mutateUsers } = useUsers()
  const { vessels } = useVessels()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create', user: null })

  const ownVessels = useMemo(() => vessels.filter((v) => v.company === OWN_COMPANY_NAME), [vessels])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesSearch = search === '' || u.name.includes(search) || u.email.includes(search)
      return matchesRole && matchesSearch
    })
  }, [users, roleFilter, search])

  async function toggleActive(id: string) {
    const user = users.find((u) => u.id === id)
    if (!user) return
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    })
    await mutateUsers()
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t.users.title} subtitle={t.users.subtitle}>
        <button
          type="button"
          onClick={() => setModal({ open: true, mode: 'create', user: null })}
          className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4f46e5]"
        >
          <Plus className="h-4 w-4" />
          {t.users.addUser}
        </button>
      </PageHeader>

      <RoleSummaryCards users={users} />

      <UserFilterBar search={search} onSearchChange={setSearch} roleFilter={roleFilter} onRoleFilterChange={setRoleFilter} />

      <div className="flex-1 overflow-auto px-6 py-4">
        <UserTable
          users={filtered}
          vessels={vessels}
          onRowClick={(u) => setModal({ open: true, mode: 'view', user: u })}
          onToggleActive={toggleActive}
        />
      </div>

      {modal.open && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          currentUserId={currentUser?.id}
          ownVessels={ownVessels}
          onClose={() => setModal({ open: false, mode: 'create', user: null })}
          mutateUsers={mutateUsers}
        />
      )}
    </div>
  )
}
