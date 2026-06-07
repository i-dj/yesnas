import type { LucideIcon } from 'lucide-react'

import { EmptyState } from '@/components/ui'
import { DetailList, HardwareSection, UsageDonut, type DetailItem } from './hardware-section'

export function ResourceDetailCard({
  icon,
  title,
  subtitle,
  value,
  percent,
  color,
  details,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  value: string
  percent: number
  color: string
  details: DetailItem[]
}) {
  return (
    <HardwareSection icon={icon} title={title} subtitle={subtitle}>
      <div className="grid min-w-0 gap-3 sm:grid-cols-[4rem_minmax(0,1fr)] sm:items-center">
        <UsageDonut value={value} percent={percent} color={color} />
        <DetailList details={details} />
      </div>
    </HardwareSection>
  )
}

export function HardwareInfoCard({
  icon,
  accentClassName,
  title,
  subtitle,
  details,
}: {
  icon: LucideIcon
  accentClassName?: string
  title: string
  subtitle: string
  details: DetailItem[]
}) {
  return (
    <HardwareSection icon={icon} accentClassName={accentClassName} title={title} subtitle={subtitle}>
      {details.length ? (
        <DetailList details={details} />
      ) : (
        <EmptyState message={subtitle} className="border-none bg-transparent py-6" />
      )}
    </HardwareSection>
  )
}
