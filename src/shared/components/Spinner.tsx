import { cn } from '@/shared/utils/cn'

const SIZE_CLASS = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
} as const

interface SpinnerProps {
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn('animate-spin rounded-full border-[#6366f1] border-t-transparent', SIZE_CLASS[size], className)}
    />
  )
}

export function LoadingState({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-full w-full items-center justify-center py-12', className)}>
      <Spinner size="lg" />
    </div>
  )
}

export default Spinner
