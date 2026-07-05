import { cn } from '@/lib/utils'

interface EmptyStateProps {
  message?: string
  className?: string
}

export function EmptyState({ message = 'No data available', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-app-text-muted border-app-border bg-app-bg/40 rounded-xl border border-dashed px-4 py-8 text-center text-sm',
        className,
      )}
    >
      {message}
    </div>
  )
}
