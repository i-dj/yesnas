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
    <section className="grid shrink-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-3">
          <div className="flex items-center gap-4">
            <span className="bg-app-hover grid size-11 shrink-0 place-items-center rounded-lg">
              <item.icon className="text-app-text-muted size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-app-text-muted text-sm leading-5">{item.label}</p>
              <p className="text-app-text mt-1 text-sm font-semibold [overflow-wrap:anywhere]" title={item.value}>
                {item.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </section>
  )
}
