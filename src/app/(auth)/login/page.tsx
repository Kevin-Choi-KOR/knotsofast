'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Ship, Sun, Moon } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { formatTonFixed, fuelEmissionFactor } from '@/shared/utils/format'
import { useAuth } from '@/features/auth/AuthContext'
import { useLanguage } from '@/features/i18n/LanguageContext'
import { useTheme } from '@/features/theme/ThemeContext'
import { useCountUp } from '@/features/auth/useCountUp'
import { DEMO_ACCOUNTS } from '@/mocks/users'
import { MOCK_FLEET_ECO_RANKING } from '@/mocks/carbon'
import type { Translations } from '@/features/i18n/translations'
import type { UserRole } from '@/shared/types'

const HERO_IMAGES = [
  '/images/login/1.jpg',
  '/images/login/2.jpg',
  '/images/login/3.jpg',
  '/images/login/4.jpg',
  '/images/login/5.jpg',
]
const HERO_INTERVAL_MS = 6000

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  LOGISTICS: 'bg-[#6366f1]/15 text-[#6366f1] dark:bg-[#6366f1]/20',
  CAPTAIN: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CLIENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

// CO₂에서 연료를 역산한다 — 함대 랭킹 목업이 특정 항차·연료 종류에 묶여 있지 않기 때문에
// 탄소 화면과 동일한 공식(CO₂ = 연료 × 배출계수)을 기본 연료(HFO) 기준으로 뒤집어 쓴다.
function computeFleetSavings() {
  const totalCo2SavedTon = MOCK_FLEET_ECO_RANKING.reduce((sum, r) => sum + r.co2SavedTon, 0)
  const totalFuelSavedTon = totalCo2SavedTon / fuelEmissionFactor('HFO')
  return { totalCo2SavedTon, totalFuelSavedTon }
}

function LanguageToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="flex items-center rounded-md bg-slate-100 p-0.5 text-xs font-medium dark:bg-slate-800">
      {(['ko', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            'rounded px-2 py-1 uppercase transition-colors',
            lang === l
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
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
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

function HeroPanel({ t }: { t: Translations }) {
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_IMAGES.length), HERO_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const { totalCo2SavedTon, totalFuelSavedTon } = computeFleetSavings()
  const co2 = useCountUp(totalCo2SavedTon)
  const fuel = useCountUp(totalFuelSavedTon)

  return (
    <div className="relative hidden overflow-hidden border-r border-white/10 bg-[#0B192C] p-12 lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center">
      {HERO_IMAGES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="50vw"
          priority={i === 0}
          className={cn(
            'object-cover transition-opacity duration-1000 ease-in-out',
            i === heroIndex ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0B192C]/55 via-[#0B192C]/30 to-[#0B192C]/65" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(11,25,44,0.45) 0%, rgba(11,25,44,0) 60%)',
        }}
      />

      <div
        className="relative z-10 w-[36rem] max-w-full text-center"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.85), 0 4px 18px rgba(0,0,0,0.6)' }}
      >
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366f1] shadow-lg shadow-black/40">
            <Ship className="h-8 w-8 text-white" />
          </span>
          <span className="text-2xl font-bold tracking-tight text-white">KNOT SO FAST</span>
        </div>

        <h1 className="mb-4 text-2xl leading-tight font-semibold text-white">{t.login.heroTitle}</h1>
        <p className="mx-auto max-w-sm leading-relaxed whitespace-pre-line text-slate-200">
          {t.login.heroSub}
        </p>

        <div className="mt-12 grid grid-cols-3 gap-3">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35 px-2 py-4 backdrop-blur-sm">
            <div className="text-xl font-bold tabular-nums whitespace-nowrap text-[#818cf8]">
              {formatTonFixed(co2, 1)}
            </div>
            <div className="mt-1 text-xs text-slate-200">{t.login.stat1Label}</div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35 px-2 py-4 backdrop-blur-sm">
            <div className="text-xl font-bold tabular-nums whitespace-nowrap text-[#818cf8]">
              {formatTonFixed(fuel, 1)}
            </div>
            <div className="mt-1 text-xs text-slate-200">{t.login.stat2Label}</div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35 px-2 py-4 backdrop-blur-sm">
            <div className="text-xl font-bold tabular-nums whitespace-nowrap text-[#818cf8]">
              {t.login.stat3Value}
            </div>
            <div className="mt-1 text-xs text-slate-200">{t.login.stat3Label}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { t } = useLanguage()
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ok = await login(email, password)
    if (ok) {
      // 곧바로 화면을 벗어나므로 loading은 되돌리지 않는다 — 중복 제출 방지.
      router.push('/dashboard')
    } else {
      setError(t.login.error)
      setLoading(false)
    }
  }

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <HeroPanel t={t} />

      <div className="flex flex-1 items-center justify-center bg-[#f8f9ff] p-8 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:mb-0">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1]">
                <Ship className="h-5 w-5 text-white" />
              </span>
              <span className="text-base font-bold">KNOT SO FAST</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          <h2 className="mt-6 mb-1 text-2xl font-bold lg:mt-0">{t.login.title}</h2>
          <p className="mb-8 text-sm text-slate-500">{t.login.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t.login.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.login.emailPlaceholder}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t.login.password}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#6366f1] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4f46e5] disabled:opacity-50"
            >
              {loading ? t.login.loading : t.login.submit}
            </button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-2">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-500">{t.login.demoLabel}</span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-[#6366f1]/60 hover:bg-[#6366f1]/10 dark:border-slate-700 dark:bg-slate-800"
                >
                  <span
                    className={cn(
                      'inline-block rounded px-1.5 py-0.5 text-xs font-medium',
                      ROLE_BADGE_CLASS[account.role],
                    )}
                  >
                    {t.role[account.role]}
                  </span>
                  <div className="mt-1 truncate text-xs text-slate-500">{account.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
