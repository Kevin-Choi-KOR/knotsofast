'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { User, UserRole } from '@/shared/types'
import { SWR_CACHE_STORAGE_KEY } from '@/shared/constants'
import { clearSWRCache } from '@/shared/swr/cache'

const STORAGE_KEY = 'ksf_user'
const AUTH_EVENT = 'ksf-auth-change'

// 원본 문자열이 같으면 이전 파싱 결과를 재사용해 참조를 안정화한다.
// 그렇지 않으면 useSyncExternalStore가 매 호출마다 새 객체를 받아 무한 리렌더 경고를 낸다.
let cachedRaw: string | null = null
let cachedUser: User | null = null

function parseUser(raw: string | null): User | null {
  if (raw === cachedRaw) return cachedUser
  cachedRaw = raw
  if (!raw) {
    cachedUser = null
    return null
  }
  try {
    cachedUser = JSON.parse(raw) as User
  } catch {
    cachedUser = null
  }
  return cachedUser
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(AUTH_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(AUTH_EVENT, callback)
  }
}

function getSnapshot(): User | null {
  return parseUser(localStorage.getItem(STORAGE_KEY))
}

function getServerSnapshot(): User | null {
  return null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // useSyncExternalStore는 하이드레이션 직후 첫 렌더에서 서버 스냅샷(null)을 쓰고, 실제
  // localStorage 값은 그다음 렌더에 반영된다. loading을 곧바로 false로 내보내면 인증 가드가
  // user === null 상태에서 먼저 판단해 /login으로 리다이렉트해 버린다.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) return false
    const body = await res.json()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(body.user))
    window.dispatchEvent(new Event(AUTH_EVENT))
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SWR_CACHE_STORAGE_KEY)
    clearSWRCache()
    window.dispatchEvent(new Event(AUTH_EVENT))
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.role),
    [user],
  )

  return (
    <AuthContext.Provider value={{ user, loading: !mounted, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
