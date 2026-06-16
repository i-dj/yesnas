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
  tBorder = true,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  children: ReactNode
  tBorder?: boolean
}) {
  return (
    <section className={cn('pt-6 pb-6', tBorder && 'border-app-border border-t')}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="text-app-text-muted size-4" />
        <h3 className="app-section-title text-app-text">{title}</h3>
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
          <div className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-2">
            <dt className="app-body-text text-app-text-muted">{label}</dt>
            <dd className="app-body-text text-app-text min-w-0 font-semibold [overflow-wrap:anywhere] uppercase">
              {value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
