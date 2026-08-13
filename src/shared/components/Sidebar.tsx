'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Ship,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FlaskConical,
  CalendarDays,
  Anchor,
  Users,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useAuth } from '@/features/auth/AuthContext'
import { useLanguage } from '@/features/i18n/LanguageContext'
import type { Translations } from '@/features/i18n/translations'
import type { UserRole } from '@/shared/types'

const COLLAPSE_STORAGE_KEY = 'ksf-sidebar-collapsed'

type LabelKey = keyof Translations['nav']

interface EmojiIcon {
  kind: 'emoji'
  base: string
  hover: string
  animation: 'crossfade' | 'bounce'
  colorClass: string
}

interface LucideIcon {
  kind: 'lucide'
  Icon: typeof FlaskConical
}

interface MenuItem {
  href: string
  labelKey: LabelKey
  icon: EmojiIcon | LucideIcon
  roles: UserRole[]
}

const MENU_ITEMS: MenuItem[] = [
  {
    href: '/dashboard',
    labelKey: 'dashboard',
    icon: { kind: 'emoji', base: '🚢', hover: '🌍', animation: 'crossfade', colorClass: 'text-blue-600' },
    roles: ['ADMIN', 'LOGISTICS', 'CAPTAIN', 'CLIENT'],
  },
  {
    href: '/ai-report',
    labelKey: 'aiReport',
    icon: { kind: 'emoji', base: '✨', hover: '✨', animation: 'bounce', colorClass: 'text-yellow-600' },
    roles: ['ADMIN', 'LOGISTICS', 'CAPTAIN'],
  },
  {
    href: '/carbon',
    labelKey: 'carbon',
    icon: { kind: 'emoji', base: '🍃', hover: '🌳', animation: 'crossfade', colorClass: 'text-green-600' },
    roles: ['ADMIN', 'LOGISTICS'],
  },
  {
    href: '/simulation',
    labelKey: 'simulation',
    icon: { kind: 'lucide', Icon: FlaskConical },
    roles: ['ADMIN', 'LOGISTICS'],
  },
  {
    href: '/schedule',
    labelKey: 'schedule',
    icon: { kind: 'lucide', Icon: CalendarDays },
    roles: ['ADMIN', 'LOGISTICS'],
  },
  {
    href: '/vessel',
    labelKey: 'vessel',
    icon: { kind: 'lucide', Icon: Anchor },
    roles: ['ADMIN', 'LOGISTICS', 'CAPTAIN'],
  },
  {
    href: '/admin/users',
    labelKey: 'users',
    icon: { kind: 'lucide', Icon: Users },
    roles: ['ADMIN'],
  },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

function MenuIcon({ item, active }: { item: MenuItem; active: boolean }) {
  if (item.icon.kind === 'lucide') {
    const { Icon } = item.icon
    return <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#6366f1]' : '')} />
  }

  const { base, hover, animation, colorClass } = item.icon
  return (
    <span className={cn('nav-emoji-nudge inline-flex w-4 h-4 shrink-0 items-center justify-center', colorClass)}>
      {animation === 'crossfade' ? (
        <span className="relative inline-block w-4 h-4 text-sm leading-none">
          <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
            {base}
          </span>
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {hover}
          </span>
        </span>
      ) : (
        <span className="inline-block text-sm leading-none group-hover:animate-bounce">{base}</span>
      )}
    </span>
  )
}

function Tooltip({ label, anchor }: { label: string; anchor: DOMRect }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      className="pointer-events-none fixed z-50 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-slate-700"
      style={{ top: anchor.top + anchor.height / 2, left: anchor.right + 8, transform: 'translateY(-50%)' }}
    >
      {label}
    </div>,
    document.body,
  )
}

function Logo({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2 border-b border-slate-100 px-4 py-4 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900',
        collapsed && 'justify-center px-0',
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]">
        <Ship className="h-4 w-4 text-white" />
      </span>
      {!collapsed && <span className="text-sm font-bold whitespace-nowrap">KNOT SO FAST</span>}
    </Link>
  )
}

function NavLink({
  item,
  active,
  label,
  collapsed,
  onNavigate,
}: {
  item: MenuItem
  active: boolean
  label: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  const linkRef = useRef<HTMLAnchorElement>(null)
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative">
      <Link
        ref={linkRef}
        href={item.href}
        onClick={onNavigate}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
          collapsed && 'justify-center px-0',
          active
            ? 'bg-[#f5f7ff] font-semibold text-[#6366f1] dark:bg-[#6366f1]/15'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        )}
      >
        <MenuIcon item={item} active={active} />
        {!collapsed && <span className="whitespace-nowrap">{label}</span>}
      </Link>
      {collapsed && hovered && linkRef.current && (
        <Tooltip label={label} anchor={linkRef.current.getBoundingClientRect()} />
      )}
    </div>
  )
}

function NavList({
  items,
  pathname,
  t,
  collapsed,
  onNavigate,
}: {
  items: MenuItem[]
  pathname: string
  t: Translations
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(pathname, item.href)}
          label={t.nav[item.labelKey]}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  )
}

export function Sidebar() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()

  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSE_STORAGE_KEY)
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next))
      return next
    })
  }

  const items = MENU_ITEMS.filter((item) => !!user && item.roles.includes(user.role))

  return (
    <>
      {/* 데스크톱 */}
      <aside
        className={cn(
          'hidden h-screen shrink-0 flex-col overflow-hidden border-r border-slate-100 bg-white transition-all duration-200 lg:flex dark:border-slate-800 dark:bg-[#0B192C]',
          collapsed ? 'w-16' : 'w-56',
        )}
      >
        <Logo collapsed={collapsed} />
        <NavList items={items} pathname={pathname} t={t} collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center gap-2 border-t border-slate-100 px-3 py-3 text-sm text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:hover:text-slate-100',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>{t.nav.collapse}</span>
            </>
          )}
        </button>
      </aside>

      {/* 모바일 헤더 + 드로어 */}
      <div className="fixed top-0 left-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-100 bg-white px-4 lg:hidden dark:border-slate-800 dark:bg-[#0B192C]">
        <Logo collapsed={false} onNavigate={() => router.push('/dashboard')} />
        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          className="p-2 text-slate-600 dark:text-slate-300"
        >
          {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-30 flex lg:hidden">
          <div className="flex w-56 flex-col bg-white pt-14 dark:bg-[#0B192C]">
            <NavList
              items={items}
              pathname={pathname}
              t={t}
              collapsed={false}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
        </div>
      )}
    </>
  )
}

export default Sidebar
