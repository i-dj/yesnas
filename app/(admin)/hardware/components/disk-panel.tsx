'use client'

import { Database } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { StatusPill } from '@/components/ui'
import { formatBytes } from '@/lib/utils'
import type { HardwareDisk } from '@/types'
import { formatDiskUsage, formatOptional, formatSpeed, isHealthyDisk } from '../utils'
import { DetailValue, DevicePanel } from './device-panel'
import { SummaryMetrics } from './hardware-section'

export function DiskPanel({ disk }: { disk: HardwareDisk }) {
  const t = useTranslations('Hardware')
  const passed = isHealthyDisk(disk)

  return (
    <DevicePanel
      icon={Database}
      title={disk.model || disk.name}
      subtitle={`${disk.path} · ${formatBytes(disk.sizeBytes)}`}
      status={
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <StatusPill
            color={passed ? 'success' : 'warning'}
            content={passed ? t('statuses.passed') : disk.health || t('statuses.unknown')}
          />
          <StatusPill
            color={disk.inUse ? 'success' : 'neutral'}
            content={disk.inUse ? t('statuses.inUse') : t('statuses.unused')}
          />
        </div>
      }
    >
      <div className="grid min-w-0 gap-x-6 gap-y-2 sm:grid-cols-2">
        <DetailValue label={t('fields.devicePath')} value={disk.path || '-'} />
        <DetailValue label={t('fields.serial')} value={disk.serial || '-'} />
        <DetailValue label={t('fields.vendor')} value={disk.vendor || '-'} />
        <DetailValue label={t('fields.capacity')} value={formatBytes(disk.sizeBytes)} />
        <DetailValue label={t('fields.usage')} value={formatDiskUsage(disk.usage, t)} />
        <DetailValue label={t('fields.temperature')} value={formatOptional(disk.temperatureC, ' °C')} />
        <DetailValue
          label="SMART"
          value={
            disk.smartAvailable
              ? disk.smartPassed
                ? t('statuses.passed')
                : t('statuses.abnormal')
              : t('statuses.unsupported')
          }
        />
        <DetailValue
          label={t('fields.powerOnTime')}
          value={disk.powerOnHours === undefined ? '-' : t('values.hours', { value: disk.powerOnHours })}
        />
        <DetailValue
          label={t('fields.powerCycles')}
          value={disk.powerCycleCount === undefined ? '-' : String(disk.powerCycleCount)}
        />
        <DetailValue
          label={t('fields.realtimeIo')}
          value={t('values.readWrite', {
            read: formatSpeed(disk.readBytesPerSec),
            write: formatSpeed(disk.writeBytesPerSec),
          })}
        />
      </div>
    </DevicePanel>
  )
}

export function DiskSummary({ disks }: { disks: HardwareDisk[] }) {
  const t = useTranslations('Hardware')
  const healthyCount = disks.filter((disk) => isHealthyDisk(disk)).length
  const totalCapacity = disks.reduce((total, disk) => total + disk.sizeBytes, 0)
  const totalIo = disks.reduce((total, disk) => total + disk.readBytesPerSec + disk.writeBytesPerSec, 0)

  return (
    <SummaryMetrics
      items={[
        { label: t('overview.healthyDisks'), value: `${healthyCount}/${disks.length}` },
        { label: t('fields.totalCapacity'), value: formatBytes(totalCapacity) },
        { label: t('overview.totalIo'), value: formatSpeed(totalIo) },
      ]}
    />
  )
}
