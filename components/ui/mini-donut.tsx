import { cn } from '@/lib/utils'

const sizeClassMap = {
  sm: {
    outer: 'size-9',
    inner: 'size-8',
    text: 'text-[10px]',
  },
  md: {
    outer: 'size-14',
    inner: 'size-12',
    text: 'text-xs',
  },
} as const

interface MiniDonutProps {
  percent: number
  color: string
  value: string
  size?: keyof typeof sizeClassMap
  trackColor?: string
  ariaLabel?: string
  className?: string
}

export const MiniDonut = ({
  percent,
  color,
  value,
  size = 'md',
  trackColor = 'var(--card-border)',
  ariaLabel,
  className,
}: MiniDonutProps) => {
  const sizeClass = sizeClassMap[size]
  const normalized = Math.min(100, Math.max(0, percent))

  return (
    <div
      className={cn('grid shrink-0 place-items-center rounded-full', sizeClass.outer, className)}
      style={{ background: `conic-gradient(${color} ${normalized}%, ${trackColor} 0)` }}
      aria-label={ariaLabel ?? `当前负载 ${normalized}%`}
    >
      <div className={cn('bg-app-bg grid place-items-center rounded-full', sizeClass.inner)}>
        <span className={cn('text-app-text font-semibold tabular-nums', sizeClass.text)}>{value}</span>
      </div>
    </div>
  )
}
