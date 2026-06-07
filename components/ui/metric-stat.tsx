import { cn } from '@/lib/utils'

export function MetricStat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('bg-app-bg min-w-14 rounded-md px-2 py-1.5 text-center', className)}>
      <div className="text-app-text truncate text-xs font-semibold" title={value}>
        {value}
      </div>
      <div className="text-app-text-muted truncate text-[10px]" title={label}>
        {label}
      </div>
    </div>
  )
}
