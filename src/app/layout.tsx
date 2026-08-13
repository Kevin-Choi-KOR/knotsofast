import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SWRProvider } from '@/shared/swr/SWRProvider'
import { LanguageProvider } from '@/features/i18n/LanguageContext'
import { ThemeProvider } from '@/features/theme/ThemeContext'
import { AuthProvider } from '@/features/auth/AuthContext'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'KNOT SO FAST — 해상 물류 최적화 플랫폼',
  description: 'AI 기반 에코스피드 권장 및 탄소 배출 관리 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${plusJakartaSans.variable} h-full`} suppressHydrationWarning>
      <body className="h-full antialiased">
        <SWRProvider>
          <LanguageProvider>
            <ThemeProvider>
              <AuthProvider>{children}</AuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
