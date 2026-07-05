import { cn } from '@/lib/utils'
import type { ComponentType, ReactNode } from 'react'

export type StorageDetailItem = {
  label: string
  value: ReactNode
  fullWidth?: boolean
}

export function StorageDetailSection({
  icon: Icon,
  title,
  children,
  action,
  tBorder = true,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  children: ReactNode
  action?: ReactNode
  tBorder?: boolean
}) {
  return (
    <section className={cn('pt-6 pb-3', tBorder && 'border-app-border border-t')}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="text-app-text-muted size-4" />
          <h3 className="app-section-title truncate text-sm">{title}</h3>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

export function StorageDetailList({ items, columns = 2 }: { items: StorageDetailItem[]; columns?: 2 | 3 }) {
  return (
    <dl className={cn('grid min-w-0 gap-x-6 gap-y-2.5 sm:grid-cols-2', columns === 3 && 'xl:grid-cols-3')}>
      {items.map(({ label, value, fullWidth }) => (
        <div key={label} className={cn('min-w-0', fullWidth && 'sm:col-span-2 xl:col-span-full')}>
          <div className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-baseline gap-2">
            <dt className="text-app-text-muted text-sm">{label}</dt>
            <dd className={cn('text-app-text min-w-0 text-sm wrap-anywhere')}>{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
