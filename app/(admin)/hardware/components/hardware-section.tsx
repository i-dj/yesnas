import type { ComponentType, ReactNode } from 'react'

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
  summaryAlign?: 'start' | 'end' | 'center'
  children: ReactNode
}) {
  return (
    <section className={cn('flex min-w-0 flex-col', className)}>
      <div
        className={cn(
          'mb-3 flex min-h-8 min-w-0 flex-wrap justify-between gap-x-8 gap-y-4',
          summaryAlign === 'end' ? 'items-end' : summaryAlign === 'center' ? 'items-center' : 'items-start',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid shrink-0 place-items-center rounded-lg ${accentClassName}`}>
            <Icon className="size-4" />
          </span>
          <h2 className="text-app-text min-w-0 truncate text-base font-semibold">{title}</h2>
        </div>
        {summary}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </section>
  )
}

export function HardwareSelector({
  items,
  selectedIndex,
  onSelect,
  className,
}: {
  items: string[]
  selectedIndex: number
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div
      className={cn('border-app-border/70 flex max-w-full gap-0.5 overflow-x-auto rounded-lg border p-0.5', className)}
    >
      {items.map((label, index) => (
        <button
          key={`${label}-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            'app-body-text h-7 shrink-0 rounded-lg px-2.5 font-medium transition-colors',
            selectedIndex === index ? 'bg-app-active text-app-text' : 'text-app-text-muted hover:text-app-text',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function DetailList({ details }: { details: DetailItem[] }) {
  return (
    <dl className="grid min-w-0 gap-x-8 gap-y-2.5 @min-[34rem]:grid-cols-2">
      {details.map(([label, value, fullWidth]) => (
        <div key={label} className={fullWidth ? 'min-w-0 @min-[34rem]:col-span-2' : 'min-w-0'}>
          <div className="grid min-w-0 gap-1.5 @min-[26rem]:grid-cols-[9rem_minmax(0,1fr)] @min-[26rem]:items-baseline @min-[26rem]:gap-4">
            <dt className="text-app-text-muted text-sm leading-6 break-normal">{label}</dt>
            <dd className="text-app-text min-w-0 text-sm leading-6 font-medium [overflow-wrap:anywhere]">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

export function HardwareMetrics({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid w-full min-w-0 grid-cols-1 gap-x-8 gap-y-4 min-[480px]:grid-cols-3 lg:w-auto">
      {items.map(({ label, value }) => (
        <div key={label} className="min-w-0 lg:min-w-36">
          <dt className="text-app-text-muted text-sm leading-5">{label}</dt>
          <dd className="text-app-text mt-1 text-lg leading-7 font-semibold whitespace-nowrap tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
