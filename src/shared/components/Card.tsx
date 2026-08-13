import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900',
        className,
      )}
      {...props}
    />
  )
}

export default Card
