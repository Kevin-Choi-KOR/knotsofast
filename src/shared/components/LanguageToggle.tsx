'use client'

import { cn } from '@/shared/utils/cn'
import { useLanguage } from '@/features/i18n/LanguageContext'

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage()
  return (
    <div className={cn('flex items-center rounded-full bg-slate-100 p-0.5 text-xs font-medium dark:bg-slate-800', className)}>
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

export default LanguageToggle
