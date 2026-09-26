import { cn } from '@/lib/utils'

type MetricStatVariant = 'compact' | 'panel'

export type MetricStatItem = {
  label: string
  value: string
}

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
        'min-w-0',
        variant === 'compact' && 'inline-flex items-baseline justify-center gap-2 text-left',
        variant === 'panel' && 'bg-app-bg grid place-items-center px-3 py-2',
        className,
      )}
    >
      <div
        className={cn(
          'text-app-text truncate font-semibold tabular-nums',
          variant === 'compact' ? 'min-w-16 text-right text-base' : 'text-sm',
        )}
        title={value}
      >
        {value}
      </div>
      <div
        className={cn('text-app-text-muted truncate', variant === 'compact' ? 'text-sm' : 'mt-1 text-[12px]')}
        title={label}
      >
        {label}
      </div>
    </div>
  )
}

export function MetricStatGroup({
  items,
  className,
  itemClassName,
  variant = 'compact',
}: {
  items: MetricStatItem[]
  className?: string
  itemClassName?: string
  variant?: MetricStatVariant
}) {
  if (!items.length) return null

  return (
    <div
      className={cn(
        'flex max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        variant === 'compact' && 'divide-app-border items-center divide-x',
        variant === 'panel' && 'gap-1.5',
        className,
      )}
    >
      {items.map((item) => (
        <MetricStat
          key={item.label}
          className={cn(
            variant === 'compact' && 'w-44 shrink-0 px-4',
            variant === 'panel' && 'w-24 shrink-0',
            itemClassName,
          )}
          label={item.label}
          value={item.value}
          variant={variant}
        />
      ))}
    </div>
  )
}
