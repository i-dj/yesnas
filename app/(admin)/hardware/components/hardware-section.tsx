import type { ComponentType, ReactNode } from 'react'

import { Card, MetricStat } from '@/components/ui'
import { cn } from '@/lib/utils'

export type DetailItem = [string, string, boolean]

export function HardwareSection({
  icon: Icon,
  accentClassName = 'text-sky-400',
  title,
  summary,
  summaryAlign = 'start',
  children,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  accentClassName?: string
  className?: string
  title: string
  summary?: ReactNode
  summaryAlign?: 'start' | 'end'
  children: ReactNode
}) {
  return (
    <Card className={cn('min-w-0 rounded-none border-b bg-transparent p-3', className)}>
      <div
        className={cn(
          'mb-3 flex min-h-8 min-w-0 flex-wrap justify-between gap-2',
          summaryAlign === 'end' ? 'items-end' : 'items-start',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid shrink-0 place-items-center rounded-md ${accentClassName}`}>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-app-text text-sm font-semibold">{title}</h2>
          </div>
        </div>
        {summary}
      </div>
      <div className="min-w-0">{children}</div>
    </Card>
  )
}

export function DetailList({ details }: { details: DetailItem[] }) {
  return (
    <dl className="grid min-w-0 gap-x-6 gap-y-2 sm:grid-cols-2">
      {details.map(([label, value, fullWidth]) => (
        <div key={label} className={fullWidth ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
          <div className="grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] items-baseline gap-2">
            <dt className="app-body-text text-app-text-muted">{label}</dt>
            <dd className="app-body-text text-app-text min-w-0 font-semibold wrap-break-word">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

export function UsageDonut({ value, percent, color }: { value: string; percent: number; color: string }) {
  const normalized = Math.max(0, Math.min(100, percent))
  return (
    <div
      className="grid size-16 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${normalized}%, var(--app-hover) 0)` }}
    >
      <div className="bg-app-bg grid size-12 place-items-center rounded-full">
        <span className="text-app-text text-xs font-semibold">{value}</span>
      </div>
    </div>
  )
}

export function SummaryMetrics({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="flex max-w-full gap-1.5 overflow-x-auto">
      {items.map((item) => (
        <MetricStat key={item.label} className="w-24 shrink-0" label={item.label} value={item.value} />
      ))}
    </div>
  )
}
