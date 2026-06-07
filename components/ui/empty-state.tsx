import { cn } from '@/lib/utils'

interface EmptyStateProps {
  message?: string
  className?: string
}

export function EmptyState({ message = 'No data available', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'app-body-text text-app-text-muted border-app-border bg-app-bg/40 rounded-xl border border-dashed px-4 py-8 text-center',
        className,
      )}
    >
      {message}
    </div>
  )
}
