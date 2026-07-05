import { cn } from '@/lib/utils'

type MetricStatVariant = 'compact' | 'panel'

export function MetricStat({
  label,
  value,
  className,
  variant = 'compact',
}: {
  label: string
  value: string
  className?: string
  variant?: MetricStatVariant
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-md text-center',
        variant === 'compact' && 'bg-app-hover/35 grid min-h-11 min-w-20 place-items-center px-3 py-1',
        variant === 'panel' && 'bg-app-bg grid place-items-center px-3 py-2',
        className,
      )}
    >
      <div
        className={cn('text-app-text truncate font-semibold', variant === 'compact' ? 'text-[14px]' : 'text-sm')}
        title={value}
      >
        {value}
      </div>
      <div
        className={cn('text-app-text-muted truncate', variant === 'compact' ? 'text-xs' : 'mt-1 text-[12px]')}
        title={label}
      >
        {label}
      </div>
    </div>
  )
}
