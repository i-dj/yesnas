import type { ComponentType, ReactNode } from 'react'

import { Card, MetricStat } from '@/components/ui'

export type DetailItem = [string, string, boolean]

export function HardwareSection({
  icon: Icon,
  accentClassName = 'bg-sky-500/10 text-sky-400',
  title,
  subtitle,
  summary,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  accentClassName?: string
  title: string
  subtitle: string
  summary?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="min-w-0 p-3">
      <div className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className={`grid size-8 shrink-0 place-items-center rounded-md ${accentClassName}`}>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-app-text text-sm font-semibold">{title}</h2>
            <p className="app-body-text text-app-text-muted mt-0.5 break-words">{subtitle || '-'}</p>
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
            <dd className="app-body-text text-app-text min-w-0 font-semibold break-words">{value}</dd>
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
      <div className="bg-app-surface grid size-12 place-items-center rounded-full">
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
