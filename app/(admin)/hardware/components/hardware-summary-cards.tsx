'use client'

import { Activity, CircuitBoard, MonitorCog, Server, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Card } from '@/components/ui'
import { formatUptime } from '@/lib/utils'
import type { HardwareSnapshot } from '@/types'

export function HardwareSummaryCards({ snapshot }: { snapshot: HardwareSnapshot | null }) {
  const t = useTranslations('Hardware')
  const items: Array<{ label: string; value: string; icon: LucideIcon }> = [
    {
      label: t('summary.deviceName'),
      value: snapshot?.system.deviceName || snapshot?.system.hostname || '-',
      icon: Server,
    },
    { label: t('summary.os'), value: snapshot?.system.osVersion || '-', icon: MonitorCog },
    { label: t('summary.kernel'), value: snapshot?.system.kernelVersion || '-', icon: CircuitBoard },
    {
      label: t('summary.uptime'),
      value: snapshot
        ? formatUptime(snapshot.system.uptimeSeconds, {
            daysHours: (days, hours) => t('values.daysHours', { days, hours }),
            hours: (hours) => t('values.hours', { value: hours }),
          })
        : '-',
      icon: Activity,
    },
  ]

  return (
    <section className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-2.5">
          <div className="flex items-start gap-2.5">
            <span className="bg-app-hover grid size-8 shrink-0 place-items-center rounded-md">
              <item.icon className="text-app-text-muted size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="app-body-text text-app-text-muted">{item.label}</p>
              <p className="text-app-text mt-0.5 text-xs font-semibold break-words" title={item.value}>
                {item.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </section>
  )
}
