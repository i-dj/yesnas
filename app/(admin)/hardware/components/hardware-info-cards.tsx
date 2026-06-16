import type { LucideIcon } from 'lucide-react'

import { EmptyState } from '@/components/ui'
import { DetailList, HardwareSection, type DetailItem } from './hardware-section'

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
    <HardwareSection icon={icon} accentClassName={accentClassName} title={title}>
      {details.length ? (
        <DetailList details={details} />
      ) : (
        <EmptyState message={subtitle} className="border-none bg-transparent py-6" />
      )}
    </HardwareSection>
  )
}
