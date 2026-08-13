import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

const VARIANT_CLASS: Record<AlertVariant, string> = {
  error: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  success: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  info: 'bg-[#6366f1]/10 text-[#6366f1] dark:bg-[#6366f1]/15',
}

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
}

export function Alert({ variant = 'info', className, ...props }: AlertProps) {
  return <div className={cn('rounded-lg px-3 py-2 text-sm', VARIANT_CLASS[variant], className)} {...props} />
}

export default Alert
