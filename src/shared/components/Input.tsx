'use client'

import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, id, className, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-[#6366f1] dark:border-slate-700 dark:bg-slate-800',
          error && 'border-red-300 focus:ring-red-500 dark:border-red-700',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
})

export default TextField
