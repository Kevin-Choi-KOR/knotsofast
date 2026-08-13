'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Moon, LogOut } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useAuth } from '@/features/auth/AuthContext'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { useTheme } from '@/features/theme/ThemeContext'

function Divider() {
  return <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
}

function LanguageToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="flex items-center rounded-full bg-slate-100 p-0.5 text-xs font-medium dark:bg-slate-800">
      {(['ko', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            'rounded-full px-2 py-1 uppercase transition-colors',
            lang === l
              ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
              : 'text-slate-500',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-base font-bold whitespace-nowrap">{title}</span>
        {subtitle && (
          <>
            <span className="hidden text-slate-300 sm:inline dark:text-slate-600">·</span>
            <span className="hidden truncate text-sm text-slate-500 sm:block dark:text-slate-400">{subtitle}</span>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {children}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-700">
          <LanguageToggle />
          <Divider />
          <ThemeToggle />
          <Divider />
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6366f1]/10 text-sm font-bold text-[#6366f1]">
              {user?.name?.charAt(0) ?? ''}
            </span>
            <span className="hidden max-w-40 truncate text-sm md:block">{user?.name}</span>
          </div>
          <Divider />
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PageHeader
