'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { ROLE_ORDER } from './roleConfig'
import type { User, UserRole, Vessel } from '@/shared/types'

interface FormState {
  name: string
  email: string
  password: string
  role: UserRole
  department: string
  assignedVesselIds: string[]
  active: boolean
}

function initialForm(user: User | null): FormState {
  if (user) {
    return {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department ?? '',
      assignedVesselIds: user.assignedVesselIds ?? [],
      active: user.active,
    }
  }
  return {
    name: '',
    email: '',
    password: '',
    role: ROLE_ORDER[0],
    department: '',
    assignedVesselIds: [],
    active: true,
  }
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800'

export function UserModal({
  mode,
  user,
  currentUserId,
  ownVessels,
  onClose,
  mutateUsers,
}: {
  mode: 'create' | 'view'
  user: User | null
  currentUserId: string | undefined
  ownVessels: Vessel[]
  onClose: () => void
  mutateUsers: () => Promise<unknown>
}) {
  const { t } = useLanguage()
  const [form, setForm] = useState<FormState>(() => initialForm(user))
  const [emailError, setEmailError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const isEditing = mode === 'view' && !!user
  const isSelf = isEditing && currentUserId === user!.id

  function toggleVessel(id: string) {
    setForm((prev) => ({
      ...prev,
      assignedVesselIds: prev.assignedVesselIds.includes(id)
        ? prev.assignedVesselIds.filter((v) => v !== id)
        : [...prev.assignedVesselIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)

    const body: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      role: form.role,
      department: form.department,
      active: form.active,
    }
    if (form.role === 'CAPTAIN' && form.assignedVesselIds.length > 0) {
      body.assignedVesselIds = form.assignedVesselIds
    }

    if (!isEditing) {
      body.id = `u${Date.now()}`
      body.password = form.password
    } else if (form.password.length > 0) {
      body.password = form.password
    }

    setSubmitting(true)
    const res = await fetch(isEditing ? `/api/users/${user!.id}` : '/api/users', {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSubmitting(false)

    if (!res.ok) {
      if (res.status === 409) setEmailError(t.users.emailTaken)
      return
    }

    await mutateUsers()
    onClose()
  }

  async function handleDelete() {
    if (!user) return
    await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    await mutateUsers()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="text-sm font-semibold">{isEditing ? user!.name : t.users.addUser}</div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form id="user-form" onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={t.users.namePlaceholder}
            className={inputClass}
          />

          <div>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder={t.users.emailPlaceholder}
              className={inputClass}
            />
            {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
          </div>

          <input
            type="password"
            required={!isEditing}
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={isEditing ? t.users.newPasswordPlaceholder : t.users.passwordPlaceholder}
            className={inputClass}
          />

          <select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
            className={inputClass}
          >
            {ROLE_ORDER.map((role) => (
              <option key={role} value={role}>
                {t.role[role]}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={form.department}
            onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
            placeholder={t.users.deptPlaceholder}
            className={inputClass}
          />

          {form.role === 'CAPTAIN' && (
            <div>
              <div className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t.users.assignedVessels}
              </div>
              <div className="space-y-1 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                {ownVessels.map((v) => (
                  <label key={v.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.assignedVesselIds.includes(v.id)}
                      onChange={() => toggleVessel(v.id)}
                    />
                    {v.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            {t.status.enabled}
          </label>

          {isEditing && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              {isSelf ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.users.cannotDeleteSelf}</p>
              ) : confirmingDelete ? (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 dark:text-slate-300">{t.users.deleteConfirm}</span>
                  <button type="button" onClick={handleDelete} className="font-medium text-red-600 hover:underline">
                    {t.users.deleteUser}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="text-slate-500 hover:underline dark:text-slate-400"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  {t.users.deleteUser}
                </button>
              )}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={submitting}
            className="rounded-lg bg-[#6366f1] px-4 py-2 text-sm text-white hover:bg-[#4f46e5] disabled:opacity-60"
          >
            {isEditing ? t.common.save : t.users.addUser}
          </button>
        </div>
      </div>
    </div>
  )
}
