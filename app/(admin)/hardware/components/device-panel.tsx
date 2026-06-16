import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function DeviceGrid<T>({
  items,
  getKey,
  renderItem,
}: {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {items.map((item) => (
        <div key={getKey(item)} className="min-w-0">
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
}

export function DevicePanel({
  icon: Icon,
  title,
  subtitle,
  status,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  status?: ReactNode
  children: ReactNode
}) {
  return (
    <article className="border-app-border min-w-0 rounded-md border p-3">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid shrink-0 place-items-center">
            <Icon className="text-app-text-muted size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-app-text text-xs font-semibold wrap-break-word">{title || '-'}</p>
          </div>
        </div>
        {status}
      </div>
      {children}
    </article>
  )
}

export function DetailValue({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <DetailContent label={label} labelIcon={icon}>
      {value}
    </DetailContent>
  )
}

export function DetailContent({
  label,
  labelIcon,
  children,
}: {
  label: string
  labelIcon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-2">
      <p className="app-body-text text-app-text-muted flex items-center gap-1">
        {labelIcon}
        {label}
      </p>
      <div className="app-body-text text-app-text flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-medium [overflow-wrap:anywhere] break-words">
        {children}
      </div>
    </div>
  )
}
