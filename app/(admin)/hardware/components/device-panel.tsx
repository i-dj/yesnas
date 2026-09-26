import { Card, Tooltip } from '@/components/ui'
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(24rem,100%),1fr))] gap-6">
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
  status,
  children,
}: {
  icon: LucideIcon
  title: string
  status?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="@container h-full min-w-0 p-4 sm:p-5">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="grid shrink-0 place-items-center">
            <Icon className="text-app-text-muted size-3.5" />
          </span>
          <Tooltip content={title || '-'} triggerClassName="min-w-0 flex-1">
            <p className="text-app-text block w-full truncate text-sm font-semibold">{title || '-'}</p>
          </Tooltip>
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </div>
      {children}
    </Card>
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
    <div className="grid min-w-0 gap-1.5 @min-[26rem]:grid-cols-[9rem_minmax(0,1fr)] @min-[26rem]:items-baseline @min-[26rem]:gap-4">
      <p className="text-app-text-muted flex items-center gap-1 text-sm leading-6 break-normal">
        {labelIcon}
        {label}
      </p>
      <div className="app-body-text text-app-text flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-medium [overflow-wrap:anywhere] break-words">
        {children}
      </div>
    </div>
  )
}
