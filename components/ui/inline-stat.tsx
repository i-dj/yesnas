import { cn } from '@/lib/utils'

interface InlineStatProps {
  label: string
  value: string | number
  divided?: boolean
  className?: string
}

export function InlineStat({ label, value, divided = false, className }: InlineStatProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-baseline justify-end gap-1.5 px-3',
        divided && 'border-app-border border-l',
        className,
      )}
    >
      <span className="text-app-text text-lg leading-none font-semibold tabular-nums">{value}</span>
      <span className="text-app-text-muted whitespace-nowrap text-sm">{label}</span>
    </div>
  )
}
