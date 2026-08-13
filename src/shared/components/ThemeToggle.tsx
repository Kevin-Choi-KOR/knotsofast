'use client'

import { Sun, Moon } from 'lucide-react'
import { IconButton } from '@/shared/components/Button'
import { useTheme } from '@/features/theme/ThemeContext'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <IconButton label={theme === 'dark' ? 'light mode' : 'dark mode'} onClick={toggle} className={className}>
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </IconButton>
  )
}

export default ThemeToggle
