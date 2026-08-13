'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-[#6366f1] text-white hover:bg-[#4f46e5]',
  secondary:
    'border border-slate-200 bg-white text-slate-900 hover:border-[#6366f1]/60 hover:bg-[#6366f1]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className, disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    />
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: 'default' | 'danger'
  children: ReactNode
}

const ICON_VARIANT_CLASS: Record<'default' | 'danger', string> = {
  default: 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-950/40',
}

export function IconButton({ label, variant = 'default', className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
        ICON_VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
